import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CitationItem } from '../types';
import { 
  Send, ThumbsUp, ThumbsDown, BookOpen, Sparkles,
  HelpCircle, ShieldCheck, ChevronRight, Mic, MicOff, Volume2, Square,
  Copy, Check, Clock, Calendar, Award, Building, AlertTriangle, FileText
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

const BENTO_SECTIONS = [
  {
    id: 'attendance',
    title: 'VTU Attendance Rule',
    tag: 'Clause 8.1',
    icon: Clock,
    color: 'from-amber-500/10 to-orange-500/10 border-amber-200/80 text-amber-900',
    tagColor: 'bg-amber-100 text-amber-800',
    desc: '85% mandatory aggregate. Up to 10% medical condonation allowed.',
    query: 'What is the attendance policy at RVITM according to VTU regulations?'
  },
  {
    id: 'bonafide',
    title: 'Bonafide Certificate',
    tag: 'Counter 2',
    icon: FileText,
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-200/80 text-blue-900',
    tagColor: 'bg-blue-100 text-blue-800',
    desc: 'Application procedure, document checklist & 48h turnaround time.',
    query: 'How do I apply for a Bonafide Certificate at RVITM?'
  },
  {
    id: 'exams',
    title: 'CIE & SEE Schedules',
    tag: 'Exam Cell',
    icon: Calendar,
    color: 'from-indigo-500/10 to-purple-500/10 border-indigo-200/80 text-indigo-900',
    tagColor: 'bg-indigo-100 text-indigo-800',
    desc: 'Key test dates for Odd Semester 2026-27 & minimum 40% passing standard.',
    query: 'When are the CIE-1, CIE-2, and SEE exams scheduled for 2026-27?'
  },
  {
    id: 'scholarships',
    title: 'SSP & AICTE Pragati',
    tag: '₹50,000/yr',
    icon: Award,
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-200/80 text-emerald-900',
    tagColor: 'bg-emerald-100 text-emerald-800',
    desc: 'Post-Matric scholarship eligibility and Aadhaar NPCI seeding instructions.',
    query: 'What are the eligibility criteria and documents required for SSP scholarship?'
  },
  {
    id: 'leadership',
    title: 'HoDs & Department Cabins',
    tag: 'Directory',
    icon: Building,
    color: 'from-sky-500/10 to-blue-500/10 border-sky-200/80 text-sky-900',
    tagColor: 'bg-sky-100 text-sky-800',
    desc: 'Cabin locations, HoD email addresses & administrative extensions.',
    query: 'Who are the Heads of Departments for CSE, ISE, and ECE at RVITM?'
  },
  {
    id: 'helpline',
    title: 'Anti-Ragging Helpline',
    tag: 'Toll-free 24x7',
    icon: AlertTriangle,
    color: 'from-rose-500/10 to-pink-500/10 border-rose-200/80 text-rose-900',
    tagColor: 'bg-rose-100 text-rose-800',
    desc: 'Zero tolerance policy & 24x7 emergency grievance contacts.',
    query: 'What is the anti-ragging policy and emergency helpline number at RVITM?'
  }
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    <div className="flex-1 flex flex-col h-[calc(100vh-5.5rem)] max-w-5xl w-full mx-auto px-3 sm:px-6">
      
      {/* Scrollable Chat History */}
      <div className="flex-1 overflow-y-auto py-3 sm:py-6 space-y-6">
        
        {/* Welcome Empty State with Orbital Gyro Mitra AI Companion */}
        {messages.length === 0 && (
          <div className="max-w-3xl mx-auto text-center py-4 sm:py-8 px-2 sm:px-4 animate-fade-in space-y-6">
            
            {/* Innovative Orbital Gyro Visualizer */}
            <div className="relative inline-flex items-center justify-center p-6">
              
              {/* Outer Orbiting Gyro Ring */}
              <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-dashed border-indigo-300/60 animate-orbit pointer-events-none">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></span>
              </div>

              {/* Inner Reverse Gyro Ring */}
              <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-sky-300/50 animate-orbit-reverse pointer-events-none">
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-sky-400"></span>
              </div>

              {/* Central Pulsating Core */}
              <div 
                onClick={isListening ? handleStopMic : handleStartMic}
                className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 p-1 shadow-xl shadow-indigo-500/25 cursor-pointer transition-transform duration-300 hover:scale-105 ${
                  isListening || speakingMessageId ? 'voice-orb-active' : ''
                }`}
                title={isListening ? "Listening... Click to stop" : "Click to speak with Mitra AI"}
              >
                <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center p-2 text-center select-none">
                  {isListening ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1 bg-indigo-600 rounded-full wave-bar [animation-delay:0.1s]"></span>
                      <span className="w-1 bg-indigo-600 rounded-full wave-bar [animation-delay:0.3s]"></span>
                      <span className="w-1 bg-indigo-600 rounded-full wave-bar [animation-delay:0.5s]"></span>
                    </div>
                  ) : (
                    <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
                  )}
                  <span className="text-[10px] font-extrabold text-indigo-950 mt-1 uppercase tracking-wider">
                    {isListening ? 'Listening' : 'Mitra AI'}
                  </span>
                </div>
              </div>
            </div>

            {/* Welcome Headings */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80 mb-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                OpenRouter Live Model Connected
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                How may I assist your campus journey?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Source-grounded college intelligence for R V Institute of Technology & Management. Ask or speak in <strong className="text-indigo-950">English</strong>, <strong className="text-indigo-950">ಕನ್ನಡ</strong>, or <strong className="text-indigo-950">हिन्दी</strong>.
              </p>
            </div>

            {/* Creative Bento Inquiry Matrix */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 px-1">
                <span>Explore Institutional Knowledge</span>
                <span className="text-indigo-600 font-semibold normal-case">Click any card to ask instantly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-left">
                {BENTO_SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => onSendMessage(sec.query)}
                      className={`bento-card p-4 rounded-2xl group flex flex-col justify-between border transition-all ${sec.color}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 rounded-xl bg-white shadow-xs text-indigo-600">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sec.tagColor}`}>
                            {sec.tag}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-950 transition-colors">
                          {sec.title}
                        </h3>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                          {sec.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-semibold text-indigo-700">
                        <span>Ask Mitra</span>
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
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
              className={`max-w-2xl sm:max-w-3xl rounded-3xl px-5 sm:px-6 py-4.5 transition-all ${
                msg.role === 'user'
                  ? 'bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-700 text-white rounded-br-none shadow-md shadow-indigo-500/15'
                  : 'motion-card text-slate-800 rounded-bl-none'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between text-xs mb-2.5 font-medium">
                <span className={msg.role === 'user' ? 'text-indigo-100 font-semibold' : 'text-slate-800 font-bold flex items-center gap-1.5'}>
                  {msg.role === 'user' ? (
                    'You'
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      RVITM Mitra AI
                    </>
                  )}
                </span>
                
                {/* Actions Dock: Audio Player, Copy, Time */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSpeak(msg.id, msg.content, msg.language || currentLanguage)}
                      className={`px-2.5 py-1 rounded-xl text-xs transition-colors flex items-center gap-1.5 ${
                        speakingMessageId === msg.id
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/80 bg-slate-50'
                      }`}
                      title={speakingMessageId === msg.id ? "Stop voice readout" : "Listen to audio readout"}
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <div className="flex items-center gap-0.5 h-3">
                            <span className="w-0.5 bg-white rounded-full wave-bar"></span>
                            <span className="w-0.5 bg-white rounded-full wave-bar [animation-delay:0.2s]"></span>
                            <span className="w-0.5 bg-white rounded-full wave-bar [animation-delay:0.4s]"></span>
                          </div>
                          <span className="text-[10px]">Speaking</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-[10px] font-semibold">Listen</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors"
                      title="Copy response text"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {msg.latency_ms && (
                      <span className="text-[10px] text-slate-400 ml-1 font-mono">
                        {(msg.latency_ms / 1000).toFixed(2)}s
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap selection:bg-indigo-100 font-normal">
                {msg.content}
              </div>

              {/* Verified Source Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Source Grounding ({msg.citations.length})
                    </span>
                    <span className="text-[10px] text-slate-400 normal-case">Click to preview document snippet</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((cit, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => onSelectCitation(cit)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50/90 hover:bg-sky-100 border border-sky-200 text-sky-950 text-xs font-semibold transition-all shadow-2xs group"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-sky-600 group-hover:scale-105 transition-transform" />
                        <span className="truncate max-w-[200px] sm:max-w-[260px]">
                          {cit.document_title}
                        </span>
                        <span className="bg-sky-200/80 text-sky-900 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                          p.{cit.page_number}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Recommendations */}
              {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-amber-500" />
                    Recommended Follow-up Questions
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggested_followups.map((f, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => onSendMessage(f)}
                        className="text-xs text-slate-700 hover:text-indigo-950 bg-slate-50 hover:bg-indigo-50/90 px-3 py-1.5 rounded-xl transition-all text-left font-medium border border-slate-200/60 shadow-2xs"
                      >
                        • {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Controls */}
              {msg.role === 'assistant' && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[10px] font-semibold text-slate-500">
                    {msg.status === 'answered_with_evidence' && '✅ Grounded in RVITM Policy'}
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
            <div className="px-5 py-4 rounded-3xl rounded-bl-none motion-card text-slate-700 text-sm flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs text-slate-600 font-semibold">
                OpenRouter synthesis with verified RVITM citations in progress...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Listening Active Wave Bar */}
      {isListening && (
        <div className="mb-2 p-3.5 motion-glass rounded-2xl flex items-center justify-between animate-fade-in border-indigo-200/80 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-indigo-600 rounded-full wave-bar [animation-delay:0.1s]"></span>
              <span className="w-1 bg-indigo-600 rounded-full wave-bar [animation-delay:0.3s]"></span>
              <span className="w-1 bg-indigo-600 rounded-full wave-bar [animation-delay:0.5s]"></span>
              <span className="w-1 bg-indigo-600 rounded-full wave-bar [animation-delay:0.2s]"></span>
              <span className="w-1 bg-indigo-600 rounded-full wave-bar [animation-delay:0.4s]"></span>
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-950">Listening live...</span>
              <p className="text-[11px] text-indigo-800 italic truncate max-w-md">
                {voiceTranscript || "Speak now in English, Kannada, or Hindi..."}
              </p>
            </div>
          </div>
          <button
            onClick={handleStopMic}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
          >
            Done
          </button>
        </div>
      )}

      {micError && (
        <div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex justify-between items-center shadow-xs">
          <span>{micError}</span>
          <button onClick={() => setMicError(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Quick Topic Chips above Omni-Dock */}
      <div className="hidden sm:flex items-center justify-center gap-2 pb-1.5">
        <button
          onClick={() => onSendMessage("What is the minimum attendance requirement at RVITM?")}
          className="text-[11px] font-semibold text-slate-600 hover:text-indigo-800 bg-white/80 hover:bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs transition-all"
        >
          ⚡ Attendance Rule
        </button>
        <button
          onClick={() => onSendMessage("How do I apply for a Bonafide Certificate at RVITM?")}
          className="text-[11px] font-semibold text-slate-600 hover:text-indigo-800 bg-white/80 hover:bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs transition-all"
        >
          📜 Bonafide Form
        </button>
        <button
          onClick={() => onSendMessage("When are CIE-1 and SEE exams scheduled?")}
          className="text-[11px] font-semibold text-slate-600 hover:text-indigo-800 bg-white/80 hover:bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs transition-all"
        >
          🎓 Exam Dates
        </button>
        <button
          onClick={() => onSendMessage("What are the SSP scholarship criteria?")}
          className="text-[11px] font-semibold text-slate-600 hover:text-indigo-800 bg-white/80 hover:bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs transition-all"
        >
          💰 Scholarships
        </button>
      </div>

      {/* Floating Glass Dock Input Bar */}
      <div className="pb-3 pt-1">
        <form onSubmit={handleSubmit} className="relative flex items-center motion-glass rounded-2xl sm:rounded-3xl p-1.5 shadow-xl shadow-indigo-950/5 border border-white/80">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything or click mic to speak in English, Kannada, or Hindi..."
            disabled={isLoading}
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-xs sm:text-sm pl-4 pr-24 py-3 focus:outline-none font-medium"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            {/* Voice Input Mic Button */}
            <button
              type="button"
              onClick={isListening ? handleStopMic : handleStartMic}
              title={isListening ? "Stop listening" : "Speak to Mitra AI (Voice Agent)"}
              className={`p-2.5 rounded-xl sm:rounded-2xl transition-all shadow-xs ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-500/20"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
        <p className="text-[10px] text-center text-slate-500 mt-2 font-medium">
          Source-grounded in RVITM circulars & VTU regulations. Powered by OpenRouter live model.
        </p>
      </div>

      {/* Detailed Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
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
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
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


