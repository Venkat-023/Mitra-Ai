import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CitationItem } from '../types';
import { 
  Send, ThumbsUp, ThumbsDown, BookOpen, Sparkles,
  HelpCircle, ShieldCheck, ChevronRight
} from 'lucide-react';
import { submitFeedback } from '../services/api';

interface ChatFeedProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onSelectCitation: (citation: CitationItem) => void;
  conversationId: string | null;
}

const SAMPLE_SUGGESTIONS = [
  { label: 'Attendance Rules', query: 'Attendance kitni honi chahiye?' },
  { label: 'ಹಾಜರಾತಿ ನಿಯಮಗಳು', query: 'Attendance eshtu irbeku?' },
  { label: 'Bonafide Certificate', query: 'How do I apply for a Bonafide Certificate at RVITM?' },
  { label: 'ಪರೀಕ್ಷಾ ಅರ್ಜಿ', query: 'Exam form submit madodu elli?' },
  { label: 'SSP Scholarships', query: 'What are the SSP scholarship eligibility criteria?' },
  { label: 'CSE Department HoD', query: 'Who is the Head of Department for CSE?' },
];

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onSelectCitation,
  conversationId
}) => {
  const [inputText, setInputText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState<Record<string, 'positive' | 'negative'>>({});
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null);
  const [feedbackTag, setFeedbackTag] = useState<string>('accurate');
  const [feedbackComment, setFeedbackComment] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleFeedback = async (messageId: string, rating: 'positive' | 'negative') => {
    if (!conversationId) return;
    try {
      await submitFeedback(conversationId, messageId, rating);
      setFeedbackSent(prev => ({ ...prev, [messageId]: rating }));
    } catch (e) {
      console.error('Feedback submission error', e);
    }
  };

  const handleDetailedFeedback = async (messageId: string) => {
    if (!conversationId) return;
    try {
      await submitFeedback(conversationId, messageId, 'negative', feedbackTag, feedbackComment);
      setFeedbackSent(prev => ({ ...prev, [messageId]: 'negative' }));
      setShowFeedbackModal(null);
      setFeedbackComment('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4.5rem)] max-w-5xl w-full mx-auto px-4 sm:px-6">
      
      {/* Scrollable Chat History */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        
        {/* Welcome Empty State */}
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-12 px-4 animate-fade-in space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-900/40 border border-blue-400/20">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Welcome to RVITM Mitra AI
              </h2>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
                Official, source-grounded college assistant for R V Institute of Technology & Management. Ask questions in <strong className="text-slate-200">English</strong>, <strong className="text-slate-200">ಕನ್ನಡ</strong>, or <strong className="text-slate-200">हिन्दी</strong>, including transliterated campus queries.
              </p>
            </div>

            {/* Quick Suggestions */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Suggested Student Questions
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SAMPLE_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.query)}
                    className="text-left px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-blue-500/50 text-slate-300 hover:text-white text-xs transition-all flex items-center gap-1.5 shadow-sm group"
                  >
                    <span>{item.query}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Feed */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
          >
            <div
              className={`max-w-2xl sm:max-w-3xl rounded-2xl px-5 py-4 shadow-md ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                <span>{msg.role === 'user' ? 'You' : 'RVITM Mitra AI'}</span>
                {msg.latency_ms && (
                  <span className="text-[10px] text-slate-400">
                    {(msg.latency_ms / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap selection:bg-blue-800">
                {msg.content}
              </div>

              {/* Citations Cards (Only on assistant messages) */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-700/60">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Official Citations ({msg.citations.length})
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((cit, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => onSelectCitation(cit)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-950 border border-blue-500/30 hover:border-blue-400 text-blue-300 hover:text-blue-200 text-xs font-medium transition-all shadow-sm"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate max-w-[200px] sm:max-w-[260px]">
                          {cit.document_title}
                        </span>
                        <span className="bg-blue-950 text-blue-300 text-[10px] px-1.5 py-0.5 rounded border border-blue-800">
                          p.{cit.page_number}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Suggestions */}
              {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/40">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-amber-400" />
                    Suggested Next Steps
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggested_followups.map((f, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => onSendMessage(f)}
                        className="text-xs text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors text-left"
                      >
                        • {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Controls (For assistant responses) */}
              {msg.role === 'assistant' && (
                <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px] text-slate-400">
                    {msg.status === 'answered_with_evidence' && '✅ Source Verified'}
                    {msg.status === 'insufficient_evidence' && '⚠️ Insufficient Evidence'}
                    {msg.status === 'clarification_needed' && 'ℹ️ Clarification Requested'}
                    {msg.status === 'out_of_scope' && '🚫 Non-College Question'}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleFeedback(msg.id, 'positive')}
                      className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${
                        feedbackSent[msg.id] === 'positive' ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                      title="Helpful and accurate"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowFeedbackModal(msg.id)}
                      className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${
                        feedbackSent[msg.id] === 'negative' ? 'text-rose-400' : 'text-slate-400'
                      }`}
                      title="Report inaccuracy or missing source"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-2 animate-fade-in">
            <div className="px-5 py-4 rounded-2xl rounded-bl-none bg-slate-800/80 border border-slate-700 text-slate-300 text-sm flex items-center space-x-3">
              <div className="flex space-x-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Searching verified RVITM documents & generating grounded response...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="pb-4 pt-2">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about RVITM policies, attendance, bonafide certificates, exams, or contacts..."
            disabled={isLoading}
            className="w-full bg-slate-800/95 border border-slate-700 text-white placeholder-slate-400 text-sm rounded-2xl pl-5 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xl transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2.5 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all shadow-md"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[11px] text-center text-slate-400 mt-2">
          Responses are strictly grounded in approved RVITM official circulars. Check source cards for verification.
        </p>
      </div>

      {/* Detailed Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Report Inaccurate or Incomplete Response</h3>
            <p className="text-xs text-slate-400">
              Help us improve RVITM Mitra AI. What was the issue with this response?
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Issue Category:</label>
              <select
                value={feedbackTag}
                onChange={(e) => setFeedbackTag(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5"
              >
                <option value="inaccurate">Inaccurate Policy / Rule</option>
                <option value="missing_citation">Missing or Incorrect Citation</option>
                <option value="language_error">Language / Translation Issue</option>
                <option value="outdated">Outdated College Information</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Additional Comments (Optional):</label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Describe what was incorrect..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowFeedbackModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDetailedFeedback(showFeedbackModal)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
