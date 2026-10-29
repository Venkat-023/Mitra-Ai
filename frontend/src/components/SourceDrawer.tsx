import React from 'react';
import { CitationItem, DocumentItem } from '../types';
import { X, FileText, CheckCircle2, AlertTriangle, Calendar, Layers, ShieldCheck } from 'lucide-react';

interface SourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  citation: CitationItem | null;
  documentDetails: DocumentItem | null;
  loading: boolean;
}

export const SourceDrawer: React.FC<SourceDrawerProps> = ({
  isOpen,
  onClose,
  citation,
  documentDetails,
  loading
}) => {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Source Document Verification
              </h2>
              <p className="text-xs text-slate-400">
                Grounding Evidence & Institutional Provenance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close Source Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Document Metadata Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block text-[10px] font-semibold tracking-wider uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md mb-1 border border-blue-500/20">
                  {citation.category}
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  {citation.document_title}
                </h3>
              </div>
              <span className="inline-flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Approved Policy
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Version: <strong className="text-white">{documentDetails?.version || citation.version}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Page: <strong className="text-white">{citation.page_number}</strong> {loading ? '(loading...)' : ''}</span>
              </div>
            </div>
          </div>

          {/* Cited Section Excerpt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cited Section Excerpt
              </h4>
              {citation.section_title && (
                <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {citation.section_title}
                </span>
              )}
            </div>
            
            <div className="p-4 rounded-xl bg-slate-950 border border-blue-900/40 text-slate-200 text-sm leading-relaxed font-mono whitespace-pre-wrap">
              {citation.snippet}
            </div>
            
            <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Retrieved with relevance confidence: {(citation.relevance_score * 100).toFixed(1)}%
            </p>
          </div>

          {/* Institutional Provenance Notice */}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
              <AlertTriangle className="w-4 h-4" />
              Official RVITM Institutional Source
            </div>
            This excerpt is directly retrieved from approved college documents under the administration of R V Institute of Technology and Management (VTU Affiliated). It is protected from hallucination through strict citation verification.
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            Close Source View
          </button>
        </div>

      </div>
    </div>
  );
};
