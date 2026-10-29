import io
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from pypdf import PdfReader

class ParsedSection(BaseModel):
    section_title: str
    content: str
    page_number: int

class ParsedPage(BaseModel):
    page_number: int
    text: str
    sections: List[ParsedSection] = []

class ParsedDocument(BaseModel):
    title: str
    file_type: str
    total_pages: int
    pages: List[ParsedPage]
    detected_language: str = "en"
    is_scanned: bool = False
    metadata: Dict[str, Any] = {}

class DocumentParser:
    """Parses PDF, Markdown, and Text documents with page and section preservation."""

    @staticmethod
    def detect_indic_script(text: str) -> str:
        """Detects whether text is primarily Kannada, Devanagari (Hindi), or English/Latin."""
        kannada_chars = len(re.findall(r'[\u0C80-\u0CFF]', text))
        devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
        total_len = max(len(text.strip()), 1)

        if kannada_chars / total_len > 0.15:
            return "kn"
        elif devanagari_chars / total_len > 0.15:
            return "hi"
        return "en"

    def parse_bytes(self, content_bytes: bytes, filename: str) -> ParsedDocument:
        ext = filename.lower().split(".")[-1] if "." in filename else "txt"
        
        if ext == "pdf":
            return self._parse_pdf(content_bytes, filename)
        elif ext in ["md", "markdown"]:
            return self._parse_markdown(content_bytes.decode("utf-8", errors="replace"), filename)
        elif ext in ["txt", "text", "csv"]:
            return self._parse_text(content_bytes.decode("utf-8", errors="replace"), filename)
        else:
            raise ValueError(f"Unsupported document format: .{ext}. Supported formats: .pdf, .md, .txt")

    def _parse_pdf(self, content_bytes: bytes, filename: str) -> ParsedDocument:
        try:
            reader = PdfReader(io.BytesIO(content_bytes))
        except Exception as e:
            raise ValueError(f"Malformed or corrupt PDF file: {str(e)}")

        total_pages = len(reader.pages)
        if total_pages == 0:
            raise ValueError("Document contains 0 pages.")

        pages: List[ParsedPage] = []
        full_text = ""
        total_extracted_chars = 0

        for page_idx, page in enumerate(reader.pages):
            page_num = page_idx + 1
            extracted = page.extract_text() or ""
            extracted = extracted.strip()
            total_extracted_chars += len(extracted)
            full_text += extracted + "\n"

            sections = self._split_text_into_sections(extracted, page_num)
            pages.append(ParsedPage(
                page_number=page_num,
                text=extracted,
                sections=sections
            ))

        avg_chars_per_page = total_extracted_chars / total_pages
        is_scanned = avg_chars_per_page < 30  # Threshold indicating image/scanned PDF

        # Determine title from PDF metadata or filename
        pdf_title = None
        if reader.metadata and reader.metadata.title:
            pdf_title = reader.metadata.title.strip()
        title = pdf_title or filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

        return ParsedDocument(
            title=title,
            file_type="pdf",
            total_pages=total_pages,
            pages=pages,
            detected_language=self.detect_indic_script(full_text),
            is_scanned=is_scanned,
            metadata={"producer": reader.metadata.producer if reader.metadata else None}
        )

    def _parse_markdown(self, text: str, filename: str) -> ParsedDocument:
        if not text.strip():
            raise ValueError("Markdown document is empty.")

        sections: List[ParsedSection] = []
        lines = text.splitlines()
        current_title = "Overview"
        current_buffer = []

        # Find document title from first # heading or filename
        doc_title = None

        for line in lines:
            heading_match = re.match(r'^(#{1,4})\s+(.+)$', line)
            if heading_match:
                if not doc_title and heading_match.group(1) == "#":
                    doc_title = heading_match.group(2).strip()
                
                if current_buffer:
                    section_content = "\n".join(current_buffer).strip()
                    if section_content:
                        sections.append(ParsedSection(
                            section_title=current_title,
                            content=section_content,
                            page_number=1
                        ))
                    current_buffer = []
                current_title = heading_match.group(2).strip()
            else:
                current_buffer.append(line)

        if current_buffer:
            section_content = "\n".join(current_buffer).strip()
            if section_content:
                sections.append(ParsedSection(
                    section_title=current_title,
                    content=section_content,
                    page_number=1
                ))

        if not doc_title:
            doc_title = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

        return ParsedDocument(
            title=doc_title,
            file_type="markdown",
            total_pages=1,
            pages=[ParsedPage(page_number=1, text=text, sections=sections)],
            detected_language=self.detect_indic_script(text),
            is_scanned=False
        )

    def _parse_text(self, text: str, filename: str) -> ParsedDocument:
        if not text.strip():
            raise ValueError("Text document is empty.")

        sections = self._split_text_into_sections(text, 1)
        doc_title = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

        return ParsedDocument(
            title=doc_title,
            file_type="text",
            total_pages=1,
            pages=[ParsedPage(page_number=1, text=text, sections=sections)],
            detected_language=self.detect_indic_script(text),
            is_scanned=False
        )

    def _split_text_into_sections(self, text: str, page_number: int) -> List[ParsedSection]:
        """Splits page text into logical sections based on numbered or titled lines."""
        if not text:
            return []
        
        lines = text.split("\n")
        sections: List[ParsedSection] = []
        current_title = f"Page {page_number} General"
        current_lines = []

        for line in lines:
            trimmed = line.strip()
            # Detect section heading pattern e.g. "1. Introduction", "Section A:", "Clause 3.2"
            if re.match(r'^((\d+[\.\)]|[A-Z][\.\)]|Section|Clause|Rule|Part)\s+[A-Za-z0-9\s\-]{3,60}|[A-Z\s]{4,40}:)$', trimmed):
                if current_lines:
                    sections.append(ParsedSection(
                        section_title=current_title,
                        content="\n".join(current_lines).strip(),
                        page_number=page_number
                    ))
                    current_lines = []
                current_title = trimmed
            else:
                current_lines.append(line)

        if current_lines:
            sections.append(ParsedSection(
                section_title=current_title,
                content="\n".join(current_lines).strip(),
                page_number=page_number
            ))

        return sections
