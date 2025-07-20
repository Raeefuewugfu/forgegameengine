


import React, { useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useAssetStore } from '../../store/assetStore';
import { TerrainOptions } from '../../types';
import { Globe, X, RefreshCw, Palette, Settings, Image as ImageIcon } from 'lucide-react';
import { CustomColorPicker } from '../ui/CustomColorPicker';

const LabelledInput: React.FC<{label: string, id: string, children: React.ReactNode, row?: boolean}> = ({label, id, children, row = true}) => (
    <div className={`flex items-center ${row ? 'justify-between' : 'flex-col items-start gap-2'}`}>
        <label htmlFor={id} className="text-sm text-[var(--text-secondary)]">{label}</label>
        {children}
    </div>
);

const SliderInput: React.FC<{label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number}> = 
    ({label, value, onChange, min, max, step}) => (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs">
             <label className="text-[var(--text-secondary)]">{label}</label>
             <span className="font-mono text-white/70">{value.toFixed(2)}</span>
        </div>
        <input 
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full accent-[var(--accent)]"
        />
    </div>
);


const TextureSelector: React.FC<{label: string, value: string | null, onChange: (val: string | null) => void}> = ({label, value, onChange}) => {
    const textures = useAssetStore(state => state.assets.filter(a => a.type === 'texture'));
    return (
         <div className="flex items-center justify-between">
            <label className="text-sm text-[var(--text-secondary)]">{label}</label>
            <select
                value={value || ''}
                onChange={e => onChange(e.target.value || null)}
                className="w-40 bg-[var(--bg-deep-dark)] text-white p-2 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm"
            >
                {textures.map(t => <option key={t.path} value={t.path}>{t.name}</option>)}
            </select>
        </div>
    );
};

export default function NewWorldModal() {
    const { closeNewWorldModal, createTerrain } = useEditorStore(state => ({
        closeNewWorldModal: state.closeNewWorldModal,
        createTerrain: state.createTerrain
    }));
    
    const [options, setOptions] = useState<TerrainOptions>({
        seed: (Math.random() * 1000000).toFixed(0),
        width: 128,
        depth: 128,
        heightScale: 35,
        waterLevel: 5,
        noiseScale: 80,
        octaves: 8,
        lacunarity: 2.2,
        persistence: 0.5,
        colors: {
            water: '#2666d1',
        },
        materials: {
            grassTexture: 'https://picsum.photos/seed/grass_texture/512',
            rockTexture: 'https://picsum.photos/seed/rock_texture/512',
            snowTexture: 'https://picsum.photos/seed/snow_texture/512',
            sandTexture: 'https://picsum.photos/seed/sand_texture/512',
        }
    });

    const handleRandomizeSeed = () => {
        setOptions(o => ({ ...o, seed: (Math.random() * 1000000).toFixed(0) }));
    };

    const handleGenerate = () => {
        createTerrain(options);
    };

    const handleInputChange = (key: keyof TerrainOptions, value: any) => {
        setOptions(o => ({...o, [key]: value }));
    }
    
    const handleMaterialChange = (key: keyof TerrainOptions['materials'], value: string | null) => {
         setOptions(o => ({ ...o, materials: { ...o.materials, [key]: value } }));
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
            onClick={closeNewWorldModal}
        >
            <div 
                className="bg-[var(--bg-panel)] w-full max-w-2xl rounded-lg shadow-2xl border border-[var(--border-color)] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                        <Globe size={20} className="text-[var(--accent)]" />
                        <h2 className="font-semibold text-lg">Create New World</h2>
                    </div>
                    <button onClick={closeNewWorldModal} className="p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)]">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-2 flex items-center gap-2"><Settings size={16}/> Generation Settings</h3>
                        <LabelledInput label="Seed" id="seed">
                           <div className="flex items-center gap-2">
                                <input 
                                    id="seed" 
                                    type="text"
                                    value={options.seed}
                                    onChange={e => handleInputChange('seed', e.target.value)}
                                    className="w-32 bg-[var(--bg-deep-dark)] text-white p-2 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm"
                                />
                                <button onClick={handleRandomizeSeed} title="Randomize Seed" className="p-2 rounded-md text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors">
                                    <RefreshCw size={16} />
                                </button>
                           </div>
                        </LabelledInput>
                         <LabelledInput label="Width" id="width">
                            <input id="width" type="number" value={options.width} min="16" max="512" step="16" onChange={e => handleInputChange('width', parseInt(e.target.value))} className="w-24 bg-[var(--bg-deep-dark)] text-white p-2 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm" />
                        </LabelledInput>
                        <LabelledInput label="Depth" id="depth">
                            <input id="depth" type="number" value={options.depth} min="16" max="512" step="16" onChange={e => handleInputChange('depth', parseInt(e.target.value))} className="w-24 bg-[var(--bg-deep-dark)] text-white p-2 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm" />
                        </LabelledInput>
                        <LabelledInput label="Height Scale" id="heightScale">
                            <input id="heightScale" type="number" value={options.heightScale} min="5" max="100" onChange={e => handleInputChange('heightScale', parseFloat(e.target.value))} className="w-24 bg-[var(--bg-deep-dark)] text-white p-2 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm" />
                        </LabelledInput>
                         <LabelledInput label="Water Level" id="waterLevel">
                            <input id="waterLevel" type="number" value={options.waterLevel} min="0" max="20" step="1" onChange={e => handleInputChange('waterLevel', parseFloat(e.target.value))} className="w-24 bg-[var(--bg-deep-dark)] text-white p-2 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm" />
                        </LabelledInput>
                        <div className="pt-2 mt-2 border-t border-[var(--border-color)] space-y-4">
                            <h4 className="font-semibold text-xs text-[var(--text-secondary)]">FBM Noise</h4>
                             <SliderInput label="Noise Scale" value={options.noiseScale} onChange={v => handleInputChange('noiseScale', v)} min={10} max={200} step={1} />
                             <SliderInput label="Octaves" value={options.octaves} onChange={v => handleInputChange('octaves', v)} min={1} max={10} step={1} />
                             <SliderInput label="Lacunarity" value={options.lacunarity} onChange={v => handleInputChange('lacunarity', v)} min={1.0} max={4.0} step={0.1} />
                             <SliderInput label="Persistence" value={options.persistence} onChange={v => handleInputChange('persistence', v)} min={0.1} max={1.0} step={0.05} />
                        </div>
                    </div>
                     <div className="space-y-4">
                         <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-2 flex items-center gap-2"><ImageIcon size={16}/> Terrain Materials</h3>
                         <TextureSelector label="Sand" value={options.materials.sandTexture} onChange={v => handleMaterialChange('sandTexture', v)} />
                         <TextureSelector label="Grass" value={options.materials.grassTexture} onChange={v => handleMaterialChange('grassTexture', v)} />
                         <TextureSelector label="Rock" value={options.materials.rockTexture} onChange={v => handleMaterialChange('rockTexture', v)} />
                         <TextureSelector label="Snow" value={options.materials.snowTexture} onChange={v => handleMaterialChange('snowTexture', v)} />

                          <div className="pt-2 mt-2 border-t border-[var(--border-color)]">
                             <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-2 flex items-center gap-2 pt-2"><Palette size={16}/> Water Color</h3>
                             <div className="flex items-center justify-between w-full">
                                <span className="text-sm text-[var(--text-secondary)]">Water Color</span>
                                <CustomColorPicker value={options.colors.water} onChange={v => setOptions(o => ({...o, colors: {...o.colors, water: v}}))} />
                            </div>
                         </div>
                    </div>
                </div>


                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 bg-[var(--bg-dark)]/50 border-t border-[var(--border-color)] rounded-b-lg">
                    <button 
                        onClick={closeNewWorldModal} 
                        className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleGenerate} 
                        className="px-6 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
};