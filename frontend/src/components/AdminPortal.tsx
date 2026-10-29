import React, { useState } from 'react';
import { 
  ShieldCheck, Upload, CheckCircle2, XCircle, RefreshCw, 
  Lock, AlertCircle
} from 'lucide-react';
import { DocumentItem, AnalyticsData, UnansweredQuery } from '../types';
import { 
  fetchAdminDocuments, approveDocument, rejectDocument, reindexDocument, 
  uploadAdminDocument, fetchAdminAnalytics, fetchUnansweredQueries 
} from '../services/api';

export const AdminPortal: React.FC = () => {
  const [adminKey, setAdminKey] = useState<string>(localStorage.getItem('rvitm_admin_key') || 'admin-rvitm-demo-key-2026');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data states
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [unanswered, setUnanswered] = useState<UnansweredQuery[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'documents' | 'upload' | 'analytics' | 'unanswered'>('documents');

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>('academic');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadVersion, setUploadVersion] = useState<string>('1.0.0');
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const docs = await fetchAdminDocuments(adminKey);
      setDocuments(docs);
      localStorage.setItem('rvitm_admin_key', adminKey);
      setIsAuthenticated(true);
      loadDashboardData(adminKey);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid Admin Key');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (token: string) => {
    try {
      const [docs, stats, unans] = await Promise.all([
        fetchAdminDocuments(token),
        fetchAdminAnalytics(token),
        fetchUnansweredQueries(token)
      ]);
      setDocuments(docs);
      setAnalytics(stats);
      setUnanswered(unans);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  const handleApprove = async (docId: string) => {
    try {
      await approveDocument(adminKey, docId, 'Verified and approved by Administrator');
      loadDashboardData(adminKey);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReject = async (docId: string) => {
    const reason = prompt('Please enter the reason for rejection:');
    if (!reason) return;
    try {
      await rejectDocument(adminKey, docId, reason);
      loadDashboardData(adminKey);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReindex = async (docId: string) => {
    try {
      await reindexDocument(adminKey, docId);
      alert('Document chunks successfully reindexed into vector store.');
      loadDashboardData(adminKey);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setLoading(true);
    setUploadMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', uploadCategory);
      formData.append('version', uploadVersion);
      if (uploadTitle) formData.append('title', uploadTitle);
      formData.append('auto_approve', String(autoApprove));

      await uploadAdminDocument(adminKey, formData);
      setUploadMessage('Document uploaded and queued successfully!');
      setUploadFile(null);
      setUploadTitle('');
      loadDashboardData(adminKey);
      setActiveAdminTab('documents');
    } catch (err: any) {
      setUploadMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Login view if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">RVITM Administrator Portal</h2>
            <p className="text-xs text-slate-400">
              Restricted management area for document governance, vector re-indexing, and query audit.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Admin API Key</label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter Administrator Token..."
                required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default Demo Key: admin-rvitm-demo-key-2026</p>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access Administration Console'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 overflow-y-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            RVITM Knowledge Governance Console
          </h2>
          <p className="text-xs text-slate-400">
            Authenticated as <strong className="text-slate-300">admin@rvitm.edu.in</strong>
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveAdminTab('documents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeAdminTab === 'documents' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeAdminTab === 'upload' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload New
          </button>
          <button
            onClick={() => setActiveAdminTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeAdminTab === 'analytics' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveAdminTab('unanswered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeAdminTab === 'unanswered' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Unanswered ({unanswered.length})
          </button>
        </div>
      </div>

      {/* TAB 1: DOCUMENTS MANAGEMENT */}
      {activeAdminTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-300">Document Repository & Vector Status</h3>
            <button
              onClick={() => loadDashboardData(adminKey)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-2">Ver</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Chunks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{d.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{d.source_uri}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {d.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-400">{d.version}</td>
                    <td className="py-3 px-3">
                      {d.approval_status === 'approved' && (
                        <span className="inline-flex items-center text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                        </span>
                      )}
                      {d.approval_status === 'pending_approval' && (
                        <span className="inline-flex items-center text-[11px] text-amber-400 font-medium">
                          <AlertCircle className="w-3 h-3 mr-1" /> Pending
                        </span>
                      )}
                      {d.approval_status === 'rejected' && (
                        <span className="inline-flex items-center text-[11px] text-rose-400 font-medium">
                          <XCircle className="w-3 h-3 mr-1" /> Rejected
                        </span>
                      )}
                      {d.approval_status === 'superseded' && (
                        <span className="text-[11px] text-slate-500">Superseded</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{d.chunk_count || 0}</td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {d.approval_status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleApprove(d.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(d.id)}
                            className="px-2.5 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-medium text-[11px]"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {d.approval_status === 'approved' && (
                        <button
                          onClick={() => handleReindex(d.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
                        >
                          Re-index
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD DOCUMENT */}
      {activeAdminTab === 'upload' && (
        <div className="max-w-xl mx-auto bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Upload className="w-5 h-5 text-amber-400" />
              Ingest Institutional Policy Document
            </h3>
            <p className="text-xs text-slate-400">
              Upload PDF, Markdown, or Text files. Extracted text is semantically chunked, vector embedded, and queued for approval.
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Select File (*.pdf, *.md, *.txt)</label>
              <input
                type="file"
                accept=".pdf,.md,.markdown,.txt"
                onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs"
                >
                  <option value="academic">Academic & VTU</option>
                  <option value="examination">Examination & CIE</option>
                  <option value="administration">Administration</option>
                  <option value="scholarships">Scholarships</option>
                  <option value="student_welfare">Student Welfare</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Version</label>
                <input
                  type="text"
                  value={uploadVersion}
                  onChange={(e) => setUploadVersion(e.target.value)}
                  placeholder="e.g. 1.0.0"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Document Title (Optional Override)</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. RVITM Academic Calendar 2026-27"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="auto_approve_check"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
              />
              <label htmlFor="auto_approve_check" className="text-xs text-slate-300">
                Immediately approve and publish to vector search index
              </label>
            </div>

            {uploadMessage && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-amber-300">
                {uploadMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !uploadFile}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing & Embedding Chunks...' : 'Upload & Ingest Document'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: ANALYTICS */}
      {activeAdminTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-xs text-slate-400">Total Documents</div>
              <div className="text-2xl font-bold text-white mt-1">{analytics.total_documents}</div>
              <div className="text-[11px] text-emerald-400 mt-1">{analytics.total_approved_documents} Approved</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-xs text-slate-400">Indexed Chunks</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">{analytics.total_chunks}</div>
              <div className="text-[11px] text-slate-500 mt-1">pgvector Embeddings</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-xs text-slate-400">Conversations</div>
              <div className="text-2xl font-bold text-white mt-1">{analytics.total_conversations}</div>
              <div className="text-[11px] text-slate-500 mt-1">{analytics.total_messages} Messages</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-xs text-slate-400">Student Satisfaction</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {analytics.feedback_positive_count + analytics.feedback_negative_count > 0
                  ? `${Math.round((analytics.feedback_positive_count / (analytics.feedback_positive_count + analytics.feedback_negative_count)) * 100)}%`
                  : '100%'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{analytics.feedback_positive_count} Up / {analytics.feedback_negative_count} Down</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: UNANSWERED QUERIES AUDIT */}
      {activeAdminTab === 'unanswered' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-300">Unanswered Queries & Evidence Gaps</h3>
            <p className="text-xs text-slate-500">Queries where calibrated abstention was triggered due to insufficient evidence</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            {unanswered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No unanswered queries logged yet. All student questions matched approved institutional sources!
              </div>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {unanswered.map((u) => (
                  <div key={u.message_id} className="p-4 hover:bg-slate-800/30 transition-colors flex justify-between items-center">
                    <div>
                      <div className="font-medium text-white">{u.query_text}</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Language: {u.language} • {new Date(u.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Abstained Safely
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
