# RVITM Mitra AI — API Reference Manual (v1)

Base URL: `/api/v1`  
Interactive OpenAPI UI: `http://localhost:8000/docs`

---

## 1. Public Endpoints

### 1.1 `GET /api/v1/health`
Returns system status, version, and dependencies health.
- **Request:** None
- **Response (200 OK):**
```json
{
  "status": "online",
  "project": "RVITM Mitra AI",
  "version": "1.0.0",
  "environment": "development",
  "database": "healthy",
  "llm_provider": "mock",
  "embedding_provider": "mock",
  "multilingual_support": ["en", "hi", "kn"]
}
```

---

### 1.2 `POST /api/v1/chat`
Processes questions in English, Hindi, Kannada, or transliteration.
- **Request Body (`application/json`):**
```json
{
  "message": "Attendance eshtu irbeku?",
  "preferred_language": "kn",
  "conversation_id": "optional-uuid",
  "session_id": "sess_12345"
}
```
- **Response (200 OK):**
```json
{
  "conversation_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "message_id": "4a2c1b9e-5d8f-4e3a-9c7b-1d8f2b3e4a5c",
  "answer": "ವಿಟಿಯು ನಿಯಮಾವಳಿಗಳ (ನಿಯಮ 8.1) ಪ್ರಕಾರ, ವಿದ್ಯಾರ್ಥಿಗಳು ಪ್ರತಿ ವಿಷಯದಲ್ಲಿ ಕನಿಷ್ಠ 85% ಹಾಜರಾತಿಯನ್ನು ಹೊಂದಿರುವುದು ಕಡ್ಡಾಯವಾಗಿದೆ.",
  "language": "kn",
  "status": "answered_with_evidence",
  "citations": [
    {
      "chunk_id": "chunk-100",
      "document_id": "doc-vtu-academic",
      "document_title": "RVITM Academic Calendar & VTU Regulations 2026-27",
      "page_number": 1,
      "section_title": "2. VTU Attendance Regulations (Clause 8.1)",
      "snippet": "Students must maintain minimum aggregate attendance of 85%...",
      "relevance_score": 0.94
    }
  ],
  "suggested_followups": [
    "ಹಾಜರಾತಿ 75% ಕ್ಕಿಂತ ಕಡಿಮೆಯಾದರೆ ಏನಾಗುತ್ತದೆ?",
    "ವೈದ್ಯಕೀಯ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಯಾವಾಗ ಸಲ್ಲಿಸಬೇಕು?"
  ],
  "needs_clarification": false,
  "retrieval_confidence": 0.94,
  "latency_ms": 142.5
}
```

---

### 1.3 `POST /api/v1/feedback`
Submits student evaluation on an assistant response.
- **Request Body:**
```json
{
  "conversation_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "message_id": "4a2c1b9e-5d8f-4e3a-9c7b-1d8f2b3e4a5c",
  "rating": "positive",
  "feedback_tag": "accurate",
  "comment": "Very accurate VTU attendance answer."
}
```

---

### 1.4 `GET /api/v1/sources/{source_id}`
Retrieves source document provenance, validity dates, and indexed chunk excerpts.

---

## 2. Protected Administrative Endpoints
*Requires header: `X-Admin-Key: <ADMIN_API_KEY>` or `Authorization: Bearer <ADMIN_API_KEY>`*

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/v1/admin/documents` | Upload and ingest college circulars (PDF, MD, TXT). |
| `GET` | `/api/v1/admin/documents` | List documents filtered by status and category. |
| `POST` | `/api/v1/admin/documents/{id}/approve` | Approve document and publish to vector index. |
| `POST` | `/api/v1/admin/documents/{id}/reject` | Reject document with audit reason. |
| `POST` | `/api/v1/admin/documents/{id}/reindex` | Trigger re-chunking and vector re-embedding. |
| `GET` | `/api/v1/admin/analytics` | Retrieve document counts, conversation metrics, and satisfaction scores. |
| `GET` | `/api/v1/admin/unanswered-queries` | Review questions where calibrated abstention was triggered. |
