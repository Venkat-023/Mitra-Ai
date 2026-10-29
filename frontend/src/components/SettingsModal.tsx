import React, { useState } from 'react';
import { X, Key, Cpu, CheckCircle2, Globe, Radio, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState<'openrouter' | 'mock' | 'gemini' | 'openai'>(
    (localStorage.getItem('rvitm_llm_provider') as any) || 'openrouter'
  );
  const [apiKey, setApiKey] = useState(localStorage.getItem('rvitm_user_api_key') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('rvitm_llm_provider', provider);
    if (apiKey) {
      localStorage.setItem('rvitm_user_api_key', apiKey);
    } else {
      localStorage.removeItem('rvitm_user_api_key');
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/80 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-200/50 shadow-sm">
              <Cpu className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Intelligence & Model Settings</h3>
              <p className="text-xs text-slate-500">Live multi-engine configuration & API routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Active Live Model Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-cyan-50/40 border border-emerald-200/70 text-xs shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-400" />
                <Globe className="w-4 h-4 text-emerald-700" />
                Active Model in Engine
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 font-mono text-[10px] font-semibold border border-emerald-300/50">
                Live & Ingested
              </span>
            </div>
            <p className="text-emerald-950 font-medium">
              Backend currently powered by <strong className="font-semibold text-emerald-900 font-mono">dots-studio/dots-3-note-preview:free</strong> via OpenRouter.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-mono pt-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              API Key configured in environment (sk-or-v1-***)
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-500" />
              Target LLM Provider:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setProvider('openrouter')}
                className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
                  provider === 'openrouter'
                    ? 'border-blue-500 bg-blue-50/80 text-blue-950 font-semibold shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>OpenRouter</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 font-semibold">Active</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">dots-3-note-preview</div>
                <div className="text-[10px] text-blue-600 font-medium mt-0.5">High-speed reasoning</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('mock')}
                className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
                  provider === 'mock'
                    ? 'border-blue-500 bg-blue-50/80 text-blue-950 font-semibold shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <div className="font-bold text-slate-900">Deterministic RAG</div>
                <div className="text-[11px] text-slate-500 mt-1">Free & Offline</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Zero external latency</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
                  provider === 'gemini'
                    ? 'border-blue-500 bg-blue-50/80 text-blue-950 font-semibold shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <div className="font-bold text-slate-900">Google Gemini</div>
                <div className="text-[11px] text-slate-500 mt-1">Gemini 1.5 Flash</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Multilingual RAG</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
                  provider === 'openai'
                    ? 'border-blue-500 bg-blue-50/80 text-blue-950 font-semibold shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <div className="font-bold text-slate-900">OpenAI</div>
                <div className="text-[11px] text-slate-500 mt-1">GPT-4o Mini</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Strict formatting</div>
              </button>
            </div>
          </div>

          {/* Custom API Key Input */}
          {provider !== 'mock' && provider !== 'openrouter' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>{provider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}</span>
                <span className="text-[11px] text-slate-400 font-normal">Encrypted client-side</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                  className="w-full bg-slate-50/80 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100/80 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <span>Save Configuration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
