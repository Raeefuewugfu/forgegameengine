import React from 'react';
import { useEditorStore } from '../../store/editorStore';

const NumberInput: React.FC<{label: string, value: number, onChange: (v: number) => void, min?: number, step?: number, suffix?: string}> = 
    ({label, value, onChange, min = 0, step = 1, suffix = ''}) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-[var(--text-secondary)]">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="number"
                value={value}
                min={min}
                step={step}
                onChange={e => onChange(parseInt(e.target.value, 10) || 0)}
                onFocus={e => e.target.select()}
                className="w-24 bg-[var(--bg-deep-dark)] text-white p-1 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-right"
            />
            {suffix && <span className="text-xs text-[var(--text-secondary)] w-12">{suffix}</span>}
        </div>
    </div>
);

const EditorToolsSettingsPanel: React.FC = () => {
    const { editorPreferences, updateEditorPreferences } = useEditorStore();
    const settings = editorPreferences.editorTools;

    const handleChange = (props: Partial<typeof settings>) => {
        updateEditorPreferences({ editorTools: { ...settings, ...props } });
    };

    return (
        <div className="space-y-6 max-w-md">
            <div>
                <h3 className="text-lg font-semibold mb-2">File Management</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Configure auto-saving and backups to protect your work. These are editor preferences and do not affect the project itself.
                </p>
                <div className="p-4 bg-[var(--bg-dark)] rounded-lg border border-[var(--border-color)] space-y-4">
                     <NumberInput 
                        label="Auto-Save Interval"
                        value={settings.autoSaveInterval}
                        onChange={v => handleChange({ autoSaveInterval: v })}
                        min={1}
                        suffix="minutes"
                    />
                    <NumberInput 
                        label="Backup Versions"
                        value={settings.backupVersions}
                        onChange={v => handleChange({ backupVersions: v })}
                        min={0}
                        suffix="versions"
                    />
                </div>
            </div>
        </div>
    );
};

export default EditorToolsSettingsPanel;