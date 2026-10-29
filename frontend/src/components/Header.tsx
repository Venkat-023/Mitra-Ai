import React from 'react';
import { Language } from '../types';
import { Globe, ShieldCheck, Compass, MessageSquareText, Volume2, VolumeX, Settings, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'chat' | 'workflows' | 'admin';
  onTabChange: (tab: 'chat' | 'workflows' | 'admin') => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  activeTab,
  onTabChange,
  autoSpeak,
  onToggleAutoSpeak,
  onOpenSettings
}) => {
  return (
    <header className="w-full max-w-6xl mx-auto motion-glass rounded-2xl sm:rounded-3xl border border-white/80 shadow-lg shadow-indigo-950/5 transition-all">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Institutional Branding */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group select-none" 
            onClick={() => onTabChange('chat')}
          >
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-sm tracking-wide group-hover:scale-105 transition-transform duration-300">
                RV
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  RVITM Mitra AI
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shimmer-badge text-indigo-700 border border-indigo-200/60">
                    <Sparkles className="w-2.5 h-2.5 mr-1 text-indigo-600" />
                    Campus AI
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-tight">
                ಆರ್.ವಿ.ಐ.ಟಿ.ಎಂ ಮಿತ್ರ • Grounded College Intelligence
              </p>
            </div>
          </div>

          {/* MotionSites Liquid Pill Navigation */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
            <button
              onClick={() => onTabChange('chat')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'motion-pill-active'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assistant</span>
            </button>

            <button
              onClick={() => onTabChange('workflows')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'workflows'
                  ? 'motion-pill-active'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Campus Services</span>
            </button>

            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'motion-pill-active'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Governance</span>
            </button>
          </nav>

          {/* Right Controls: Auto-Voice, AI Settings, Language Selector */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Auto-Speech Toggle */}
            <button
              onClick={onToggleAutoSpeak}
              title={autoSpeak ? "Voice Output Active (Mitra will read out answers)" : "Voice Output Muted"}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold ${
                autoSpeak
                  ? 'bg-indigo-50/90 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-white/60 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-white'
              }`}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4 text-indigo-600 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden lg:inline">{autoSpeak ? 'Voice On' : 'Muted'}</span>
            </button>

            {/* AI Provider & API Settings */}
            <button
              onClick={onOpenSettings}
              title="AI Provider Engine & Keys"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/70 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs flex items-center gap-1.5 text-xs font-semibold"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden xl:inline">AI Engine</span>
            </button>

            {/* Trilingual Language Selector */}
            <div className="relative inline-flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                aria-label="Select Assistant Response Language"
                value={currentLanguage}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-white/90 border border-slate-200/90 text-slate-800 text-xs rounded-xl pl-8 pr-7 py-2 font-semibold cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-white transition-all"
              >
                <option value="auto">🌐 Auto (ಸ್ವಯಂ)</option>
                <option value="en">🇬🇧 English</option>
                <option value="kn">🇮🇳 ಕನ್ನಡ</option>
                <option value="hi">🇮🇳 हिन्दी</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Nav Tabs */}
      <div className="flex md:hidden border-t border-slate-200/60 bg-white/70 backdrop-blur-sm px-3 py-2 justify-around rounded-b-2xl">
        <button
          onClick={() => onTabChange('chat')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
            activeTab === 'chat' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500'
          }`}
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => onTabChange('workflows')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
            activeTab === 'workflows' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Services</span>
        </button>
        <button
          onClick={() => onTabChange('admin')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
            activeTab === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-500'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
};

