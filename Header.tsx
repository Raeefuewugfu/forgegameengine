
import React from 'react';
import { Dna, Wifi } from 'lucide-react';
import { DropdownMenu } from './ui/DropdownMenu';
import { DropdownMenuItem, DropdownMenuItemProps } from './ui/DropdownMenuItem';
import { useEditorStore } from '../store/editorStore';
import { useDebugStore } from '../store/debugStore';
import { usePackageStore } from '../store/packageStore';
import { ActionHistoryDropdown } from './ui/ActionHistoryDropdown';

const engineSettings = [
  "Rendering", "Physics", "Input", "Audio", "Scripting",
  "UI / HUD", "Networking", "Build & Deploy", "Localization"
];

const editorPreferences = [
  "Theme", "Keybindings", "Layout", "Editor-Tools", "Performance",
  "Notifications", "Version Control", "Plugins", "Snippets"
];

export const Header: React.FC = () => {
    const { 
        openSettingsModal, 
        openPackageManager,
        openAboutModal,
        openDownloadDesktopModal,
        openMarketplace,
        openForgeAvatarModal,
        openInstallPwaModal,
        panelLayouts,
        currentPanelLayout,
        applyLayoutByName,
        saveCurrentLayout,
        newScene,
        openScene,
        saveScene,
        saveSceneAs,
        isDirty,
        deferredInstallPrompt
    } = useEditorStore(state => ({
        openSettingsModal: state.openSettingsModal,
        openPackageManager: state.openPackageManager,
        openAboutModal: state.openAboutModal,
        openDownloadDesktopModal: state.openDownloadDesktopModal,
        openMarketplace: state.openMarketplace,
        openForgeAvatarModal: state.openForgeAvatarModal,
        openInstallPwaModal: state.openInstallPwaModal,
        panelLayouts: state.panelLayouts,
        currentPanelLayout: state.currentPanelLayout,
        applyLayoutByName: state.applyLayoutByName,
        saveCurrentLayout: state.saveCurrentLayout,
        newScene: state.newScene,
        openScene: state.openScene,
        saveScene: state.saveScene,
        saveSceneAs: state.saveSceneAs,
        isDirty: state.openScenes.find(s => s.id === state.activeSceneId)?.isDirty ?? false,
        deferredInstallPrompt: state.deferredInstallPrompt,
    }));
    const { isPackageInstalled } = usePackageStore();
    const isMultiplayerInstalled = isPackageInstalled('multiplayer-net');
    const { toggle } = useDebugStore();

    const debugMenuCategories: { name: string, items: DropdownMenuItemProps[] }[] = [
      {
        name: 'Frame Info',
        items: [
          { children: 'Frame Stats Panel', onClick: () => toggle('showFrameInfo') },
        ],
      },
      {
        name: 'Physics Debug',
        items: [
          { children: 'Physics Stats Panel', onClick: () => toggle('showPhysicsInfo') },
          { children: 'Toggle Collision Overlay', onClick: () => toggle('isPhysicsDebugVisible') },
        ],
      },
      {
        name: 'Entities & Components',
        items: [
          { children: 'Scene Stats Panel', onClick: () => toggle('showEntityInfo') },
        ],
      },
      {
        name: 'Renderer Debug',
        items: [
          { children: 'Renderer Stats Panel', onClick: () => toggle('showRendererInfo') },
          { children: 'Toggle Wireframe Mode', onClick: () => toggle('isWireframeVisible') },
        ],
      },
      {
        name: 'Input Debug',
        items: [
          { children: 'Input Monitor', disabled: true },
        ],
      },
      {
        name: 'Network Monitor',
        items: [
          { children: 'Network Stats', disabled: true },
        ],
      },
      {
        name: 'Profiler / Performance',
        items: [
          { children: 'Performance Stats', disabled: true },
        ],
      },
      {
        name: 'Memory & Resource View',
        items: [
          { children: 'Memory Stats Panel', onClick: () => toggle('showMemoryInfo') },
        ],
      },
    ];

    return (
        <header className="h-10 bg-[var(--bg-dark)] border-b border-[var(--border-color)] flex items-center justify-between px-2 flex-shrink-0 z-50">
            <div className="flex items-center gap-1.5">
                <Dna size={18} className="text-[var(--accent)] ml-2" />
                <span className="font-bold text-sm">Forge Engine</span>
                 <div className="w-px h-5 bg-[var(--border-color)] mx-2"></div>
                <nav className="flex items-center">
                    <DropdownMenu trigger="File">
                        <DropdownMenuItem onClick={newScene}>New Scene</DropdownMenuItem>
                        <DropdownMenuItem onClick={openScene}>Open Scene</DropdownMenuItem>
                        <DropdownMenuItem isSeparator />
                        <DropdownMenuItem onClick={saveScene} disabled={!isDirty}>Save</DropdownMenuItem>
                        <DropdownMenuItem onClick={saveSceneAs}>Save As...</DropdownMenuItem>
                    </DropdownMenu>

                    <DropdownMenu trigger="Edit">
                        <DropdownMenuItem>Undo</DropdownMenuItem>
                        <DropdownMenuItem>Redo</DropdownMenuItem>
                        <DropdownMenuItem isSeparator />
                        <DropdownMenuItem>Cut</DropdownMenuItem>
                        <DropdownMenuItem>Copy</DropdownMenuItem>
                        <DropdownMenuItem>Paste</DropdownMenuItem>
                    </DropdownMenu>

                     <DropdownMenu trigger="Settings">
                        <DropdownMenuItem isHeader>Engine Settings</DropdownMenuItem>
                        {engineSettings.map(setting => (
                           <DropdownMenuItem key={setting} onClick={() => openSettingsModal('Engine', setting)}>{setting}</DropdownMenuItem>
                        ))}
                        <DropdownMenuItem isSeparator />
                        <DropdownMenuItem isHeader>Editor Preferences</DropdownMenuItem>
                        {editorPreferences.map(pref => (
                           <DropdownMenuItem key={pref} onClick={() => openSettingsModal('Editor', pref)}>{pref}</DropdownMenuItem>
                        ))}
                    </DropdownMenu>

                    <DropdownMenu trigger="Window">
                        <DropdownMenuItem isHeader>Layouts</DropdownMenuItem>
                        {Object.keys(panelLayouts).map((name) => (
                             <DropdownMenuItem key={name} onClick={() => applyLayoutByName(name)}>{name}</DropdownMenuItem>
                        ))}
                        <DropdownMenuItem isSeparator />
                        <DropdownMenuItem onClick={() => saveCurrentLayout('New Layout')} disabled={!currentPanelLayout}>Save Current Layout</DropdownMenuItem>
                        <DropdownMenuItem isSeparator />
                        <DropdownMenuItem onClick={openPackageManager}>Package Manager</DropdownMenuItem>
                    </DropdownMenu>

                    <DropdownMenu trigger="Multiplayer">
                        <DropdownMenuItem disabled={!isMultiplayerInstalled}>Host Game</DropdownMenuItem>
                        <DropdownMenuItem disabled={!isMultiplayerInstalled}>Join Game</DropdownMenuItem>
                        <DropdownMenuItem isSeparator />
                        <DropdownMenuItem disabled>Replication Graph</DropdownMenuItem>
                    </DropdownMenu>

                    <DropdownMenu trigger="Addons">
                        <DropdownMenuItem onClick={openMarketplace}>Forge Marketplace</DropdownMenuItem>
                        <DropdownMenuItem onClick={openForgeAvatarModal}>ForgeAvatar</DropdownMenuItem>
                    </DropdownMenu>
                    
                    <DropdownMenu trigger="Debug">
                        {debugMenuCategories.map((category) => (
                            <DropdownMenuItem key={category.name} items={category.items}>
                                {category.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenu>

                    <DropdownMenu trigger="Install">
                        <DropdownMenuItem onClick={openInstallPwaModal} disabled={!deferredInstallPrompt}>Install as App (PWA)</DropdownMenuItem>
                        <DropdownMenuItem onClick={openDownloadDesktopModal}>Download Desktop App</DropdownMenuItem>
                    </DropdownMenu>

                    <DropdownMenu trigger="Help">
                        <DropdownMenuItem onClick={openAboutModal}>About Forge Engine</DropdownMenuItem>
                        <DropdownMenuItem>Documentation</DropdownMenuItem>
                    </DropdownMenu>
                </nav>
            </div>
            <div className="flex items-center gap-4">
                 <ActionHistoryDropdown />
                 <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Wifi size={14} className="text-[var(--green)]" />
                    <span>Connected</span>
                </div>
            </div>
        </header>
    );
}