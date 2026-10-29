import re
from typing import List, Optional
from pydantic import BaseModel
from backend.app.core.config import settings
from backend.app.services.ingestion.parser import ParsedDocument, ParsedSection

class ChunkResult(BaseModel):
    chunk_index: int
    section_title: str
    page_number: int
    content: str
    token_count: int
    language: str

class SemanticChunker:
    """
    Splits parsed document sections into grounded chunks respecting paragraph,
    sentence, and token boundaries while preserving section titles and page numbers.
    """

    def __init__(self, target_chunk_size: Optional[int] = None, overlap: Optional[int] = None):
        # Target in words (~0.75 words per token)
        # 500 tokens ~ 375 words; 80 tokens overlap ~ 60 words
        token_size = target_chunk_size or settings.CHUNK_SIZE
        token_overlap = overlap or settings.CHUNK_OVERLAP
        
        self.target_words = int(token_size * 0.75)
        self.overlap_words = int(token_overlap * 0.75)

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Heuristic estimation for Indic and Latin multilingual text."""
        # Indic scripts often have higher token-to-word ratio (e.g. 1 word = 1.5 - 2.5 subwords)
        words = text.split()
        indic_chars = len(re.findall(r'[\u0900-\u0CFF]', text))
        base_tokens = len(words)
        indic_bonus = int(indic_chars * 0.5)
        return max(base_tokens + indic_bonus, 1)

    def chunk_document(self, parsed_doc: ParsedDocument) -> List[ChunkResult]:
        chunks: List[ChunkResult] = []
        chunk_index = 0

        for page in parsed_doc.pages:
            # If page has structured sections, chunk within sections
            target_sections = page.sections if page.sections else [
                ParsedSection(section_title=f"Page {page.page_number}", content=page.text, page_number=page.page_number)
            ]

            for sec in target_sections:
                content = sec.content.strip()
                if not content:
                    continue

                sec_chunks = self._chunk_section(sec.section_title, content, page.page_number, parsed_doc.detected_language)
                for c_text in sec_chunks:
                    chunks.append(ChunkResult(
                        chunk_index=chunk_index,
                        section_title=sec.section_title,
                        page_number=page.page_number,
                        content=c_text,
                        token_count=self.estimate_tokens(c_text),
                        language=parsed_doc.detected_language
                    ))
                    chunk_index += 1

        return chunks

    def _chunk_section(self, section_title: str, text: str, page_number: int, language: str) -> List[str]:
        # Split text into paragraphs
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
        if not paragraphs:
            paragraphs = [text.strip()]

        chunks: List[str] = []
        current_words: List[str] = []

        for para in paragraphs:
            para_words = para.split()
            if len(current_words) + len(para_words) <= self.target_words:
                current_words.extend(para_words)
            else:
                # If adding this paragraph exceeds target, flush current if sufficient size
                if current_words:
                    chunks.append(" ".join(current_words))
                    # Retain overlap words
                    overlap = current_words[-self.overlap_words:] if len(current_words) > self.overlap_words else []
                    current_words = list(overlap)

                # If the paragraph itself is larger than target_words, split by sentences
                if len(para_words) > self.target_words:
                    sentences = re.split(r'(?<=[.!?।])\s+', para)
                    for sent in sentences:
                        sent_words = sent.split()
                        if len(current_words) + len(sent_words) <= self.target_words:
                            current_words.extend(sent_words)
                        else:
                            if current_words:
                                chunks.append(" ".join(current_words))
                                overlap = current_words[-self.overlap_words:] if len(current_words) > self.overlap_words else []
                                current_words = list(overlap)
                            current_words.extend(sent_words)
                else:
                    current_words.extend(para_words)

        if current_words:
            chunk_str = " ".join(current_words).strip()
            if chunk_str:
                chunks.append(chunk_str)

        return chunks if chunks else [text]
