import React from 'react';
import { Language } from '../types';
import { Globe, ShieldCheck, Compass, MessageSquareText, Volume2, VolumeX, Settings } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Institutional Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('chat')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-600 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-100">
              <span className="font-bold text-white text-base sm:text-lg tracking-wider">RV</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  RVITM Mitra AI
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                    Verified
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ಆರ್.ವಿ.ಐ.ಟಿ.ಎಂ ಮಿತ್ರ • आरवीआईटीएम मित्र • RSST Trust
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => onTabChange('chat')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <MessageSquareText className="w-4 h-4 text-blue-600" />
              <span>Assistant</span>
            </button>

            <button
              onClick={() => onTabChange('workflows')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'workflows'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Campus Services</span>
            </button>

            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-amber-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Admin Portal</span>
            </button>
          </nav>

          {/* Right Controls: Voice Toggle, Settings, Language Selector */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Auto-Speech Toggle */}
            <button
              onClick={onToggleAutoSpeak}
              title={autoSpeak ? "Auto-Voice: Enabled (Agent will speak answers)" : "Auto-Voice: Disabled"}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-medium ${
                autoSpeak
                  ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
              }`}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden lg:inline">{autoSpeak ? 'Voice On' : 'Voice Off'}</span>
            </button>

            {/* AI Settings Modal Toggle */}
            <button
              onClick={onOpenSettings}
              title="AI Provider & API Key Settings"
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Trilingual Language Selector */}
            <div className="relative inline-flex items-center">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                aria-label="Select Assistant Response Language"
                value={currentLanguage}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold cursor-pointer shadow-sm transition-all"
              >
                <option value="auto">🌐 Auto Detect (ಸ್ವಯಂ)</option>
                <option value="en">🇬🇧 English</option>
                <option value="kn">🇮🇳 ಕನ್ನಡ (Kannada)</option>
                <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Nav Tabs */}
      <div className="flex md:hidden border-t border-slate-200 bg-white/95 px-4 py-2 justify-around shadow-sm">
        <button
          onClick={() => onTabChange('chat')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
            activeTab === 'chat' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500'
          }`}
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => onTabChange('workflows')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
            activeTab === 'workflows' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Services</span>
        </button>
        <button
          onClick={() => onTabChange('admin')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
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
