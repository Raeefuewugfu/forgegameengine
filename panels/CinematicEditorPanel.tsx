import React from 'react';
import { Video } from 'lucide-react';

export const CinematicEditorPanel: React.FC = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-secondary)]">
            <Video size={48} className="mb-4 text-[var(--accent)]/50" />
            <h3 className="font-semibold text-xl text-[var(--text-primary)] mb-2">Cinematic Editor</h3>
            <p className="text-sm max-w-sm">
                This area will contain tools for creating in-game cinematics, controlling cameras, and sequencing events. Coming soon!
            </p>
        </div>
    );
};