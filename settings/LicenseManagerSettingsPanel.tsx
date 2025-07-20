
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
        <select value={value} onChange={e => onChange(e.target.value)} className="max-w-[200px] bg-[var(--bg-deep-dark)] text-white p-1.5 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-xs">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const NumberInput: React.FC<{label: string, value: number, onChange: (v: number) => void}> = 
    ({label, value, onChange}) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-[var(--text-secondary)] font-medium">{label}</label>
        <input type="number" value={value} onChange={e => onChange(parseInt(e.target.value, 10))} className="w-24 bg-[var(--bg-deep-dark)] text-white p-1.5 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-xs text-right" />
    </div>
);

const LicenseManagerSettingsPanel: React.FC = () => {
    const [licenseType, setLicenseType] = useState('premium');
    const [activation, setActivation] = useState('online');

    return (
        <div className="space-y-6 max-w-md">
             <Section title="Licensing & DRM">
                 <DropdownInput label="License Type" value={licenseType} onChange={setLicenseType} options={[
                    {value: 'free', label: 'Free'},
                    {value: 'demo', label: 'Demo'},
                    {value: 'premium', label: 'Premium'},
                    {value: 'time-limited', label: 'Time-Limited Trial'}
                ]}/>
                 <DropdownInput label="Activation" value={activation} onChange={setActivation} options={[
                    {value: 'online', label: 'Online Key Validation'},
                    {value: 'offline', label: 'Offline Key File'}
                ]}/>
                <NumberInput label="Max Installs" value={3} onChange={()=>{}} />
                <NumberInput label="Expiration (days)" value={30} onChange={()=>{}} />
            </Section>

            <Section title="Marketplace">
                <div className="flex items-center justify-between">
                    <ToggleInput label="Add to Forge Asset Store" checked={true} onChange={()=>{}} />
                    <div className="flex items-center gap-2">
                        <input type="number" value="10" className="w-20 bg-[var(--bg-deep-dark)] text-white p-1.5 rounded-md border border-[var(--border-color)] text-right text-sm" />
                        <span className="text-sm text-[var(--text-secondary)]">EUR</span>
                    </div>
                </div>
            </Section>

            <div className="pt-4">
                 <button className="w-full py-2.5 bg-[var(--accent)] text-white font-semibold rounded-md hover:bg-[var(--accent-hover)] transition-colors">
                    Generate License File
                </button>
            </div>
        </div>
    );
};

export default LicenseManagerSettingsPanel;
