import { Language, DocumentItem, AnalyticsData, UnansweredQuery } from '../types';

const API_BASE = '/api/v1';

export async function sendChatMessage(
  message: string,
  preferredLanguage: Language = 'auto',
  conversationId?: string,
  sessionId?: string
): Promise<{
  conversation_id: string;
  message_id: string;
  answer: string;
  language: string;
  status: string;
  citations: any[];
  suggested_followups: string[];
  needs_clarification: boolean;
  retrieval_confidence?: number;
  latency_ms?: number;
}> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      preferred_language: preferredLanguage === 'auto' ? null : preferredLanguage,
      conversation_id: conversationId,
      session_id: sessionId
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function submitFeedback(
  conversationId: string,
  messageId: string,
  rating: 'positive' | 'negative',
  feedbackTag?: string,
  comment?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: conversationId,
      message_id: messageId,
      rating,
      feedback_tag: feedbackTag,
      comment
    })
  });
  return res.json();
}

export async function getSourceDocument(sourceId: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/sources/${sourceId}`);
  if (!res.ok) {
    throw new Error(`Failed to load source document (Status ${res.status})`);
  }
  return res.json();
}

// Administrative API calls
export async function fetchAdminDocuments(token: string): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/admin/documents`, {
    headers: { 'X-Admin-Key': token }
  });
  if (!res.ok) throw new Error('Unauthorized or failed to fetch documents');
  return res.json();
}

export async function approveDocument(token: string, docId: string, notes?: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/admin/documents/${docId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': token },
    body: JSON.stringify({ approved_by: 'admin@rvitm.edu.in', notes })
  });
  if (!res.ok) throw new Error('Failed to approve document');
  return res.json();
}

export async function rejectDocument(token: string, docId: string, reason: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/admin/documents/${docId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': token },
    body: JSON.stringify({ reviewed_by: 'admin@rvitm.edu.in', rejection_reason: reason })
  });
  if (!res.ok) throw new Error('Failed to reject document');
  return res.json();
}

export async function reindexDocument(token: string, docId: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/admin/documents/${docId}/reindex`, {
    method: 'POST',
    headers: { 'X-Admin-Key': token }
  });
  if (!res.ok) throw new Error('Failed to reindex document');
  return res.json();
}

export async function uploadAdminDocument(token: string, formData: FormData): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/admin/documents`, {
    method: 'POST',
    headers: { 'X-Admin-Key': token },
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function fetchAdminAnalytics(token: string): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/admin/analytics`, {
    headers: { 'X-Admin-Key': token }
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchUnansweredQueries(token: string): Promise<UnansweredQuery[]> {
  const res = await fetch(`${API_BASE}/admin/unanswered-queries`, {
    headers: { 'X-Admin-Key': token }
  });
  if (!res.ok) throw new Error('Failed to fetch unanswered queries');
  return res.json();
}
