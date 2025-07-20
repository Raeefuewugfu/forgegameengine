import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { InputActionMapping, InputAxisMapping, InputBinding, InputDevice } from '../../types';

const BindingRow: React.FC<{
    binding: InputBinding;
    onUpdate: (updatedBinding: InputBinding) => void;
    onDelete: () => void;
}> = ({ binding, onUpdate, onDelete }) => {
    
    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...binding, key: e.target.value.toUpperCase() });
    };

    const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...binding, scale: parseFloat(e.target.value) || 0 });
    };
    
    const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdate({ ...binding, device: e.target.value as InputDevice });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center p-2">
            <input 
                type="text"
                placeholder="Key (e.g., 'W')"
                value={binding.key}
                onChange={handleKeyChange}
                className="w-full bg-[var(--bg-deep-dark)] text-white p-2 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm"
            />
            <input 
                type="number"
                placeholder="Scale"
                value={binding.scale}
                onChange={handleScaleChange}
                className="w-full bg-[var(--bg-deep-dark)] text-white p-2 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm"
            />
             <select
                value={binding.device}
                onChange={handleDeviceChange}
                className="w-full bg-[var(--bg-deep-dark)] text-white p-2 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm"
            >
                <option>Keyboard</option>
                <option>Mouse</option>
                <option>Gamepad</option>
            </select>
            <button onClick={onDelete} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors justify-self-end">
                <Trash2 size={16} />
            </button>
        </div>
    );
};

const MappingEditor: React.FC<{ 
    mapping: InputActionMapping | InputAxisMapping;
    onUpdate: (updatedMapping: InputActionMapping | InputAxisMapping) => void;
    onDelete: () => void;
}> = ({ mapping, onUpdate, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleAddBinding = () => {
        const newBinding: InputBinding = {
            id: `binding-${Date.now()}`,
            key: '',
            scale: 1.0,
            device: 'Keyboard',
            modifiers: [],
        };
        onUpdate({ ...mapping, bindings: [...mapping.bindings, newBinding] });
    };

    const handleUpdateBinding = (index: number, updatedBinding: InputBinding) => {
        const newBindings = [...mapping.bindings];
        newBindings[index] = updatedBinding;
        onUpdate({ ...mapping, bindings: newBindings });
    };

    const handleDeleteBinding = (index: number) => {
        const newBindings = mapping.bindings.filter((_, i) => i !== index);
        onUpdate({ ...mapping, bindings: newBindings });
    };

    return (
        <div className="bg-[var(--bg-dark)]/50 rounded-lg border border-[var(--border-color)]">
            <div className="flex items-center p-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <button className="p-1 text-[var(--text-secondary)] hover:text-white">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <input 
                    type="text"
                    value={mapping.name}
                    onClick={e => e.stopPropagation()}
                    onChange={(e) => onUpdate({ ...mapping, name: e.target.value })}
                    className="flex-grow bg-transparent text-white font-semibold text-sm focus:outline-none"
                />
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>
            {isOpen && (
                <div className="border-t border-[var(--border-color)] p-3 space-y-2">
                    {mapping.bindings.map((binding, index) => (
                        <BindingRow 
                            key={binding.id}
                            binding={binding}
                            onUpdate={(updated) => handleUpdateBinding(index, updated)}
                            onDelete={() => handleDeleteBinding(index)}
                        />
                    ))}
                    <button onClick={handleAddBinding} className="flex items-center gap-2 text-sm text-[var(--accent)] hover:text-white font-semibold px-2 py-1 rounded-md hover:bg-white/10 transition-colors">
                        <Plus size={16} /> Add Binding
                    </button>
                </div>
            )}
        </div>
    );
};

const InputSettingsPanel: React.FC = () => {
    const { engineSettings, updateEngineSettings } = useEditorStore();
    const { actionMappings, axisMappings } = engineSettings.input;
    
    const handleUpdate = (newInputSettings: typeof engineSettings.input) => {
        updateEngineSettings({ input: newInputSettings });
    };
    
    const addActionMapping = () => {
        const newAction: InputActionMapping = {
            id: `action-${Date.now()}`,
            name: 'NewAction',
            bindings: []
        };
        handleUpdate({ ...engineSettings.input, actionMappings: [...actionMappings, newAction] });
    };

    const addAxisMapping = () => {
        const newAxis: InputAxisMapping = {
            id: `axis-${Date.now()}`,
            name: 'NewAxis',
            bindings: []
        };
        handleUpdate({ ...engineSettings.input, axisMappings: [...axisMappings, newAxis] });
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Action Mappings</h3>
                    <button onClick={addActionMapping} className="flex items-center gap-2 text-sm bg-[var(--accent)] text-white font-semibold px-3 py-1.5 rounded-md hover:bg-[var(--accent-hover)] transition-colors">
                        <Plus size={16} /> Add Action
                    </button>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Action Mappings are for discrete events like jumping, shooting, or interacting.
                </p>
                <div className="space-y-2">
                    {actionMappings.map((mapping, index) => (
                        <MappingEditor 
                            key={mapping.id}
                            mapping={mapping}
                            onUpdate={(updated) => {
                                const newMappings = [...actionMappings];
                                newMappings[index] = updated as InputActionMapping;
                                handleUpdate({ ...engineSettings.input, actionMappings: newMappings });
                            }}
                            onDelete={() => {
                                handleUpdate({ ...engineSettings.input, actionMappings: actionMappings.filter(m => m.id !== mapping.id) });
                            }}
                        />
                    ))}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Axis Mappings</h3>
                     <button onClick={addAxisMapping} className="flex items-center gap-2 text-sm bg-[var(--accent)] text-white font-semibold px-3 py-1.5 rounded-md hover:bg-[var(--accent-hover)] transition-colors">
                        <Plus size={16} /> Add Axis
                    </button>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Axis Mappings are for continuous inputs like character movement or camera control.
                </p>
                 <div className="space-y-2">
                    {axisMappings.map((mapping, index) => (
                         <MappingEditor 
                            key={mapping.id}
                            mapping={mapping}
                            onUpdate={(updated) => {
                                const newMappings = [...axisMappings];
                                newMappings[index] = updated as InputAxisMapping;
                                handleUpdate({ ...engineSettings.input, axisMappings: newMappings });
                            }}
                            onDelete={() => {
                                handleUpdate({ ...engineSettings.input, axisMappings: axisMappings.filter(m => m.id !== mapping.id) });
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InputSettingsPanel;
