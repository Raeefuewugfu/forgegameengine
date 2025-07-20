import React from 'react';
import { Dna } from 'lucide-react';

export const GeneratingWorldModal: React.FC = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
        <div className="bg-[var(--bg-panel)] p-8 rounded-lg shadow-2xl border border-[var(--border-color)] flex flex-col items-center gap-4">
            <Dna size={48} className="text-[var(--accent)] animate-spin" style={{ animationDuration: '3s' }} />
            <p className="text-lg font-semibold">Generating World...</p>
            <p className="text-sm text-[var(--text-secondary)]">Please wait, this may take a moment.</p>
        </div>
    </div>
);
