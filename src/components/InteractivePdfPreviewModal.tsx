import React from 'react';
import { X, FileText, Download } from 'lucide-react';

interface InteractivePdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractivePdfPreviewModal: React.FC<InteractivePdfPreviewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#0b0d18] border border-cyan-500/30 p-6 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col w-full max-w-3xl h-[80vh] relative" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-cyan-400 font-bold text-sm tracking-widest uppercase">Sovereign Dossier Preview</h3>
              <p className="text-[10px] text-zinc-500 font-mono">DOC-SOV-HSM-1010-2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-xs text-cyan-300 transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span>Download Signed PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 bg-black/50 border border-white/5 rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="text-center space-y-4 max-w-md p-6">
            <div className="w-16 h-16 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 flex items-center justify-center mx-auto mb-2 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
              <FileText className="w-8 h-8 text-cyan-500/50" />
            </div>
            <h4 className="text-zinc-200 font-medium font-sans">Cryptographic PDF Generation Required</h4>
            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
              The Sovereign Dossier contains highly classified Merkle proofs and must be cryptographically assembled via the client-side PDF engine (jspdf). 
              In the PWA offline environment, this document is dynamically generated using the cached verification JSON schemas.
            </p>
            <div className="pt-4 flex justify-center">
              <button 
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                onClick={() => alert('Generating offline cryptographic payload... (Mock)')}
              >
                <span>Assemble Immutable PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
