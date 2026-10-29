export type Language = 'auto' | 'en' | 'kn' | 'hi';

export interface CitationItem {
  chunk_id: string;
  document_id: string;
  document_title: string;
  category: string;
  version: string;
  section_title?: string;
  page_number: number;
  snippet: string;
  relevance_score: number;
  source_uri?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language?: string;
  status?: 'answered_with_evidence' | 'insufficient_evidence' | 'clarification_needed' | 'out_of_scope';
  citations?: CitationItem[];
  suggested_followups?: string[];
  needs_clarification?: boolean;
  retrieval_confidence?: number;
  latency_ms?: number;
  timestamp: Date;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  source_uri: string;
  file_type: string;
  language: string;
  version: string;
  effective_from: string;
  effective_until?: string;
  approval_status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'superseded';
  approved_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  is_active: boolean;
  checksum?: string;
  total_pages: number;
  chunk_count?: number;
  created_at: string;
  chunks?: DocumentChunkDetail[];
}

export interface DocumentChunkDetail {
  id: string;
  chunk_index: number;
  section_title?: string;
  page_number: number;
  content: string;
  language: string;
  token_count: number;
}

export interface AnalyticsData {
  total_documents: number;
  total_approved_documents: number;
  total_pending_documents: number;
  total_chunks: number;
  total_conversations: number;
  total_messages: number;
  unanswered_queries_count: number;
  feedback_positive_count: number;
  feedback_negative_count: number;
  language_breakdown: Record<string, number>;
  category_breakdown: Record<string, number>;
}

export interface UnansweredQuery {
  message_id: string;
  conversation_id: string;
  query_text: string;
  language?: string;
  created_at: string;
  status: string;
  retrieval_confidence?: number;
}
