
import React from 'react';
import ReactDOM from 'react-dom';
import { Dna, X, Book, Users, Github } from 'lucide-react';

interface AboutModalProps {
    onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-panel)] w-full max-w-md rounded-lg shadow-2xl border border-[var(--border-color)] flex flex-col animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <h2 className="font-semibold text-lg">About Forge Engine</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)]">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col items-center text-center">
                    <Dna size={48} className="text-[var(--accent)] mb-4" />
                    <h1 className="text-2xl font-bold">Forge Engine</h1>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">Version 0.1.0-alpha</p>
                    <p className="text-sm max-w-sm mb-6">
                        An interactive game engine editor built with WebGL, React, and a passion for creation.
                    </p>

                    <div className="w-full h-px bg-[var(--border-color)] my-2" />
                    
                    <div className="flex items-center justify-center gap-4 mt-4">
                         <a href="#" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                            <Book size={16} /> Documentation
                        </a>
                         <a href="#" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                            <Users size={16} /> Community
                        </a>
                         <a href="#" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                            <Github size={16} /> GitHub
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 bg-[var(--bg-dark)]/50 border-t border-[var(--border-color)] rounded-b-lg">
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
