


import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { BuildSettings } from '../../types';

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

const DropdownInput: React.FC<{label: string, value: string | number, onChange: (v: any) => void, options: {value: string | number, label: string}[]}> =
    ({label, value, onChange, options}) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-[var(--text-secondary)] font-medium">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="max-w-[150px] bg-[var(--bg-deep-dark)] text-white p-1.5 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-xs">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const BuildSettingsPanel: React.FC = () => {
    const { buildSettings, updateEngineSettings, buildProject } = useEditorStore(state => ({
        buildSettings: state.engineSettings.build,
        updateEngineSettings: state.updateEngineSettings,
        buildProject: state.buildProject,
    }));

    const handleSettingsChange = (newBuildSettings: Partial<BuildSettings>) => {
        updateEngineSettings({
            build: {
                ...buildSettings,
                ...newBuildSettings
            }
        });
    };

    const handlePlatformToggle = (platform: keyof typeof buildSettings.targets) => {
        handleSettingsChange({
            targets: {
                ...buildSettings.targets,
                [platform]: !buildSettings.targets[platform]
            }
        });
    };

    const handleWindowsSettingChange = (props: Partial<typeof buildSettings.windowsSettings>) => {
        handleSettingsChange({ windowsSettings: { ...buildSettings.windowsSettings, ...props }});
    };
    
    const handleWebSettingChange = (props: Partial<typeof buildSettings.webSettings>) => {
        handleSettingsChange({ webSettings: { ...buildSettings.webSettings, ...props }});
    };

    return (
        <div className="space-y-6 max-w-md">
            <Section title="Target Platforms">
                 <ToggleInput label="Windows" checked={buildSettings.targets.windows} onChange={() => handlePlatformToggle('windows')} />
                 <ToggleInput label="Web (WebGPU)" checked={buildSettings.targets.web} onChange={() => handlePlatformToggle('web')} />
                 <ToggleInput label="Android" checked={buildSettings.targets.android} onChange={() => handlePlatformToggle('android')} />
            </Section>

            {buildSettings.targets.windows && (
                <Section title="Windows Settings">
                    <ToggleInput label="Include Debug Symbols" checked={buildSettings.windowsSettings.includeDebugSymbols} onChange={c => handleWindowsSettingChange({ includeDebugSymbols: c })} />
                    <DropdownInput label="Architecture" value={buildSettings.windowsSettings.architecture} onChange={v => handleWindowsSettingChange({ architecture: v })} options={[{value: 'x64', label: 'x64'}]} />
                </Section>
            )}

            {buildSettings.targets.web && (
                <Section title="Web Settings">
                    <DropdownInput label="Compression" value={buildSettings.webSettings.compression} onChange={v => handleWebSettingChange({ compression: v })} options={[{value: 'brotli', label: 'Brotli'}, {value: 'gzip', label: 'Gzip'}]} />
                    <DropdownInput label="Max Texture Size" value={buildSettings.webSettings.maxTextureSize} onChange={v => handleWebSettingChange({ maxTextureSize: parseInt(v) as 2048 | 4096 })} options={[{value: 2048, label: '2048px'}, {value: 4096, label: '4096px'}]} />
                </Section>
            )}
             {buildSettings.targets.android && (
                <Section title="Android Settings">
                    <p className="text-sm text-center text-[var(--text-secondary)]">Android-specific settings will appear here.</p>
                </Section>
            )}

            <div className="pt-4">
                 <button onClick={buildProject} className="w-full py-2.5 bg-[var(--accent)] text-white font-semibold rounded-md hover:bg-[var(--accent-hover)] transition-colors">
                    BUILD NOW
                </button>
            </div>
        </div>
    );
};

export default BuildSettingsPanel;