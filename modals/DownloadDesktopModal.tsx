
import React from 'react';
import ReactDOM from 'react-dom';
import { Cpu, X, DownloadCloud, Sparkles, BoxSelect } from 'lucide-react';

interface DownloadDesktopModalProps {
    onClose: () => void;
}

export const DownloadDesktopModal: React.FC<DownloadDesktopModalProps> = ({ onClose }) => {
    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-panel)] w-full max-w-lg rounded-lg shadow-2xl border border-[var(--border-color)] flex flex-col animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                     <div className="flex items-center gap-3">
                        <Cpu size={20} className="text-[var(--accent)]" />
                        <h2 className="font-semibold text-lg">Download Desktop App</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)]">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                     <p className="text-sm text-[var(--text-secondary)]">
                        Unlock the full potential of Forge Engine with the native desktop application. It's more powerful, built for creating AAA games, and includes cutting-edge features not available in the web version.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Sparkles size={20} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-[var(--text-primary)]">Real-Time Ray Tracing</h4>
                                <p className="text-xs text-[var(--text-secondary)]">Achieve photorealistic lighting, shadows, and reflections with our hardware-accelerated ray tracing pipeline.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <BoxSelect size={20} className="text-fuchsia-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-[var(--text-primary)]">Nanite Virtualized Geometry</h4>
                                <p className="text-xs text-[var(--text-secondary)]">Render massive, film-quality scenes with billions of polygons without performance loss.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 bg-[var(--bg-dark)]/50 border-t border-[var(--border-color)] rounded-b-lg">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-white/10 transition-colors"
                    >
                        Maybe Later
                    </button>
                    <button 
                        // In a real app, this would trigger a download
                        className="flex items-center gap-2 px-6 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        <DownloadCloud size={16} />
                        Download for Desktop
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};