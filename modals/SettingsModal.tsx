
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, SlidersHorizontal, Settings, Brush, ToyBrick, Route, Volume2, Code, Monitor, Network, Package, Languages, Wrench, VenetianMask, Bell, GitBranch, Terminal, LayoutDashboard, Globe, BrainCircuit, KeyRound } from 'lucide-react';

import PhysicsSettingsPanel from '../settings/PhysicsSettingsPanel';
import ThemeSettingsPanel from '../settings/ThemeSettingsPanel';
import RenderingSettingsPanel from '../settings/RenderingSettingsPanel';
import AudioSettingsPanel from '../settings/AudioSettingsPanel';
import InputSettingsPanel from '../settings/InputSettingsPanel';
import LayoutSettingsPanel from '../settings/LayoutSettingsPanel';
import KeybindingsSettingsPanel from '../settings/KeybindingsSettingsPanel';
import ScriptingSettingsPanel from '../settings/ScriptingSettingsPanel';
import UiHudSettingsPanel from '../settings/UiHudSettingsPanel';
import NetworkingSettingsPanel from '../settings/NetworkingSettingsPanel';
import BuildSettingsPanel from '../settings/BuildSettingsPanel';
import LocalizationSettingsPanel from '../settings/LocalizationSettingsPanel';
import EditorToolsSettingsPanel from '../settings/EditorToolsSettingsPanel';
import PerformanceSettingsPanel from '../settings/PerformanceSettingsPanel';
import NotificationsSettingsPanel from '../settings/NotificationsSettingsPanel';
import VersionControlSettingsPanel from '../settings/VersionControlSettingsPanel';
import PluginsSettingsPanel from '../settings/PluginsSettingsPanel';
import SnippetsSettingsPanel from '../settings/SnippetsSettingsPanel';
import PublishingSettingsPanel from '../settings/PublishingSettingsPanel';
import AIModelRunnerSettingsPanel from '../settings/AIModelRunnerSettingsPanel';
import LicenseManagerSettingsPanel from '../settings/LicenseManagerSettingsPanel';


const engineSettings: { name: string; icon: React.ReactNode }[] = [
  { name: "Rendering", icon: <Monitor size={16} /> },
  { name: "Physics", icon: <ToyBrick size={16} /> },
  { name: "Input", icon: <Route size={16} /> },
  { name: "Audio", icon: <Volume2 size={16} /> },
  { name: "Scripting", icon: <Code size={16} /> },
  { name: "UI / HUD", icon: <VenetianMask size={16} /> },
  { name: "Networking", icon: <Network size={16} /> },
  { name: "Publishing", icon: <Globe size={16} /> },
  { name: "Build Targets", icon: <Package size={16} /> },
  { name: "AI Model Runner", icon: <BrainCircuit size={16} /> },
  { name: "License Manager", icon: <KeyRound size={16} /> },
  { name: "Localization", icon: <Languages size={16} /> },
];

const editorPreferences: { name: string; icon: React.ReactNode }[] = [
  { name: "Theme", icon: <Brush size={16} /> },
  { name: "Keybindings", icon: <Settings size={16} /> },
  { name: "Layout", icon: <LayoutDashboard size={16} /> },
  { name: "Editor-Tools", icon: <Wrench size={16} /> },
  { name: "Performance", icon: <Terminal size={16} /> },
  { name: "Notifications", icon: <Bell size={16} /> },
  { name: "Version Control", icon: <GitBranch size={16} /> },
  { name: "Plugins", icon: <Package size={16} /> },
  { name: "Snippets", icon: <Code size={16} /> }
];

const settingsGroups = {
    'Engine': engineSettings,
    'Editor': editorPreferences,
};

interface SettingsModalProps {
    initialGroup: 'Engine' | 'Editor' | null;
    initialCategory: string | null;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ initialGroup, initialCategory, onClose }) => {
    const [activeCategory, setActiveCategory] = useState(initialCategory);

    useEffect(() => {
        setActiveCategory(initialCategory);
    }, [initialCategory]);

    const renderContent = () => {
        switch(activeCategory) {
            case 'Physics': return <PhysicsSettingsPanel />;
            case 'Theme': return <ThemeSettingsPanel />;
            case 'Rendering': return <RenderingSettingsPanel />;
            case 'Audio': return <AudioSettingsPanel />;
            case 'Input': return <InputSettingsPanel />;
            case 'Layout': return <LayoutSettingsPanel />;
            case 'Keybindings': return <KeybindingsSettingsPanel />;
            case 'Scripting': return <ScriptingSettingsPanel />;
            case 'UI / HUD': return <UiHudSettingsPanel />;
            case 'Networking': return <NetworkingSettingsPanel />;
            case 'Build Targets': return <BuildSettingsPanel />;
            case 'Publishing': return <PublishingSettingsPanel />;
            case 'AI Model Runner': return <AIModelRunnerSettingsPanel />;
            case 'License Manager': return <LicenseManagerSettingsPanel />;
            case 'Localization': return <LocalizationSettingsPanel />;
            case 'Editor-Tools': return <EditorToolsSettingsPanel />;
            case 'Performance': return <PerformanceSettingsPanel />;
            case 'Notifications': return <NotificationsSettingsPanel />;
            case 'Version Control': return <VersionControlSettingsPanel />;
            case 'Plugins': return <PluginsSettingsPanel />;
            case 'Snippets': return <SnippetsSettingsPanel />;
            default:
                return null; // Or a default placeholder
        }
    }

    const currentGroup = initialGroup || 'Engine';

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-[var(--bg-panel)] w-full max-w-4xl h-[70vh] rounded-lg shadow-2xl border border-[var(--border-color)] flex flex-col animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SlidersHorizontal size={20} className="text-[var(--accent)]" />
                        <h2 className="font-semibold text-lg">Settings</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)]">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-grow min-h-0">
                    {/* Sidebar */}
                    <div className="w-64 bg-[var(--bg-dark)]/50 p-2 border-r border-[var(--border-color)] overflow-y-auto">
                        <h3 className="px-3 py-2 text-xs font-bold uppercase text-[var(--text-secondary)]">Engine Settings</h3>
                        {settingsGroups['Engine'].map(item => (
                             <button 
                                key={item.name} 
                                onClick={() => setActiveCategory(item.name)}
                                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-left transition-colors ${activeCategory === item.name ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-primary)] hover:bg-white/10'}`}
                             >
                                 {item.icon} {item.name}
                             </button>
                        ))}
                        <div className="h-px bg-[var(--border-color)] my-2" />
                        <h3 className="px-3 py-2 text-xs font-bold uppercase text-[var(--text-secondary)]">Editor Preferences</h3>
                         {settingsGroups['Editor'].map(item => (
                             <button 
                                key={item.name}
                                onClick={() => setActiveCategory(item.name)}
                                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-left transition-colors ${activeCategory === item.name ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-primary)] hover:bg-white/10'}`}
                            >
                                {item.icon} {item.name}
                             </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-grow p-6 overflow-y-auto">
                        <h2 className="font-bold text-xl mb-6">{activeCategory}</h2>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
