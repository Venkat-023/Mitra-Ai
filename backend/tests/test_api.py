import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.database import Base, get_db
from backend.app.models.document import Document, DocumentChunk, ApprovalStatus
from backend.app.services.embedding.factory import get_embedding_provider

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture
async def client_and_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    # Seed sample approved document for chat test
    async with session_factory() as session:
        emb_prov = get_embedding_provider()
        emb = await emb_prov.embed_texts(["Students must maintain 85% attendance as per VTU."])
        doc = Document(
            title="RVITM VTU Academic Regulations",
            category="academic",
            source_uri="https://rvitm.edu.in/attendance.pdf",
            approval_status=ApprovalStatus.APPROVED.value,
            is_active=True
        )
        session.add(doc)
        await session.flush()
        chunk = DocumentChunk(
            document_id=doc.id,
            chunk_index=0,
            section_title="VTU Attendance Regulations (Clause 8.1)",
            content="Students must maintain 85% attendance as per VTU regulations.",
            embedding=emb[0]
        )
        session.add(chunk)
        await session.commit()
        seeded_doc_id = doc.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, seeded_doc_id

    app.dependency_overrides.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.mark.asyncio
async def test_health_check(client_and_db):
    client, _ = client_and_db
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert data["project"] == "RVITM Mitra AI"
    assert "X-Request-ID" in resp.headers

@pytest.mark.asyncio
async def test_chat_endpoint_grounded_response(client_and_db):
    client, seeded_doc_id = client_and_db
    payload = {
        "message": "Attendance kitni honi chahiye?",
        "preferred_language": "hi"
    }
    resp = await client.post("/api/v1/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["language"] == "hi"
    assert data["status"] == "answered_with_evidence"
    assert len(data["citations"]) >= 1
    assert data["citations"][0]["document_id"] == seeded_doc_id
    assert "85%" in data["answer"]

    # Verify conversation session retrieval
    conv_id = data["conversation_id"]
    msg_resp = await client.get(f"/api/v1/conversations/{conv_id}/messages")
    assert msg_resp.status_code == 200
    messages = msg_resp.json()
    assert len(messages) == 2  # user + assistant

@pytest.mark.asyncio
async def test_feedback_submission(client_and_db):
    client, _ = client_and_db
    # Generate chat first to get message_id
    chat_resp = await client.post("/api/v1/chat", json={"message": "Attendance percentage?"})
    msg_id = chat_resp.json()["message_id"]
    conv_id = chat_resp.json()["conversation_id"]

    feedback_payload = {
        "conversation_id": conv_id,
        "message_id": msg_id,
        "rating": "positive",
        "feedback_tag": "accurate",
        "comment": "Very clear VTU attendance citation."
    }
    resp = await client.post("/api/v1/feedback", json=feedback_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["rating"] == "positive"
    assert data["escalation_required"] is False

@pytest.mark.asyncio
async def test_sources_endpoint(client_and_db):
    client, seeded_doc_id = client_and_db
    resp = await client.get(f"/api/v1/sources/{seeded_doc_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == seeded_doc_id
    assert len(data["chunks"]) >= 1

@pytest.mark.asyncio
async def test_admin_rbac_protection(client_and_db):
    client, _ = client_and_db
    # 1. Access without API Key -> 401
    unauth_resp = await client.get("/api/v1/admin/documents")
    assert unauth_resp.status_code == 401

    # 2. Access with invalid key -> 401
    bad_key_resp = await client.get("/api/v1/admin/documents", headers={"X-Admin-Key": "wrong-key"})
    assert bad_key_resp.status_code == 401

    # 3. Access with valid key -> 200
    auth_resp = await client.get("/api/v1/admin/documents", headers={"X-Admin-Key": settings.ADMIN_API_KEY})
    assert auth_resp.status_code == 200
    assert isinstance(auth_resp.json(), list)

    # 4. Analytics endpoint
    analytics_resp = await client.get("/api/v1/admin/analytics", headers={"X-Admin-Key": settings.ADMIN_API_KEY})
    assert analytics_resp.status_code == 200
    assert analytics_resp.json()["total_documents"] >= 1
