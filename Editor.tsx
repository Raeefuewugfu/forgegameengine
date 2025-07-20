
import React, { useState, useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Header } from './components/Header';
import { SceneTabs } from './components/ui/SceneTabs';
import { SplashScreen } from './components/ui/SplashScreen';
import { useEditorStore } from './store/editorStore';
import { useAssetStore } from './store/assetStore';
import { BlueprintEditor } from './components/editors/BlueprintEditor';
import { MaterialEditor } from './components/editors/MaterialEditor';
import { HierarchyPanel } from './components/panels/HierarchyPanel';
import { SceneView } from './components/panels/SceneView';
import { InspectorPanel } from './components/panels/InspectorPanel';
import { ConsolePanel } from './components/panels/ConsolePanel';
import { AssetPanel } from './components/panels/AssetPanel';
import { BlueprintsPanel } from './components/panels/BlueprintsPanel';
import { ChatHistoryPanel } from './components/panels/ChatHistoryPanel';
import { CinematicEditorPanel } from './components/panels/CinematicEditorPanel';
import { FloatingPanel } from './components/ui/FloatingPanel';
import { Settings, Maximize2 } from 'lucide-react';

const BottomPanelTab: React.FC<{ name: string; activeTab: string; onClick: () => void; }> = ({ name, activeTab, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === name
                ? 'border-[var(--accent)] text-white bg-[var(--accent)]/10'
                : 'border-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
        }`}
    >
        {name}
    </button>
);


const BottomPanelContent: React.FC<{ activeTab: string }> = ({ activeTab }) => {
    switch (activeTab) {
        case 'assets': return <AssetPanel />;
        case 'blueprints': return <BlueprintsPanel />;
        case 'console': return <ConsolePanel />;
        case 'history': return <ChatHistoryPanel />;
        case 'cinematic': return <CinematicEditorPanel />;
        default: return null;
    }
}


export const Editor: React.FC = () => {
    const [splashState, setSplashState] = useState({ shown: true, progress: 0, message: 'Booting...' });
    const { 
        engine,
        engineSettings,
        editorPreferences,
        isBlueprintEditorOpen,
        editingBlueprintId,
        closeBlueprintEditor,
        isMaterialEditorOpen,
        editingMaterialId,
        closeMaterialEditor,
        activeScene,
        openSettingsModal,
        layoutToApply,
        setLayoutToApply,
        setCurrentPanelLayout,
        isSceneViewMaximized,
        toggleSceneViewMaximized,
        isHierarchyPanelMaximized,
        toggleHierarchyPanelMaximized,
        isInspectorPanelMaximized,
        toggleInspectorPanelMaximized,
        isBottomPanelMaximized,
        toggleBottomPanelMaximized
    } = useEditorStore(state => {
        const activeScene = state.openScenes.find(s => s.id === state.activeSceneId) || null;
        return {
            engine: state.engine,
            engineSettings: state.engineSettings,
            editorPreferences: state.editorPreferences,
            isBlueprintEditorOpen: state.isBlueprintEditorOpen,
            editingBlueprintId: state.editingBlueprintId,
            closeBlueprintEditor: state.closeBlueprintEditor,
            isMaterialEditorOpen: state.isMaterialEditorOpen,
            editingMaterialId: state.editingMaterialId,
            closeMaterialEditor: state.closeMaterialEditor,
            activeScene,
            openSettingsModal: state.openSettingsModal,
            layoutToApply: state.layoutToApply,
            setLayoutToApply: state.setLayoutToApply,
            setCurrentPanelLayout: state.setCurrentPanelLayout,
            isSceneViewMaximized: state.isSceneViewMaximized,
            toggleSceneViewMaximized: state.toggleSceneViewMaximized,
            isHierarchyPanelMaximized: state.isHierarchyPanelMaximized,
            toggleHierarchyPanelMaximized: state.toggleHierarchyPanelMaximized,
            isInspectorPanelMaximized: state.isInspectorPanelMaximized,
            toggleInspectorPanelMaximized: state.toggleInspectorPanelMaximized,
            isBottomPanelMaximized: state.isBottomPanelMaximized,
            toggleBottomPanelMaximized: state.toggleBottomPanelMaximized,
        };
    });
    const loadInitialAssets = useAssetStore(state => state.loadInitialAssets);
    
    const [bottomPanelTab, setBottomPanelTab] = useState('assets');
    const mainPanelGroupRef = useRef<any>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isSceneViewMaximized) toggleSceneViewMaximized();
                if (isHierarchyPanelMaximized) toggleHierarchyPanelMaximized();
                if (isInspectorPanelMaximized) toggleInspectorPanelMaximized();
                if (isBottomPanelMaximized) toggleBottomPanelMaximized();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSceneViewMaximized, toggleSceneViewMaximized, isHierarchyPanelMaximized, toggleHierarchyPanelMaximized, isInspectorPanelMaximized, toggleInspectorPanelMaximized, isBottomPanelMaximized, toggleBottomPanelMaximized]);

    useEffect(() => {
        if (layoutToApply && mainPanelGroupRef.current) {
            mainPanelGroupRef.current.setLayout(layoutToApply);
            setLayoutToApply(null);
        }
    }, [layoutToApply, setLayoutToApply]);

    useEffect(() => {
        if (activeScene) {
            document.title = `Forge Engine - ${activeScene.name}${activeScene.isDirty ? '*' : ''}`;
        }
    }, [activeScene]);

    useEffect(() => {
        if (engine) {
             loadInitialAssets(engine.assetManager);
        }
    }, [engine, loadInitialAssets]);
    
    useEffect(() => {
        if (!engine) return;
        engine.updateEngineSettings(engineSettings);
    }, [engine, engineSettings]);

    useEffect(() => {
        document.documentElement.dataset.theme = editorPreferences.theme.mode;
        document.documentElement.style.setProperty('--accent', editorPreferences.theme.accentColor);
    }, [editorPreferences.theme]);

    useEffect(() => {
        // Simulate loading sequence
        const sequence = [
            { progress: 10, message: 'Initializing Core...' },
            { progress: 30, message: 'Loading Physics...' },
            { progress: 60, message: 'Loading Assets...' },
            { progress: 90, message: 'Rendering UI...' },
            { progress: 100, message: 'Done.' },
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < sequence.length) {
                setSplashState(s => ({ ...s, ...sequence[i] }));
                i++;
            } else {
                clearInterval(interval);
                // Fade out
                setTimeout(() => setSplashState(s => ({ ...s, shown: false })), 300);
            }
        }, 250);

        return () => clearInterval(interval);
    }, []);

    if (isBlueprintEditorOpen && editingBlueprintId) {
        return <BlueprintEditor onExit={closeBlueprintEditor} blueprintId={editingBlueprintId} />;
    }

    if (isMaterialEditorOpen && editingMaterialId) {
        return <MaterialEditor onExit={closeMaterialEditor} materialId={editingMaterialId} />;
    }

    if (splashState.shown) {
        return <SplashScreen progress={splashState.progress} message={splashState.message} />;
    }

    const BottomPanel = (
         <div className="h-full flex flex-col bg-[var(--bg-panel)] rounded-lg">
            <div className="flex-shrink-0 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center">
                    <BottomPanelTab name="Assets" activeTab={bottomPanelTab} onClick={() => setBottomPanelTab('assets')} />
                    <BottomPanelTab name="Blueprints" activeTab={bottomPanelTab} onClick={() => setBottomPanelTab('blueprints')} />
                    <BottomPanelTab name="Console" activeTab={bottomPanelTab} onClick={() => setBottomPanelTab('console')} />
                    <BottomPanelTab name="Chat History" activeTab={bottomPanelTab} onClick={() => setBottomPanelTab('history')} />
                    <BottomPanelTab name="Cinematic Editor" activeTab={bottomPanelTab} onClick={() => setBottomPanelTab('cinematic')} />
                </div>
                <div className="pr-2 flex items-center gap-1">
                    <button
                        onClick={toggleBottomPanelMaximized}
                        title="Maximize Panel"
                        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <Maximize2 size={16} />
                    </button>
                    <button
                        onClick={() => openSettingsModal('Editor', 'Layout')}
                        title="Panel Settings"
                        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>
            <div className="flex-grow min-h-0">
                <BottomPanelContent activeTab={bottomPanelTab} />
            </div>
        </div>
    );
    
    const hierarchyVisible = !isHierarchyPanelMaximized;
    const sceneVisible = !isSceneViewMaximized;
    const inspectorVisible = !isInspectorPanelMaximized;

    return (
        <div className="flex-grow flex flex-col min-h-0">
            <Header />
            <SceneTabs />
            <main className="flex-grow min-h-0 flex flex-row">
                 <div className="flex-grow min-w-0 p-1">
                    <PanelGroup direction="vertical">
                        <Panel defaultSize={70} minSize={20}>
                            <PanelGroup 
                                direction="horizontal" 
                                className="w-full h-full"
                                ref={mainPanelGroupRef}
                                onLayout={(layout) => { setCurrentPanelLayout(layout) }}
                                id="main-layout"
                            >
                                {hierarchyVisible && (
                                    <Panel defaultSize={15} minSize={10} collapsible id="hierarchy-panel-parent">
                                        <HierarchyPanel />
                                    </Panel>
                                )}
                                {hierarchyVisible && (sceneVisible || inspectorVisible) && <PanelResizeHandle/>}

                                {sceneVisible && (
                                    <Panel defaultSize={60} minSize={30} id="scene-view-parent">
                                        <SceneView />
                                    </Panel>
                                )}
                                {sceneVisible && inspectorVisible && <PanelResizeHandle/>}
                                
                                {inspectorVisible && (
                                    <Panel defaultSize={25} minSize={15} collapsible id="inspector-panel-parent">
                                        <InspectorPanel />
                                    </Panel>
                                )}
                            </PanelGroup>
                        </Panel>
                        <PanelResizeHandle/>
                        <Panel defaultSize={30} minSize={10} collapsible id="bottom-panel-parent">
                           {BottomPanel}
                        </Panel>
                    </PanelGroup>
                 </div>
            </main>
             {isHierarchyPanelMaximized && (
                <FloatingPanel title="Hierarchy" onClose={toggleHierarchyPanelMaximized} width={300} height={600}>
                    <HierarchyPanel />
                </FloatingPanel>
            )}
            {isInspectorPanelMaximized && (
                <FloatingPanel title="Inspector" onClose={toggleInspectorPanelMaximized} width={350} height={700}>
                    <InspectorPanel />
                </FloatingPanel>
            )}
            {isSceneViewMaximized && (
                <FloatingPanel title="Scene View" onClose={toggleSceneViewMaximized} width={1280} height={720}>
                    <SceneView />
                </FloatingPanel>
            )}
             {isBottomPanelMaximized && (
                <FloatingPanel title={bottomPanelTab.charAt(0).toUpperCase() + bottomPanelTab.slice(1)} onClose={toggleBottomPanelMaximized} width={1200} height={400}>
                     <BottomPanelContent activeTab={bottomPanelTab} />
                </FloatingPanel>
            )}
        </div>
    );
};
