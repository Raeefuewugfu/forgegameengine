
import React, { useState, useRef, useEffect } from 'react';
import { AudioComponent } from '../../types';
import { useEditorStore } from '../../store/editorStore';
import { Volume2, MoreHorizontal, Bot } from 'lucide-react';
import { ComponentAiPopover } from './ComponentAiPopover';

interface AudioPropertiesEditorProps {
    objectId: string;
    disabled?: boolean;
}

const SliderInput: React.FC<{label: string, value: number, onChange: (v: number) => void, min?: number, max?: number, step?: number, disabled?: boolean}> =
    ({label, value, onChange, min = 0, max = 1, step = 0.01, disabled = false}) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-[var(--text-secondary)]">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="range"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={e => onChange(parseFloat(e.target.value))}
                disabled={disabled}
                className="w-24 accent-[var(--accent)]"
            />
            <span className="w-10 text-right text-white/80">{value.toFixed(2)}</span>
        </div>
    </div>
);

const CheckboxInput: React.FC<{label: string, checked: boolean, onChange: (c: boolean) => void, disabled?: boolean}> =
    ({label, checked, onChange, disabled = false}) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-[var(--text-secondary)]">{label}</label>
        <input
            type="checkbox"
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 rounded bg-[var(--bg-deep-dark)] border-[var(--border-color)] accent-[var(--accent)]"
        />
    </div>
);

export const AudioPropertiesEditor: React.FC<AudioPropertiesEditorProps> = ({ objectId, disabled = false }) => {
    const { updateAudioProperties, removeComponent, engine } = useEditorStore(state => ({
        updateAudioProperties: state.updateAudioProperties,
        removeComponent: state.removeComponent,
        engine: state.engine
    }));

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAiPopoverOpen, setIsAiPopoverOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const aiButtonRef = useRef<HTMLButtonElement>(null);
    const object = engine?.getObjectById(objectId);
    const properties = object?.audio;
    
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

    const handleChange = (props: Partial<AudioComponent>) => {
        if (disabled) return;
        updateAudioProperties(objectId, props);
    };

    return (
        <div className={`p-3 bg-[var(--bg-dark)] rounded-lg border border-[var(--border-color)] space-y-3 ${disabled ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-[var(--accent)]" />
                    <h3 className="font-semibold text-sm">Audio Source</h3>
                </div>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(p => !p)} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-colors">
                        <MoreHorizontal size={16} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-1 w-40 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-md shadow-lg z-10">
                             <button ref={aiButtonRef} onClick={() => { setIsAiPopoverOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white transition-colors">
                                <Bot size={14}/> Ask AI
                            </button>
                            <div className="h-px bg-[var(--border-color)] my-1" />
                            <button onClick={() => removeComponent('audio')} className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                Remove component
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <label className="text-[var(--text-secondary)]">Sound</label>
                    <span className="text-white/70 font-mono text-xs bg-black/20 px-2 py-0.5 rounded">{properties.soundName}</span>
                </div>
                 <SliderInput label="Volume" value={properties.volume} onChange={v => handleChange({ volume: v })} disabled={disabled} />
                 <CheckboxInput label="Loop" checked={properties.loop} onChange={c => handleChange({ loop: c })} disabled={disabled} />
            </div>
            {isAiPopoverOpen && (
                <ComponentAiPopover
                    componentName="Audio Source"
                    properties={properties}
                    anchorElement={menuRef.current}
                    onClose={() => setIsAiPopoverOpen(false)}
                />
            )}
        </div>
    );
};
