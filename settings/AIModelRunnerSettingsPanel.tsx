
import React, { useState } from 'react';

const Section: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="p-4 bg-[var(--bg-dark)] rounded-lg border border-[var(--border-color)] space-y-4">
            {children}
        </div>
    </div>
);

const ToggleInput: React.FC<{label: string, checked: boolean, onChange: (c: boolean) => void}> =
    ({label, checked, onChange}) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-[var(--text-secondary)] font-medium">{label}</label>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 rounded bg-[var(--bg-deep-dark)] border-[var(--border-color)] accent-[var(--accent)]" />
    </div>
);

const DropdownInput: React.FC<{label: string, value: string, onChange: (v: any) => void, options: {value: string, label: string}[]}> =
    ({label, value, onChange, options}) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-[var(--text-secondary)] font-medium">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="max-w-[150px] bg-[var(--bg-deep-dark)] text-white p-1.5 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-xs">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);


const AIModelRunnerSettingsPanel: React.FC = () => {
    const [modelName, setModelName] = useState('npc_dialogue.gguf');
    const [backend, setBackend] = useState('webgpu');

    return (
        <div className="space-y-6 max-w-md">
             <Section title="Model Configuration">
                <div className="flex items-center justify-between text-sm">
                    <label className="text-[var(--text-secondary)] font-medium">Model</label>
                    <div className="flex items-center gap-2">
                         <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded">{modelName}</span>
                         <button className="px-3 py-1.5 text-xs font-semibold bg-white/5 text-[var(--text-secondary)] rounded-md hover:bg-white/10 hover:text-white transition-colors">Upload</button>
                    </div>
                </div>
                <DropdownInput label="Execution Backend" value={backend} onChange={setBackend} options={[
                    {value: 'webgpu', label: 'WebGPU'}, {value: 'cpu', label: 'CPU'}
                ]}/>
            </Section>
            
            <Section title="Integration">
                <ToggleInput label="Enable in Game" checked={true} onChange={()=>{}}/>
                <ToggleInput label="Enable in Blueprint (Text2Node)" checked={false} onChange={()=>{}}/>
            </Section>

            <Section title="Live Preview">
                <textarea 
                    readOnly 
                    value="“What do you want to ask me, traveler?”"
                    className="w-full h-24 bg-[var(--bg-deep-dark)] text-white/70 p-2 rounded-md border border-[var(--border-color)] text-sm font-mono"
                />
            </Section>
        </div>
    );
};

export default AIModelRunnerSettingsPanel;
