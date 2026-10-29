"""Initial schema for RVITM Mitra AI

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-29

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('source_uri', sa.String(length=512), nullable=False),
        sa.Column('file_type', sa.String(length=32), nullable=False),
        sa.Column('language', sa.String(length=16), nullable=False),
        sa.Column('version', sa.String(length=32), nullable=False),
        sa.Column('effective_from', sa.DateTime(timezone=True), nullable=False),
        sa.Column('effective_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('approval_status', sa.String(length=32), nullable=False),
        sa.Column('approved_by', sa.String(length=128), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('checksum', sa.String(length=64), nullable=True),
        sa.Column('total_pages', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('doc_metadata', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_documents_title', 'documents', ['title'])
    op.create_index('ix_documents_category', 'documents', ['category'])
    op.create_index('ix_documents_approval_status', 'documents', ['approval_status'])
    op.create_index('ix_documents_is_active', 'documents', ['is_active'])

    # 2. document_chunks table
    op.create_table(
        'document_chunks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('document_id', sa.String(length=36), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('section_title', sa.String(length=255), nullable=True),
        sa.Column('page_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('language', sa.String(length=16), nullable=False),
        sa.Column('embedding', sa.JSON(), nullable=True),
        sa.Column('token_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('chunk_metadata', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_document_chunks_document_id', 'document_chunks', ['document_id'])
    op.create_index('idx_chunk_doc_idx', 'document_chunks', ['document_id', 'chunk_index'], unique=True)

    # 3. conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('session_id', sa.String(length=128), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('preferred_language', sa.String(length=16), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_conversations_session_id', 'conversations', ['session_id'])

    # 4. messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('conversation_id', sa.String(length=36), nullable=False),
        sa.Column('role', sa.String(length=16), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('query_language', sa.String(length=16), nullable=True),
        sa.Column('response_language', sa.String(length=16), nullable=True),
        sa.Column('question_category', sa.String(length=64), nullable=True),
        sa.Column('answerability_status', sa.String(length=32), nullable=False),
        sa.Column('citations', sa.JSON(), nullable=False),
        sa.Column('suggested_followups', sa.JSON(), nullable=False),
        sa.Column('retrieval_confidence', sa.Float(), nullable=True),
        sa.Column('latency_ms', sa.Float(), nullable=True),
        sa.Column('execution_metadata', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_messages_conversation_id', 'messages', ['conversation_id'])

    # 5. feedback table
    op.create_table(
        'feedback',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('conversation_id', sa.String(length=36), nullable=False),
        sa.Column('message_id', sa.String(length=36), nullable=False),
        sa.Column('rating', sa.String(length=16), nullable=False),
        sa.Column('feedback_tag', sa.String(length=32), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('escalation_required', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('reviewed', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('reviewed_by', sa.String(length=128), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feedback_conversation_id', 'feedback', ['conversation_id'])
    op.create_index('ix_feedback_message_id', 'feedback', ['message_id'])
    op.create_index('ix_feedback_escalation_required', 'feedback', ['escalation_required'])
    op.create_index('ix_feedback_reviewed', 'feedback', ['reviewed'])

    # 6. audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('actor', sa.String(length=128), nullable=False),
        sa.Column('target_type', sa.String(length=64), nullable=False),
        sa.Column('target_id', sa.String(length=128), nullable=True),
        sa.Column('details', sa.JSON(), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('ix_audit_logs_actor', 'audit_logs', ['actor'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('feedback')
    op.drop_table('messages')
    op.drop_table('conversations')
    op.drop_table('document_chunks')
    op.drop_table('documents')
