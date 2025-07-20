
import React, { useState, useEffect } from 'react';
import { Editor } from './Editor';
import { MobileLanding } from './components/MobileLanding';
import { useEditorStore } from './store/editorStore';
import { DataManager } from './components/DataManager';
import { ForgeCodeEditor } from './components/editors/ForgeCodeEditor';
import { IconSidebar } from './components/ui/IconSidebar';


// Import all modals that might be used globally
import NewWorldModal from './components/modals/NewWorldModal';
import { GeneratingWorldModal } from './components/modals/GeneratingWorldModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { PackageManager } from './components/modals/PackageManager';
import { AboutModal } from './components/modals/AboutModal';
import { DownloadDesktopModal } from './components/modals/DownloadDesktopModal';
import { MarketplaceModal } from './components/modals/MarketplaceModal';
import { ForgeAvatarModal } from './components/modals/ForgeAvatarModal';
import { InstallPwaModal } from './components/modals/InstallPwaModal';

const App: React.FC = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    const {
        activeView,
        editingScriptId,
        closeForgeCode,
        isNewWorldModalOpen,
        isGeneratingWorld,
        isSettingsModalOpen, activeSettingsGroup, activeSettingsCategory, closeSettingsModal,
        isPackageManagerOpen, closePackageManager,
        isAboutModalOpen, closeAboutModal,
        isDownloadDesktopModalOpen, closeDownloadDesktopModal,
        isMarketplaceOpen, closeMarketplace,
        isForgeAvatarModalOpen, closeForgeAvatarModal,
        isInstallPwaModalOpen, closeInstallPwaModal,
        setDeferredInstallPrompt,
        showIconSidebar,
        undo,
        redo
    } = useEditorStore(state => ({
        activeView: state.activeView,
        editingScriptId: state.editingScriptId,
        closeForgeCode: state.closeForgeCode,
        isNewWorldModalOpen: state.isNewWorldModalOpen,
        isGeneratingWorld: state.isGeneratingWorld,
        isSettingsModalOpen: state.isSettingsModalOpen,
        activeSettingsGroup: state.activeSettingsGroup,
        activeSettingsCategory: state.activeSettingsCategory,
        closeSettingsModal: state.closeSettingsModal,
        isPackageManagerOpen: state.isPackageManagerOpen,
        closePackageManager: state.closePackageManager,
        isAboutModalOpen: state.isAboutModalOpen,
        closeAboutModal: state.closeAboutModal,
        isDownloadDesktopModalOpen: state.isDownloadDesktopModalOpen,
        closeDownloadDesktopModal: state.closeDownloadDesktopModal,
        isMarketplaceOpen: state.isMarketplaceOpen,
        closeMarketplace: state.closeMarketplace,
        isForgeAvatarModalOpen: state.isForgeAvatarModalOpen,
        closeForgeAvatarModal: state.closeForgeAvatarModal,
        isInstallPwaModalOpen: state.isInstallPwaModalOpen,
        closeInstallPwaModal: state.closeInstallPwaModal,
        setDeferredInstallPrompt: state.setDeferredInstallPrompt,
        showIconSidebar: state.editorPreferences.editorTools.showIconSidebar,
        undo: state.undo,
        redo: state.redo,
    }));

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            useEditorStore.getState().setDeferredInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [setDeferredInstallPrompt]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const renderActiveView = () => {
        switch (activeView) {
            case 'editor':
                return <Editor />;
            case 'dataManager':
                return <DataManager />;
            case 'scripting':
                return <ForgeCodeEditor scriptId={editingScriptId} onExit={closeForgeCode} />;
            default:
                return <Editor />;
        }
    };

    return (
        <>
            {isMobile ? <MobileLanding /> : (
                <div className="w-screen h-screen bg-[var(--bg-deep-dark)] text-[var(--text-primary)] flex flex-col">
                    <div className="flex-grow min-h-0 flex flex-row">
                        {showIconSidebar && <IconSidebar />}
                        {renderActiveView()}
                    </div>
                </div>
            )}
            
            {/* Render modals globally so they can be triggered from anywhere */}
            {isNewWorldModalOpen && <NewWorldModal />}
            {isGeneratingWorld && <GeneratingWorldModal />}
            {isSettingsModalOpen && <SettingsModal initialGroup={activeSettingsGroup} initialCategory={activeSettingsCategory} onClose={closeSettingsModal} />}
            {isPackageManagerOpen && <PackageManager onClose={closePackageManager} />}
            {isAboutModalOpen && <AboutModal onClose={closeAboutModal} />}
            {isDownloadDesktopModalOpen && <DownloadDesktopModal onClose={closeDownloadDesktopModal} />}
            {isMarketplaceOpen && <MarketplaceModal onClose={closeMarketplace} />}
            {isForgeAvatarModalOpen && <ForgeAvatarModal onClose={closeForgeAvatarModal} />}
            {isInstallPwaModalOpen && <InstallPwaModal onClose={closeInstallPwaModal} />}
        </>
    );
};

export default App;