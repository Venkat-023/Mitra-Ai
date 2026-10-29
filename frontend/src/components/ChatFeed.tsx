import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CitationItem } from '../types';
import { 
  Send, ThumbsUp, ThumbsDown, BookOpen, Sparkles,
  HelpCircle, ShieldCheck, ChevronRight, Mic, MicOff, Volume2, Square
} from 'lucide-react';
import { submitFeedback } from '../services/api';
import { voiceAgent } from '../services/voice';

interface ChatFeedProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onSelectCitation: (citation: CitationItem) => void;
  conversationId: string | null;
  autoSpeak: boolean;
  currentLanguage: string;
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
  conversationId,
  autoSpeak,
  currentLanguage
}) => {
  const [inputText, setInputText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState<Record<string, 'positive' | 'negative'>>({});
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null);
  const [feedbackTag, setFeedbackTag] = useState<string>('accurate');
  const [feedbackComment, setFeedbackComment] = useState('');
  
  // Voice Agent State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-speak new assistant message if autoSpeak is enabled
  useEffect(() => {
    if (autoSpeak && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.content) {
        handleSpeak(lastMsg.id, lastMsg.content, lastMsg.language || currentLanguage);
      }
    }
  }, [messages, autoSpeak]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    if (isListening) {
      handleStopMic();
    }
    onSendMessage(inputText);
    setInputText('');
  };

  const handleStartMic = () => {
    setMicError(null);
    setVoiceTranscript('');
    const started = voiceAgent.startListening(
      currentLanguage,
      (transcript, isFinal) => {
        setVoiceTranscript(transcript);
        setInputText(transcript);
        if (isFinal) {
          setIsListening(false);
        }
      },
      () => {
        setIsListening(false);
      },
      (error) => {
        setMicError(error);
        setIsListening(false);
      }
    );
    if (started) {
      setIsListening(true);
    }
  };

  const handleStopMic = () => {
    voiceAgent.stopListening();
    setIsListening(false);
  };

  const handleSpeak = (msgId: string, text: string, lang: string = 'en') => {
    if (speakingMessageId === msgId) {
      voiceAgent.stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(msgId);
      voiceAgent.speak(
        text,
        lang,
        undefined,
        () => setSpeakingMessageId(null)
      );
    }
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
          <div className="max-w-2xl mx-auto text-center py-10 px-4 animate-fade-in space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 border border-blue-200">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome to RVITM Mitra AI
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
                Official, source-grounded college assistant for R V Institute of Technology & Management. Ask questions via text or <strong className="text-blue-700">voice</strong> in <strong className="text-slate-800">English</strong>, <strong className="text-slate-800">ಕನ್ನಡ</strong>, or <strong className="text-slate-800">हिन्दी</strong>.
              </p>
            </div>

            {/* Quick Suggestions */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Suggested Student Questions
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SAMPLE_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.query)}
                    className="text-left px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50/70 border border-slate-200/90 hover:border-blue-400 text-slate-700 hover:text-blue-800 text-xs font-medium transition-all flex items-center gap-2 shadow-sm group"
                  >
                    <span>{item.query}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
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
              className={`max-w-2xl sm:max-w-3xl rounded-3xl px-6 py-4.5 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-blue-500/15'
                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none shadow-sm shadow-slate-100'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                <span className={msg.role === 'user' ? 'text-blue-100 font-semibold' : 'text-slate-600 font-bold'}>
                  {msg.role === 'user' ? 'You' : 'RVITM Mitra AI'}
                </span>
                
                {/* Voice Playback Button for Assistant */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSpeak(msg.id, msg.content, msg.language || currentLanguage)}
                      className={`p-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                        speakingMessageId === msg.id
                          ? 'bg-blue-100 text-blue-700 font-semibold'
                          : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
                      }`}
                      title={speakingMessageId === msg.id ? "Stop voice playback" : "Listen to answer (Text-to-Speech)"}
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span className="text-[10px]">Speaking...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Listen</span>
                        </>
                      )}
                    </button>
                    {msg.latency_ms && (
                      <span className="text-[10px] text-slate-400">
                        • {(msg.latency_ms / 1000).toFixed(2)}s
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap selection:bg-blue-100">
                {msg.content}
              </div>

              {/* Citations Cards (Only on assistant messages) */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Official Sources ({msg.citations.length})
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((cit, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => onSelectCitation(cit)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50/80 hover:bg-sky-100 border border-sky-200 text-sky-900 text-xs font-semibold transition-all shadow-2xs hover:shadow-sm"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                        <span className="truncate max-w-[200px] sm:max-w-[260px]">
                          {cit.document_title}
                        </span>
                        <span className="bg-sky-200 text-sky-900 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                          p.{cit.page_number}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Suggestions */}
              {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-amber-500" />
                    Suggested Next Steps
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggested_followups.map((f, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => onSendMessage(f)}
                        className="text-xs text-slate-700 hover:text-blue-800 bg-slate-100 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors text-left font-medium border border-slate-200/60"
                      >
                        • {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Controls (For assistant responses) */}
              {msg.role === 'assistant' && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] font-medium text-slate-500">
                    {msg.status === 'answered_with_evidence' && '✅ Source Grounded'}
                    {msg.status === 'insufficient_evidence' && '⚠️ Insufficient Evidence (Abstained)'}
                    {msg.status === 'clarification_needed' && 'ℹ️ Clarification Needed'}
                    {msg.status === 'out_of_scope' && '🚫 Non-College Question'}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleFeedback(msg.id, 'positive')}
                      className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors ${
                        feedbackSent[msg.id] === 'positive' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'
                      }`}
                      title="Helpful and accurate"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowFeedbackModal(msg.id)}
                      className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors ${
                        feedbackSent[msg.id] === 'negative' ? 'text-rose-600 bg-rose-50' : 'text-slate-400'
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
            <div className="px-5 py-4 rounded-3xl rounded-bl-none bg-white border border-slate-200 text-slate-600 text-sm flex items-center space-x-3 shadow-sm">
              <div className="flex space-x-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Searching verified RVITM documents & generating grounded response...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Listening Wave Indicator */}
      {isListening && (
        <div className="mb-2 p-3 bg-blue-50/90 border border-blue-200 rounded-2xl flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-blue-600 rounded-full wave-bar [animation-delay:0.1s]"></span>
              <span className="w-1 bg-blue-600 rounded-full wave-bar [animation-delay:0.3s]"></span>
              <span className="w-1 bg-blue-600 rounded-full wave-bar [animation-delay:0.5s]"></span>
              <span className="w-1 bg-blue-600 rounded-full wave-bar [animation-delay:0.2s]"></span>
              <span className="w-1 bg-blue-600 rounded-full wave-bar [animation-delay:0.4s]"></span>
            </div>
            <div>
              <span className="text-xs font-bold text-blue-900">Listening to your voice...</span>
              <p className="text-[11px] text-blue-700 italic truncate max-w-md">
                {voiceTranscript || "Speak now in English, Kannada, or Hindi..."}
              </p>
            </div>
          </div>
          <button
            onClick={handleStopMic}
            className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      )}

      {micError && (
        <div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex justify-between items-center">
          <span>{micError}</span>
          <button onClick={() => setMicError(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="pb-4 pt-2">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about attendance, bonafide certificates, exams, or click mic to speak..."
            disabled={isLoading}
            className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm rounded-2xl pl-5 pr-24 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            {/* Voice Input Mic Button */}
            <button
              type="button"
              onClick={isListening ? handleStopMic : handleStartMic}
              title={isListening ? "Stop listening" : "Speak to Mitra AI (Voice Agent)"}
              className={`p-2 rounded-xl transition-all shadow-xs ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
        <p className="text-[11px] text-center text-slate-500 mt-2">
          Responses are strictly grounded in official RVITM circulars. Click <strong>Listen</strong> on any response to hear voice output.
        </p>
      </div>

      {/* Detailed Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Report Inaccurate or Incomplete Response</h3>
            <p className="text-xs text-slate-500">
              Help us improve RVITM Mitra AI. What was the issue with this response?
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-700 font-semibold">Issue Category:</label>
              <select
                value={feedbackTag}
                onChange={(e) => setFeedbackTag(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl p-2.5 font-medium"
              >
                <option value="inaccurate">Inaccurate Policy / Rule</option>
                <option value="missing_citation">Missing or Incorrect Citation</option>
                <option value="language_error">Language / Translation Issue</option>
                <option value="outdated">Outdated College Information</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-700 font-semibold">Additional Comments (Optional):</label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Describe what was incorrect..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl p-2.5"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowFeedbackModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDetailedFeedback(showFeedbackModal)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
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
