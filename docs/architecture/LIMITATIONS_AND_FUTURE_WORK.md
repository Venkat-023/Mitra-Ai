# RVITM Mitra AI — Known Limitations & Future Work

In accordance with Section 4 (Mandatory Engineering Principles), this document transparently records current operational boundaries and future enhancements for RVITM Mitra AI.

---

## 1. Current System Limitations

1. **Demonstration Knowledge Base:**
   - The repository currently contains verified institutional demonstration files marked `[DEMONSTRATION ONLY - PENDING OFFICIAL RVITM VERIFICATION]`. In production, official signed college handbooks and fee circulars from the Principal's office must be uploaded through the Admin Portal.
2. **Private Student Data Excluded by Design:**
   - To prevent identity and grade leakage, personal student marks, USN transcripts, fee payment receipts, and individual attendance records are intentionally excluded from the public RAG index.
3. **OCR on Low-Resolution Scans:**
   - Scanned PDFs with resolution below 150 DPI or handwritten notices require human pre-processing or cloud OCR (Tesseract / Google Cloud Vision) before chunking.
4. **Indic Speech-to-Text (STT):**
   - Current input is text-based (Unicode and Romanized Latin). Audio speech input in colloquial Kannada/Hindi is planned for the next major milestone.

---

## 2. Future Engineering Roadmap

- **Phase 15 (Planned): Integration with VTU Examination Portal APIs**
  - Authenticated student login via VTU USN and college credentials to fetch personalized CIE marks and hall ticket status securely outside the public LLM context.
- **Phase 16 (Planned): Multilingual Speech Interface (Voice Mitra)**
  - WebRTC integration with Whisper-large-v3 and IndicWav2Vec for Kannada and Hindi voice queries.
- **Phase 17 (Planned): Fine-Tuned Domain Embeddings**
  - Fine-tuning BGE-M3 or sentence-transformers on engineering terminology specific to VTU and Karnataka State education guidelines.
