import React from 'react';
import { useEditorStore } from '../../store/editorStore';

const AudioSettingsPanel: React.FC = () => {
    const { engineSettings, updateEngineSettings } = useEditorStore(state => ({
        engineSettings: state.engineSettings,
        updateEngineSettings: state.updateEngineSettings
    }));

    const handleMasterVolumeChange = (volume: number) => {
        updateEngineSettings({
            audio: {
                ...engineSettings.audio,
                masterVolume: volume
            }
        });
    };

    return (
        <div className="space-y-6 max-w-md">
            <div>
                <h3 className="text-lg font-semibold mb-2">Global Audio Settings</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Control the main audio output for the entire application.
                </p>
                <div className="p-4 bg-[var(--bg-dark)] rounded-lg border border-[var(--border-color)]">
                    <div className="flex items-center justify-between text-sm">
                        <label className="text-[var(--text-secondary)] font-medium">Master Volume</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                value={engineSettings.audio.masterVolume}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={e => handleMasterVolumeChange(parseFloat(e.target.value))}
                                className="w-48 accent-[var(--accent)]"
                            />
                            <span className="w-10 text-right text-white/80">
                                {Math.round(engineSettings.audio.masterVolume * 100)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioSettingsPanel;
