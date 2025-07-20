
import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore, ActionHistoryItem } from '../../store/editorStore';
import { ChevronDown, Clock } from 'lucide-react';

export const ActionHistoryDropdown: React.FC = () => {
    const { actionHistory } = useEditorStore(state => ({
        actionHistory: state.actionHistory
    }));
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const latestAction = actionHistory[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!latestAction) {
        return null;
    }

    return (
        <div ref={wrapperRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-transparent rounded-full text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-panel)] hover:border-[var(--border-color)] transition-colors"
            >
                <Clock size={14} />
                <span className="truncate max-w-[200px]">{latestAction.name}</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-lg shadow-2xl p-1.5 z-50 animate-fade-in">
                    {actionHistory.map(item => (
                        <button
                            key={item.timestamp}
                            onClick={() => {
                                item.action();
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-md text-sm text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
