
import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { LayoutDashboard, Trash2, Save, Check } from 'lucide-react';

const ToggleInput: React.FC<{label: string, checked: boolean, onChange: (c: boolean) => void, disabled?: boolean}> =
    ({label, checked, onChange, disabled = false}) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-[var(--text-secondary)] font-medium">{label}</label>
        <input
            type="checkbox"
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 rounded bg-[var(--bg-deep-dark)] border-[var(--border-color)] accent-[var(--accent)]"
        />
    </div>
);

const LayoutSettingsPanel: React.FC = () => {
    const { panelLayouts, editorPreferences, updateEditorPreferences, applyLayoutByName, saveCurrentLayout, deleteLayout } = useEditorStore(state => ({
        panelLayouts: state.panelLayouts,
        editorPreferences: state.editorPreferences,
        updateEditorPreferences: state.updateEditorPreferences,
        applyLayoutByName: state.applyLayoutByName,
        saveCurrentLayout: state.saveCurrentLayout,
        deleteLayout: state.deleteLayout,
    }));
    const [newLayoutName, setNewLayoutName] = useState('');

    const handleSave = () => {
        if (newLayoutName.trim()) {
            saveCurrentLayout(newLayoutName.trim());
            setNewLayoutName('');
        }
    };

    const handleToolsChange = (props: Partial<typeof editorPreferences.editorTools>) => {
        updateEditorPreferences({
            editorTools: {
                ...editorPreferences.editorTools,
                ...props
            }
        });
    };

    return (
        <div className="space-y-6 max-w-md">
            <div>
                <h3 className="text-lg font-semibold mb-2">Interface Visibility</h3>
                 <div className="p-4 bg-[var(--bg-dark)] rounded-lg border border-[var(--border-color)] space-y-2">
                    <ToggleInput 
                        label="Show Icon Sidebar"
                        checked={editorPreferences.editorTools.showIconSidebar}
                        onChange={c => handleToolsChange({ showIconSidebar: c })}
                    />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Manage Layouts</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Apply, save, or delete your editor panel layouts.
                </p>
                <div className="p-4 bg-[var(--bg-dark)] rounded-lg border border-[var(--border-color)] space-y-2">
                    {Object.keys(panelLayouts).map(name => (
                        <div key={name} className="flex items-center justify-between p-2 rounded-md hover:bg-white/5 group">
                            <span className="text-sm font-medium">{name}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => applyLayoutByName(name)}
                                    className="text-xs px-3 py-1 bg-[var(--accent)] text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Apply
                                </button>
                                {name !== 'Default' && name !== 'Tall Hierarchy' && name !== 'Wide Inspector' && (
                                <button
                                    onClick={() => deleteLayout(name)}
                                    className="text-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
                                >
                                    <Trash2 size={16} />
                                </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-2">Save Current Layout</h3>
                <div className="p-4 bg-[var(--bg-dark)] rounded-lg border border-[var(--border-color)] flex items-center gap-2">
                     <input 
                        type="text"
                        placeholder="New Layout Name"
                        value={newLayoutName}
                        onChange={e => setNewLayoutName(e.target.value)}
                        className="w-full bg-[var(--bg-deep-dark)] text-white p-2 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm"
                    />
                    <button 
                        onClick={handleSave}
                        disabled={!newLayoutName.trim()}
                        className="p-2 rounded-md text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LayoutSettingsPanel;
