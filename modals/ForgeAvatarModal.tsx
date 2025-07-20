
import React from 'react';
import ReactDOM from 'react-dom';
import { User, X, Sliders, Palette, Shirt } from 'lucide-react';

interface ForgeAvatarModalProps {
    onClose: () => void;
}

export const ForgeAvatarModal: React.FC<ForgeAvatarModalProps> = ({ onClose }) => {
    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-panel)] w-full max-w-2xl rounded-lg shadow-2xl border border-[var(--border-color)] flex flex-col animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                     <div className="flex items-center gap-3">
                        <User size={20} className="text-[var(--accent)]" />
                        <h2 className="font-semibold text-lg">ForgeAvatar Creator</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)]">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col items-center justify-center bg-[var(--bg-dark)] rounded-lg p-6 border border-[var(--border-color)]">
                        <div className="w-48 h-48 bg-black/20 rounded-full flex items-center justify-center mb-4">
                            <User size={96} className="text-[var(--text-secondary)]" />
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">Avatar Preview</p>
                    </div>
                    <div className="space-y-6">
                        <h3 className="font-semibold text-[var(--text-primary)]">Customize Your Avatar</h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Use the tools to create a unique avatar. This feature is coming soon!
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <Sliders size={18} className="text-cyan-400" />
                                <span className="text-sm">Body & Face</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <Palette size={18} className="text-fuchsia-400" />
                                <span className="text-sm">Colors & Skin Tones</span>
                            </div>
                             <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <Shirt size={18} className="text-green-400" />
                                <span className="text-sm">Clothing & Accessories</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 bg-[var(--bg-dark)]/50 border-t border-[var(--border-color)] rounded-b-lg">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};