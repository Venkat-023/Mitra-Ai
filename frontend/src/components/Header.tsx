import React from 'react';
import { Language } from '../types';
import { Globe, ShieldCheck, Compass, MessageSquareText } from 'lucide-react';

interface HeaderProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'chat' | 'workflows' | 'admin';
  onTabChange: (tab: 'chat' | 'workflows' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  activeTab,
  onTabChange
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Institutional Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('chat')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-800 to-amber-600 flex items-center justify-center shadow-lg shadow-blue-900/30 border border-blue-400/20">
              <span className="font-bold text-white text-base sm:text-lg tracking-wider">RV</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
                  RVITM Mitra AI
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                    Verified
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                ಆರ್.ವಿ.ಐ.ಟಿ.ಎಂ ಮಿತ್ರ • आरवीआईटीएम मित्र • RSST Trust
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={() => onTabChange('chat')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/40'
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Assistant</span>
            </button>

            <button
              onClick={() => onTabChange('workflows')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'workflows'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/40'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Campus Services</span>
            </button>

            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          </nav>

          {/* Trilingual Language Selector */}
          <div className="flex items-center space-x-3">
            <div className="relative inline-flex items-center">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                aria-label="Select Assistant Response Language"
                value={currentLanguage}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-lg pl-9 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium cursor-pointer transition-colors"
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
      <div className="flex md:hidden border-t border-slate-800 bg-slate-900/95 px-4 py-2 justify-around">
        <button
          onClick={() => onTabChange('chat')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium ${
            activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => onTabChange('workflows')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium ${
            activeTab === 'workflows' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Services</span>
        </button>
        <button
          onClick={() => onTabChange('admin')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium ${
            activeTab === 'admin' ? 'bg-amber-600 text-white' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
};
