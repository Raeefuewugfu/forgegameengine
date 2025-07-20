
import React from 'react';
import ReactDOM from 'react-dom';
import { Download, X, Smartphone, Zap, Package } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

interface InstallPwaModalProps {
    onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ onClose }) => {
    const { deferredInstallPrompt } = useEditorStore(state => ({
        deferredInstallPrompt: state.deferredInstallPrompt,
    }));

    const handleInstallClick = async () => {
        if (!deferredInstallPrompt) {
            return;
        }
        deferredInstallPrompt.prompt();
        // The prompt() method can only be called once.
        // We don't need to do anything with the userChoice result for now.
        // The browser will handle the installation process.
        useEditorStore.setState({ deferredInstallPrompt: null });
        onClose();
    };

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
                        <Download size={20} className="text-[var(--accent)]" />
                        <h2 className="font-semibold text-lg">Install Forge Engine</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)]">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                     <p className="text-sm text-[var(--text-secondary)]">
                        Install Forge Engine as a Progressive Web App (PWA) to get an experience that's faster, more integrated, and works offline.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Smartphone size={20} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-[var(--text-primary)]">App-like Experience</h4>
                                <p className="text-xs text-[var(--text-secondary)]">Launch directly from your desktop, taskbar, or home screen just like a native app.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Zap size={20} className="text-fuchsia-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-[var(--text-primary)]">Enhanced Performance</h4>
                                <p className="text-xs text-[var(--text-secondary)]">Assets and core engine components are cached for faster startup and smoother operation.</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3">
                            <Package size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-[var(--text-primary)]">Offline Access</h4>
                                <p className="text-xs text-[var(--text-secondary)]">Continue working on your projects even when you're not connected to the internet.</p>
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
                        Not Now
                    </button>
                    <button 
                        onClick={handleInstallClick}
                        className="flex items-center gap-2 px-6 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        <Download size={16} />
                        Install App
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
