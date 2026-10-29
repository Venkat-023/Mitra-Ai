import React, { useState } from 'react';
import { X, Key, Cpu, CheckCircle2, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState<'mock' | 'gemini' | 'openai'>(
    (localStorage.getItem('rvitm_llm_provider') as any) || 'mock'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">AI Model & API Key Configuration</h3>
              <p className="text-xs text-slate-500">Configure whether to run offline or use a live API key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Informational Answer to User Query */}
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-900 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-sky-800">
              <Sparkles className="w-4 h-4 text-sky-600" />
              Do you need an API key to run?
            </div>
            <p>
              <strong>No, an API key is not required!</strong> The system comes with a built-in deterministic provider and an ingested official RVITM demonstration knowledge base that runs completely free, offline, and grounded.
            </p>
            <p className="text-sky-700">
              You can optionally connect a <strong>Google Gemini</strong> or <strong>OpenAI</strong> API key below for open-ended live synthesis.
            </p>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Select AI Provider:</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setProvider('mock')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  provider === 'mock'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-semibold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="font-bold">Offline / Free</div>
                <div className="text-[10px] text-slate-500 mt-0.5">No key needed</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  provider === 'gemini'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-semibold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="font-bold">Google Gemini</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Gemini 1.5 Flash</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  provider === 'openai'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-semibold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="font-bold">OpenAI</div>
                <div className="text-[10px] text-slate-500 mt-0.5">GPT-4o Mini</div>
              </button>
            </div>
          </div>

          {/* API Key Input (if provider is gemini or openai) */}
          {provider !== 'mock' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>{provider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}</span>
                <span className="text-[11px] text-slate-400 font-normal">Stored safely in browser</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                You can also configure this globally on the backend in your <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">.env</code> file.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
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
