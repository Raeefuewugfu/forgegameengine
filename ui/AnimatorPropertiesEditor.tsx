import React, { useState, useRef, useEffect } from 'react';
import { AnimatorComponent } from '../../types';
import { useEditorStore } from '../../store/editorStore';
import { Bot, MoreHorizontal } from 'lucide-react';

interface AnimatorPropertiesEditorProps {
    objectId: string;
    disabled?: boolean;
}

export const AnimatorPropertiesEditor: React.FC<AnimatorPropertiesEditorProps> = ({ objectId, disabled = false }) => {
    const { removeComponent, engine } = useEditorStore(state => ({
        removeComponent: state.removeComponent,
        engine: state.engine
    }));
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const object = engine?.getObjectById(objectId);
    const properties = object?.animator;
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!properties) return null;

    return (
        <div className={`p-3 bg-[var(--bg-dark)] rounded-lg border border-[var(--border-color)] space-y-3 ${disabled ? 'opacity-60' : ''}`}>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot size={16} className="text-[var(--accent)]" />
                    <h3 className="font-semibold text-sm">Animator</h3>
                </div>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(p => !p)} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-colors">
                        <MoreHorizontal size={16} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-1 w-40 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-md shadow-lg z-10">
                            <button onClick={() => removeComponent('animator')} className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                Remove component
                            </button>
                        </div>
                    )}
                </div>
            </div>
             <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                <p>Clip: {properties.animationClip}</p>
            </div>
        </div>
    );
};