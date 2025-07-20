


import { create } from 'zustand';
import { Core } from '../engine/Core';
import { EditorObject, PhysicsProperties, AudioComponent, TerrainOptions, MaterialProperties, ComponentKey, LightComponent, ScriptComponent, AnimatorComponent, ParticleEmitterComponent, NavAgentComponent, UIElementComponent, LODGroupComponent, TagComponent, HealthComponent, ForgeScriptProperties, EngineSettings, EditorPreferences, BehaviorTreeComponent, SceneData, InputActionMapping, InputAxisMapping, DataAssetComponent, LiquidComponent, CameraComponent, CinematicCameraComponent } from '../types';
import { useBlueprintStore } from './blueprintStore';
import { useScriptStore } from './scriptStore';
import { usePackageStore } from './packageStore';

export type TransformTool = 'select' | 'translate' | 'rotate' | 'scale';
export type AiMode = 'agent' | 'ask' | 'editor' | 'reply';
export type EditorView = 'editor' | 'dataManager' | 'scripting' | 'materialEditor';
export type CreateableObject = 
    'empty' | 'cube' | 'liquid' | 'skyBox' |
    'directionalLight' | 'pointLight' | 'spotLight' | 'rectLight' | 'skyLight' |
    'particleSystem' | 'skyAtmosphere' | 'volumetricClouds' | 'expHeightFog' | 
    'camera' | 'cinematicCamera' | 
    'audioSource' |
    'postProcessVolume' | 'blockingVolume' | 'triggerVolume' | 'lightmassImportanceVolume' | 'navMeshBoundsVolume';


// Helper for deep merging state to prevent overwriting nested objects.
function deepMerge<T extends Record<string, any>>(original: T, changes: Partial<T>): T {
    const result = { ...original };
    for (const key in changes) {
        if (Object.prototype.hasOwnProperty.call(changes, key)) {
            const originalValue = original[key];
            const changedValue = changes[key];

            if (
                typeof originalValue === 'object' && originalValue !== null && !Array.isArray(originalValue) &&
                typeof changedValue === 'object' && changedValue !== null && !Array.isArray(changedValue)
            ) {
                result[key as keyof T] = deepMerge(originalValue, changedValue as Partial<typeof originalValue>);
            } else {
                result[key as keyof T] = changedValue as any;
            }
        }
    }
    return result;
}

export interface ActionHistoryItem {
  name: string;
  action: () => void;
  timestamp: number;
}

export interface InspectorChatMessage {
    sender: 'user' | 'ai';
    text: string;
    actions?: { component: ComponentKey; property: string; value: any; }[];
    followUpSuggestions?: string[];
}

export interface BlueprintChatMessage {
    id: number;
    sender: 'user' | 'ai';
    text: string;
    type: 'agent' | 'ask';
    agentData?: {
        summaryActions?: string[];
        reasoning?: string;
        tokenCount?: number;
    };
    followUpSuggestions?: string[];
}

export interface SceneTab {
  id: string;
  name: string;
  isDirty: boolean;
  sceneData: SceneData | null;
}


interface EditorState {
    engine: Core | null;
    sceneObjects: EditorObject[];
    selectedObjectIds: string[];
    isPlaying: boolean;
    logs: { type: 'log' | 'warn' | 'error'; message: string; timestamp: string }[];
    isGridVisible: boolean;
    transformTool: TransformTool;
    isRtxMode: boolean;
    isRtxSupported: boolean;
    refreshCounter: number;
    previewCameraId: string | null;
    
    // Main View State
    activeView: EditorView;
    setActiveView: (view: EditorView) => void;

    // Scene State
    openScenes: SceneTab[];
    activeSceneId: string | null;
    addNewScene: () => void;
    addNewLevel: () => void;
    setActiveScene: (id: string) => void;
    closeScene: (id: string) => void;

    // Modals & Editors
    isNewWorldModalOpen: boolean;
    isGeneratingWorld: boolean;
    isBlueprintEditorOpen: boolean;
    editingBlueprintId: string | null;
    isMaterialEditorOpen: boolean;
    editingMaterialId: string | null;
    editingScriptId: string | null;
    isPackageManagerOpen: boolean;
    isAboutModalOpen: boolean;
    isDownloadDesktopModalOpen: boolean;
    isMarketplaceOpen: boolean;
    isForgeAvatarModalOpen: boolean;
    isInstallPwaModalOpen: boolean;

    // Panel Maximization State
    isBottomPanelMaximized: boolean;
    isHierarchyPanelMaximized: boolean;
    isInspectorPanelMaximized: boolean;
    isSceneViewMaximized: boolean;
    
    // Settings Modal
    isSettingsModalOpen: boolean;
    activeSettingsGroup: 'Engine' | 'Editor' | null;
    activeSettingsCategory: string | null;
    
    // Settings State
    engineSettings: EngineSettings;
    editorPreferences: EditorPreferences;

    // Layout State
    panelLayouts: { [name: string]: number[] };
    currentPanelLayout: number[] | null;
    layoutToApply: number[] | null;

    // AI Panel State
    aiMode: AiMode;
    aiContextBlueprintId: string | null;
    aiContextNodeId: string | null;
    blueprintChatHistory: BlueprintChatMessage[];
    addBlueprintChatMessage: (message: BlueprintChatMessage) => void;
    clearBlueprintChatHistory: () => void;
    
    // Inspector AI
    inspectorView: 'properties' | 'chat';
    inspectorChatHistory: InspectorChatMessage[];
    
    // Action History
    actionHistory: ActionHistoryItem[];
    logAction: (name: string, action: () => void) => void;
    
    // Undo/Redo
    history: SceneData[];
    historyIndex: number;
    logHistory: () => void;
    undo: () => void;
    redo: () => void;
    
    // PWA Install prompt
    deferredInstallPrompt: any | null;
    
    setEngine: (engine: Core) => void;
    refreshSceneObjects: () => void;
    setPreviewCamera: (id: string | null) => void;
    
    // Selection
    setSelectedObjectIds: (ids: string[], options?: { ctrl?: boolean, shift?: boolean }) => void;
    
    // Scene modification
    createObject: (type: CreateableObject, parentId?: string | null) => void;
    createTerrain: (options: TerrainOptions) => void;
    deleteSelectedObjects: () => void;
    duplicateSelectedObjects: () => void;
    groupSelectedObjects: () => void;
    reparentObjects: (draggedIds: string[], newParentId: string | null) => void;
    renameObject: (id: string, newName: string) => void;
    addComponent: (componentType: ComponentKey, targetId?: string) => void;
    removeComponent: (componentType: ComponentKey) => void;
    updateTransform: (id: string, newTransform: { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }) => void;

    // Actions
    togglePlay: () => void;
    toggleGridVisibility: () => void;
    toggleRtxMode: () => void;
    toggleSceneViewMaximized: () => void;
    toggleBottomPanelMaximized: () => void;
    toggleHierarchyPanelMaximized: () => void;
    toggleInspectorPanelMaximized: () => void;
    addLog: (message: string, type?: 'log' | 'warn' | 'error') => void;
    clearLogs: () => void;
    setTransformTool: (tool: TransformTool) => void;
    focusOnSelectedObject: () => void;
    resetCamera: () => void;
    openNewWorldModal: () => void;
    closeNewWorldModal: () => void;
    
    // Scene File Actions
    newScene: () => void;
    openScene: () => void;
    saveScene: () => void;
    saveSceneAs: () => void;

    // Settings Actions
    openSettingsModal: (group: 'Engine' | 'Editor', category: string) => void;
    closeSettingsModal: () => void;
    updateEngineSettings: (settings: Partial<EngineSettings>) => void;
    updateEditorPreferences: (prefs: Partial<EditorPreferences>) => void;

    // Build & Publish Actions
    buildProject: () => void;
    publishProject: () => void;

    // Layout Actions
    setCurrentPanelLayout: (layout: number[]) => void;
    applyLayoutByName: (name: string) => void;
    setLayoutToApply: (layout: number[] | null) => void;
    saveCurrentLayout: (name: string) => void;
    deleteLayout: (name: string) => void;

    // Blueprint Actions
    openBlueprintEditor: (id: string) => void;
    closeBlueprintEditor: () => void;
    createNewBlueprintAndEdit: () => void;
    askAiAboutBlueprint: (id: string) => void;
    askAiAboutNode: (nodeId: string) => void;
    setAiMode: (mode: AiMode) => void;

    // Material Editor Actions
    openMaterialEditor: (id: string) => void;
    closeMaterialEditor: () => void;

    // ForgeCode Actions
    openForgeCode: (scriptId: string | null) => void;
    closeForgeCode: () => void;

    // Package Manager Actions
    openPackageManager: () => void;
    closePackageManager: () => void;
    
    // About Modal Actions
    openAboutModal: () => void;
    closeAboutModal: () => void;
    
    // Download Desktop Modal Actions
    openDownloadDesktopModal: () => void;
    closeDownloadDesktopModal: () => void;

    // Marketplace Actions
    openMarketplace: () => void;
    closeMarketplace: () => void;

    // ForgeAvatar Actions
    openForgeAvatarModal: () => void;
    closeForgeAvatarModal: () => void;

    // Install PWA Modal Actions
    openInstallPwaModal: () => void;
    closeInstallPwaModal: () => void;
    setDeferredInstallPrompt: (prompt: any) => void;

    // Inspector AI Actions
    setInspectorView: (view: 'properties' | 'chat') => void;
    addInspectorChatMessage: (message: InspectorChatMessage) => void;
    clearInspectorChat: () => void;


    // Property updates
    updateMaterialProperties: (id: string, props: Partial<MaterialProperties>) => void;
    updatePhysicsProperties: (id: string, props: Partial<PhysicsProperties>) => void;
    updateAudioProperties: (id: string, props: Partial<AudioComponent>) => void;
    updateLightProperties: (id: string, props: Partial<LightComponent>) => void;
    updateLiquidProperties: (id: string, props: Partial<LiquidComponent>) => void;
    updateScriptProperties: (id: string, props: Partial<ScriptComponent>) => void;
    updateForgeScriptProperties: (id: string, props: Partial<ForgeScriptProperties>) => void;
    updateAnimatorProperties: (id: string, props: Partial<AnimatorComponent>) => void;
    updateParticleEmitterProperties: (id: string, props: Partial<ParticleEmitterComponent>) => void;
    updateNavAgentProperties: (id: string, props: Partial<NavAgentComponent>) => void;
    updateUIElementProperties: (id: string, props: Partial<UIElementComponent>) => void;
    updateLODGroupProperties: (id: string, props: Partial<LODGroupComponent>) => void;
    updateTagProperties: (id: string, props: Partial<TagComponent>) => void;
    updateHealthProperties: (id: string, props: Partial<HealthComponent>) => void;
    updateBehaviorTreeProperties: (id: string, props: Partial<BehaviorTreeComponent>) => void;
    updateDataAssetProperties: (id: string, props: Partial<DataAssetComponent>) => void;
    updateCameraProperties: (id: string, props: Partial<CameraComponent>) => void;
    updateCinematicCameraProperties: (id: string, props: Partial<CinematicCameraComponent>) => void;
}

const firstSceneId = `scene-${Date.now()}`;

export const useEditorStore = create<EditorState>((set, get) => {
    
    const markActiveSceneDirty = () => {
        const { activeSceneId } = get();
        set(state => ({
            openScenes: state.openScenes.map(s => 
                s.id === activeSceneId && !s.isDirty ? { ...s, isDirty: true } : s
            )
        }));
    };

    const logHistory = () => {
        const { engine, history, historyIndex } = get();
        if (!engine) return;
        const currentState = engine.saveScene();
        // Discard redo history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(currentState);
        set({ history: newHistory, historyIndex: newHistory.length - 1 });
    };

    const createSceneModificationAction = <T extends (...args: any[]) => void>(action: T): T => {
        return ((...args: Parameters<T>) => {
            logHistory();
            action(...args);
        }) as T;
    };


    return {
    engine: null,
    sceneObjects: [],
    selectedObjectIds: [],
    isPlaying: false,
    logs: [],
    isGridVisible: true,
    transformTool: 'select',
    isRtxMode: false,
    isRtxSupported: typeof navigator !== 'undefined' && 'gpu' in navigator,
    refreshCounter: 0,
    previewCameraId: null,
    
    activeView: 'editor',
    setActiveView: (view) => set({ activeView: view }),
    
    // Scene State
    openScenes: [{ id: firstSceneId, name: 'Untitled Scene', isDirty: false, sceneData: null }],
    activeSceneId: firstSceneId,
    
    // Modals
    isNewWorldModalOpen: false,
    isGeneratingWorld: false,
    isBlueprintEditorOpen: false,
    editingBlueprintId: null,
    isMaterialEditorOpen: false,
    editingMaterialId: null,
    editingScriptId: null,
    isPackageManagerOpen: false,
    isAboutModalOpen: false,
    isDownloadDesktopModalOpen: false,
    isMarketplaceOpen: false,
    isForgeAvatarModalOpen: false,
    isInstallPwaModalOpen: false,
    
    // Panel Maximization
    isBottomPanelMaximized: false,
    isHierarchyPanelMaximized: false,
    isInspectorPanelMaximized: false,
    isSceneViewMaximized: false,
    
    // Settings
    isSettingsModalOpen: false,
    activeSettingsGroup: null,
    activeSettingsCategory: null,
    engineSettings: {
        rendering: {
            renderScale: 1,
            showFps: true,
            globalIllumination: 'off',
            shadowQuality: 'medium',
            vsync: true,
            maxFrameRate: 144,
            postProcessing: {
                bloom: { enabled: true, intensity: 0.8, threshold: 0.9 },
                ssao: { enabled: false, radius: 0.5, power: 1.2 },
                toneMapping: 'aces',
                motionBlur: false,
            },
            antiAliasing: 'taa',
            lodBias: 0,
        },
        physics: {
            gravity: [0, -9.81, 0],
            fixedTimestep: 1 / 60,
            solverIterations: 8,
            enableCCD: false,
        },
        audio: {
            masterVolume: 1.0,
            sfxVolume: 0.8,
            musicVolume: 0.6,
        },
        input: {
            actionMappings: [
                { id: 'action-jump', name: 'Jump', bindings: [{ id: 'bind-space', key: 'Space', scale: 1, device: 'Keyboard', modifiers: [] }] },
            ],
            axisMappings: [
                { id: 'axis-move-fwd', name: 'MoveForward', bindings: [
                    { id: 'bind-w', key: 'W', scale: 1, device: 'Keyboard', modifiers: [] },
                    { id: 'bind-s', key: 'S', scale: -1, device: 'Keyboard', modifiers: [] },
                ]},
                 { id: 'axis-move-right', name: 'MoveRight', bindings: [
                    { id: 'bind-d', key: 'D', scale: 1, device: 'Keyboard', modifiers: [] },
                    { id: 'bind-a', key: 'A', scale: -1, device: 'Keyboard', modifiers: [] },
                ]},
            ],
        },
        ui: {
            defaultTheme: 'dark',
            dpiScaling: 'auto',
            fixedDpi: 1.0,
        },
        scripting: {
            language: 'forgeScript',
            compileOnSave: true,
            enableDebugger: false,
        },
        build: {
            targets: {
                windows: true,
                web: true,
                android: false,
            },
            windowsSettings: {
                includeDebugSymbols: false,
                architecture: 'x64',
            },
            webSettings: {
                compression: 'brotli',
                maxTextureSize: 2048,
            },
            androidSettings: {},
        },
        publishing: {
            targetPlatform: 'web',
            domainType: 'forge',
            domain: 'game.forgecloud.io',
            metadata: {
                title: 'My Awesome Game',
                description: '',
            },
            version: '1.0.0',
            access: 'public',
            password: '',
        },
    },
    editorPreferences: {
        theme: {
            mode: 'dark',
            accentColor: '#5865F2'
        },
        editorTools: {
            autoSaveInterval: 5, // minutes
            backupVersions: 10,
            showIconSidebar: true,
        },
        performance: {
            uiUpdateThrottle: 50, // ms
            disableRealtimePreviews: false,
        },
    },

    // Layouts
    panelLayouts: {
        'Default': [15, 60, 25],
        'Tall Hierarchy': [25, 50, 25],
        'Wide Inspector': [15, 50, 35],
    },
    currentPanelLayout: null,
    layoutToApply: null,

    // AI
    aiMode: 'agent',
    aiContextBlueprintId: null,
    aiContextNodeId: null,
    blueprintChatHistory: [],
    addBlueprintChatMessage: (message) => set(state => ({ blueprintChatHistory: [...state.blueprintChatHistory, message] })),
    clearBlueprintChatHistory: () => set({ blueprintChatHistory: [] }),
    
    // Inspector AI
    inspectorView: 'properties',
    inspectorChatHistory: [],

    // Action History
    actionHistory: [],
    logAction: (name, action) => {
        set(state => ({
          actionHistory: [{ name, action, timestamp: Date.now() }, ...state.actionHistory].slice(0, 10)
        }));
        action();
    },

    // Undo/Redo
    history: [],
    historyIndex: -1,
    logHistory,
    undo: () => {
        const { engine, history, historyIndex } = get();
        if (engine && historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const stateToRestore = history[newIndex];
            engine.loadScene(stateToRestore);
            set({ historyIndex: newIndex });
            get().refreshSceneObjects();
        }
    },
    redo: () => {
        const { engine, history, historyIndex } = get();
        if (engine && historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const stateToRestore = history[newIndex];
            engine.loadScene(stateToRestore);
            set({ historyIndex: newIndex });
            get().refreshSceneObjects();
        }
    },

    // PWA Prompt
    deferredInstallPrompt: null,

    setEngine: (engine) => {
        set({ engine });
        get().refreshSceneObjects();
        engine.updateEngineSettings(get().engineSettings);
        // Initialize undo history
        const initialState = engine.saveScene();
        set({ history: [initialState], historyIndex: 0 });
    },

    refreshSceneObjects: () => {
        get().engine && set(state => ({ sceneObjects: state.engine!.getSceneObjects(), refreshCounter: state.refreshCounter + 1 }));
    },

    setPreviewCamera: (id) => {
        const engine = get().engine;
        if (engine) engine.previewCameraId = id;
        set({ previewCameraId: id });
    },

    setSelectedObjectIds: (ids: string[], options: { ctrl?: boolean, shift?: boolean } = {}) => {
        if (get().isRtxMode) return;
        set(state => {
            let newSelection = [...state.selectedObjectIds];
            const clickedId = ids[0];
            if (options.ctrl) {
                newSelection.includes(clickedId) ? newSelection = newSelection.filter(id => id !== clickedId) : newSelection.push(clickedId);
            } else if (options.shift) {
                const lastSelectedId = newSelection[newSelection.length - 1];
                const lastIndex = state.sceneObjects.findIndex(obj => obj.id === lastSelectedId);
                const clickedIndex = state.sceneObjects.findIndex(obj => obj.id === clickedId);
                if(lastIndex !== -1 && clickedIndex !== -1) {
                    const [start, end] = [lastIndex, clickedIndex].sort((a,b) => a - b);
                    newSelection = state.sceneObjects.slice(start, end + 1).map(obj => obj.id);
                } else {
                    newSelection = [clickedId];
                }
            } else {
                newSelection = ids;
            }
            if (JSON.stringify(newSelection) !== JSON.stringify(state.selectedObjectIds)) {
                return { selectedObjectIds: newSelection, inspectorChatHistory: [], inspectorView: 'properties' };
            }
            return { selectedObjectIds: newSelection };
        });
    },
    
    createObject: createSceneModificationAction((type, parentId = null) => {
        const { engine } = get();
        if (engine) {
            const newId = engine.createObject(type, parentId);
            get().refreshSceneObjects();
            set({ selectedObjectIds: [newId] });
            markActiveSceneDirty();
        }
    }),

    createTerrain: async (options: TerrainOptions) => {
        const { engine, closeNewWorldModal } = get();
        if (engine) {
            closeNewWorldModal();
            set({ isGeneratingWorld: true });
            await new Promise(resolve => setTimeout(resolve, 50));
            try {
                logHistory();
                const allObjects = engine.getSceneObjects();
                const objectsToDelete = allObjects.filter(obj => obj.type !== 'light' && obj.type !== 'grid');
                if (objectsToDelete.length > 0) engine.deleteObjects(objectsToDelete.map(o => o.id));
                const newId = engine.createTerrain(options);
                get().refreshSceneObjects();
                set({ selectedObjectIds: [newId] });
                markActiveSceneDirty();
                engine.focusOn(newId);
            } catch (e) {
                get().addLog(`Failed to generate world: ${(e as Error).message}`, 'error');
            } finally {
                set({ isGeneratingWorld: false });
            }
        }
    },

    addComponent: createSceneModificationAction((componentType, targetId) => {
        const { engine, selectedObjectIds } = get();
        const idToUse = targetId || (selectedObjectIds.length === 1 ? selectedObjectIds[0] : null);
        if (engine && idToUse) {
            engine.addComponent(idToUse, componentType);
            get().refreshSceneObjects();
            markActiveSceneDirty();
        }
    }),

    removeComponent: createSceneModificationAction((componentType) => {
        const { engine, selectedObjectIds } = get();
        if (engine && selectedObjectIds.length === 1) {
            engine.removeComponent(selectedObjectIds[0], componentType);
            get().refreshSceneObjects();
            markActiveSceneDirty();
        }
    }),
    
    deleteSelectedObjects: createSceneModificationAction(() => {
        const { engine, selectedObjectIds } = get();
        if(engine && selectedObjectIds.length > 0) {
            engine.deleteObjects(selectedObjectIds);
            get().refreshSceneObjects();
            set({ selectedObjectIds: [] });
            markActiveSceneDirty();
        }
    }),

    duplicateSelectedObjects: createSceneModificationAction(() => {
        const { engine, selectedObjectIds } = get();
        if(engine && selectedObjectIds.length > 0) {
            const newIds = engine.duplicateObjects(selectedObjectIds);
            get().refreshSceneObjects();
            set({ selectedObjectIds: newIds });
            markActiveSceneDirty();
        }
    }),

    groupSelectedObjects: createSceneModificationAction(() => {
        const { engine, selectedObjectIds } = get();
        if(engine && selectedObjectIds.length > 1) {
            const newParentId = engine.groupObjects(selectedObjectIds);
            get().refreshSceneObjects();
            set({ selectedObjectIds: [newParentId] });
            markActiveSceneDirty();
        }
    }),
    
    reparentObjects: createSceneModificationAction((draggedIds, newParentId) => {
        const { engine } = get();
        if (engine) {
            engine.reparentObjects(draggedIds, newParentId);
            get().refreshSceneObjects();
            markActiveSceneDirty();
        }
    }),
    
    renameObject: createSceneModificationAction((id, newName) => {
        get().engine?.renameObject(id, newName);
        get().refreshSceneObjects();
        markActiveSceneDirty();
    }),

    togglePlay: () => {
        const { engine, isPlaying, isRtxMode } = get();
        if (isRtxMode) return;
        if (engine) {
            isPlaying ? engine.pause() : engine.play();
            set({ isPlaying: !isPlaying });
            get().refreshSceneObjects();
        }
    },

    toggleRtxMode: async () => {
        const { engine } = get();
        if (engine) {
            await engine.toggleRtxMode();
            set({ isRtxMode: engine.isRtxMode, selectedObjectIds: [] });
        }
    },

    toggleGridVisibility: () => {
        const { engine, isGridVisible } = get();
        if (engine) {
            engine.setGridVisibility(!isGridVisible);
            set({ isGridVisible: !isGridVisible });
        }
    },
    
    toggleBottomPanelMaximized: () => set(state => ({ isBottomPanelMaximized: !state.isBottomPanelMaximized })),
    toggleHierarchyPanelMaximized: () => set(state => ({ isHierarchyPanelMaximized: !state.isHierarchyPanelMaximized })),
    toggleInspectorPanelMaximized: () => set(state => ({ isInspectorPanelMaximized: !state.isInspectorPanelMaximized })),
    toggleSceneViewMaximized: () => {
        set(state => ({ isSceneViewMaximized: !state.isSceneViewMaximized }));
        // Allow layout to update before resizing canvas
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    },

    addLog: (message, type = 'log') => {
        const timestamp = new Date().toLocaleTimeString();
        set(state => ({ logs: [...state.logs, { type, message, timestamp }] }));
    },

    clearLogs: () => set({ logs: [] }),

    setTransformTool: (tool) => set({ transformTool: tool }),

    focusOnSelectedObject: () => {
        const { engine, selectedObjectIds } = get();
        if (engine && selectedObjectIds.length > 0) engine.focusOn(selectedObjectIds[0]);
    },

    resetCamera: () => get().engine?.camera.reset(),

    addNewScene: () => {
        const newId = `scene-${Date.now()}`;
        const newSceneTab: SceneTab = { id: newId, name: 'Untitled Scene', isDirty: false, sceneData: null };
        set(state => ({ openScenes: [...state.openScenes, newSceneTab] }));
        get().setActiveScene(newId);
    },

    addNewLevel: () => {
        const newId = `level-${Date.now()}`;
        const newSceneTab: SceneTab = { id: newId, name: 'Untitled Level', isDirty: false, sceneData: null };
        set(state => ({ openScenes: [...state.openScenes, newSceneTab] }));
        get().setActiveScene(newId);
    },

    setActiveScene: (id) => {
        const { engine, activeSceneId, openScenes } = get();
        if (!engine || activeSceneId === id) return;

        const currentStateData = engine.saveScene();
        const updatedScenes = openScenes.map(s => s.id === activeSceneId ? { ...s, sceneData: currentStateData } : s);

        const newSceneTab = updatedScenes.find(s => s.id === id);
        if (!newSceneTab) return;

        if (newSceneTab.sceneData) {
            engine.loadScene(newSceneTab.sceneData);
        } else {
            engine.createNewScene();
        }

        set({ openScenes: updatedScenes, activeSceneId: id, selectedObjectIds: [] });
        get().refreshSceneObjects();

        const initialHistoryState = engine.saveScene();
        set({ history: [initialHistoryState], historyIndex: 0 });
    },

    closeScene: (id) => {
        const { openScenes, activeSceneId } = get();
        if (openScenes.length <= 1) return;
        const sceneToClose = openScenes.find(s => s.id === id);
        if (sceneToClose?.isDirty && !window.confirm(`Scene "${sceneToClose.name}" has unsaved changes. Are you sure you want to close it?`)) return;
        
        const closingIndex = openScenes.findIndex(s => s.id === id);
        const newScenes = openScenes.filter(s => s.id !== id);
        
        if (activeSceneId === id) {
            const newActiveId = newScenes[Math.max(0, closingIndex - 1)].id;
            get().setActiveScene(newActiveId);
        }
        set({ openScenes: newScenes });
    },
    
    newScene: () => get().addNewScene(),

    openScene: () => {
        const activeScene = get().openScenes.find(s => s.id === get().activeSceneId);
        if (activeScene?.isDirty && !window.confirm("You have unsaved changes. Are you sure you want to open a new scene?")) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.fscene,application/json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const sceneData = JSON.parse(event.target?.result as string) as SceneData;
                        get().engine?.loadScene(sceneData);
                        get().refreshSceneObjects();
                        const newName = file.name.replace('.fscene', '');
                        set(state => ({ 
                            openScenes: state.openScenes.map(s => s.id === state.activeSceneId ? {...s, name: newName, isDirty: false, sceneData } : s), 
                            selectedObjectIds: [] 
                        }));
                        const initialHistoryState = get().engine!.saveScene();
                        set({ history: [initialHistoryState], historyIndex: 0 });
                        get().addLog(`Scene '${file.name}' loaded successfully.`, 'log');
                    } catch (err) {
                        get().addLog(`Error loading scene: ${(err as Error).message}`, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    },

    saveScene: () => get().saveSceneAs(), // Simplified: Save always acts as Save As for web context
    
    saveSceneAs: () => {
        const { engine, activeSceneId, openScenes } = get();
        if (!engine || !activeSceneId) return;
        const activeScene = openScenes.find(s => s.id === activeSceneId);
        if (!activeScene) return;
        const sceneData = engine.saveScene();
        const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeScene.name}.fscene`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        get().addLog(`Scene '${activeScene.name}.fscene' saved.`, 'log');
        set(state => ({ openScenes: state.openScenes.map(s => s.id === activeSceneId ? { ...s, isDirty: false, sceneData: sceneData } : s) }));
    },

    openNewWorldModal: () => {
        if (!usePackageStore.getState().isPackageInstalled('advanced-terrain')) {
            get().addLog("The 'Advanced Terrain Tools' package is required. Please install it from the Package Manager.", 'warn');
            return;
        }
        set({ isNewWorldModalOpen: true });
    },
    closeNewWorldModal: () => set({ isNewWorldModalOpen: false }),

    openSettingsModal: (group, category) => get().logAction(`Opened Settings: ${category}`, () => set({ isSettingsModalOpen: true, activeSettingsGroup: group, activeSettingsCategory: category })),
    closeSettingsModal: () => set({ isSettingsModalOpen: false, activeSettingsGroup: null, activeSettingsCategory: null }),
    updateEngineSettings: (settings) => {
        set(state => {
            const newSettings = deepMerge(state.engineSettings, settings);
            get().engine?.updateEngineSettings(newSettings);
            return { engineSettings: newSettings };
        });
    },
    updateEditorPreferences: (prefs) => set(state => ({ editorPreferences: deepMerge(state.editorPreferences, prefs) })),

    buildProject: () => {
        const { addLog, engineSettings } = get();
        const { build } = engineSettings;
    
        addLog("Starting build process...", 'log');
    
        const buildForWeb = () => {
            addLog("Building for Web...", 'log');
            setTimeout(() => addLog("  - Collected assets...", 'log'), 200);
            setTimeout(() => addLog("  - Compiling scripts...", 'log'), 500);
            setTimeout(() => addLog(`  - Compressing textures (${build.webSettings.compression})...`, 'log'), 800);
            setTimeout(() => addLog("  - Bundling game.js...", 'log'), 1200);
            setTimeout(() => {
                addLog("✅ Web build successful! `game_web.zip` created (simulated).", 'log');
                addLog("   Structure: index.html, game.js, assets/", 'log');
            }, 1500);
        };
    
        const buildForWindows = () => {
            addLog("Building for Windows (x64)...", 'log');
            setTimeout(() => addLog("  - Compiling C++ source...", 'log'), 300);
            setTimeout(() => addLog("  - Linking libraries...", 'log'), 700);
            setTimeout(() => addLog("  - Packaging assets into .pak file...", 'log'), 1100);
            setTimeout(() => {
                addLog("✅ Windows build successful! `game_windows.zip` created (simulated).", 'log');
                addLog("   Contains: MyGame.exe, data.pak", 'log');
            }, 1600);
        };
    
        const buildForAndroid = () => {
            addLog("Building for Android...", 'log');
            setTimeout(() => addLog("  - Configuring Gradle...", 'log'), 250);
            setTimeout(() => addLog("  - Compiling Java/Kotlin wrappers...", 'log'), 600);
            setTimeout(() => addLog("  - Building APK package...", 'log'), 1300);
            setTimeout(() => {
                addLog("✅ Android build successful! `MyGame.apk` created (simulated).", 'log');
            }, 1800);
        };
        
        let buildDelay = 0;
        if (build.targets.web) {
            setTimeout(buildForWeb, buildDelay);
            buildDelay += 2000;
        }
        if (build.targets.windows) {
            setTimeout(buildForWindows, buildDelay);
            buildDelay += 2000;
        }
        if (build.targets.android) {
            setTimeout(buildForAndroid, buildDelay);
            buildDelay += 2000;
        }
    
        if (!build.targets.web && !build.targets.windows && !build.targets.android) {
            addLog("No build targets selected. Nothing to build.", 'warn');
        } else {
            setTimeout(() => addLog("All builds finished.", 'log'), buildDelay || 50);
        }
    },
    publishProject: () => {
        const { addLog, engineSettings } = get();
        const { publishing } = engineSettings;
    
        addLog(`Publishing '${publishing.metadata.title}' v${publishing.version}...`, 'log');
        addLog(`  - Target: ${publishing.targetPlatform}`, 'log');
    
        setTimeout(() => addLog("  - Build for target platform is ready.", 'log'), 500);
        setTimeout(() => addLog(`  - Uploading to ${publishing.domainType === 'forge' ? 'game.forgecloud.io' : publishing.domain}...`, 'log'), 1000);
        setTimeout(() => addLog(`  - Finalizing deployment...`, 'log'), 2000);
        setTimeout(() => addLog(`🚀 Successfully published! Your game is live.`, 'log'), 2500);
    },

    setCurrentPanelLayout: (layout) => set({ currentPanelLayout: layout }),
    applyLayoutByName: (name) => {
        const layout = get().panelLayouts[name];
        if (layout) set({ layoutToApply: layout });
    },
    setLayoutToApply: (layout) => set({ layoutToApply: layout }),
    saveCurrentLayout: (name) => {
        const { currentPanelLayout } = get();
        if (currentPanelLayout && name) {
            set(state => ({ panelLayouts: { ...state.panelLayouts, [name]: currentPanelLayout } }));
            get().addLog(`Layout saved as "${name}".`, 'log');
        }
    },
    deleteLayout: (name) => {
        if (['Default', 'Tall Hierarchy', 'Wide Inspector'].includes(name)) {
            get().addLog('Cannot delete default layouts.', 'warn');
            return;
        }
        set(state => {
            const newLayouts = { ...state.panelLayouts };
            delete newLayouts[name];
            return { panelLayouts: newLayouts };
        });
    },

    openBlueprintEditor: (id) => set({ isBlueprintEditorOpen: true, editingBlueprintId: id }),
    closeBlueprintEditor: () => set({ isBlueprintEditorOpen: false, editingBlueprintId: null, aiContextBlueprintId: null, aiContextNodeId: null, aiMode: 'agent' }),
    createNewBlueprintAndEdit: () => {
        const newId = useBlueprintStore.getState().createBlueprint();
        get().openBlueprintEditor(newId);
    },
    askAiAboutBlueprint: (id) => set({ aiContextBlueprintId: id, aiMode: 'reply', isBlueprintEditorOpen: true, editingBlueprintId: id }),
    askAiAboutNode: (nodeId: string) => {
        const { editingBlueprintId } = get();
        if (editingBlueprintId) set({ aiMode: 'reply', aiContextBlueprintId: editingBlueprintId, aiContextNodeId: nodeId });
    },
    setAiMode: (mode) => set({ aiMode: mode }),

    openMaterialEditor: (id) => set({ isMaterialEditorOpen: true, editingMaterialId: id }),
    closeMaterialEditor: () => set({ isMaterialEditorOpen: false, editingMaterialId: null }),
    openForgeCode: (scriptId) => get().logAction(`Opened ForgeCode`, () => set({ activeView: 'scripting', editingScriptId: scriptId })),
    closeForgeCode: () => set({ activeView: 'editor', editingScriptId: get().editingScriptId }),
    openPackageManager: () => get().logAction('Opened Package Manager', () => set({ isPackageManagerOpen: true })),
    closePackageManager: () => set({ isPackageManagerOpen: false }),
    openAboutModal: () => get().logAction('Opened About Modal', () => set({ isAboutModalOpen: true })),
    closeAboutModal: () => set({ isAboutModalOpen: false }),
    openDownloadDesktopModal: () => get().logAction('Opened Download Modal', () => set({ isDownloadDesktopModalOpen: true })),
    closeDownloadDesktopModal: () => set({ isDownloadDesktopModalOpen: false }),
    openMarketplace: () => get().logAction('Opened Marketplace', () => set({ isMarketplaceOpen: true })),
    closeMarketplace: () => set({ isMarketplaceOpen: false }),
    openForgeAvatarModal: () => get().logAction('Opened ForgeAvatar', () => set({ isForgeAvatarModalOpen: true })),
    closeForgeAvatarModal: () => set({ isForgeAvatarModalOpen: false }),
    openInstallPwaModal: () => get().logAction('Opened Install PWA Modal', () => set({ isInstallPwaModalOpen: true })),
    closeInstallPwaModal: () => set({ isInstallPwaModalOpen: false }),
    setDeferredInstallPrompt: (prompt) => set({ deferredInstallPrompt: prompt }),
    setInspectorView: (view) => set({ inspectorView: view, inspectorChatHistory: view === 'properties' ? [] : get().inspectorChatHistory }),
    addInspectorChatMessage: (message) => set(state => ({ inspectorChatHistory: [...state.inspectorChatHistory, message] })),
    clearInspectorChat: () => set({ inspectorChatHistory: [] }),

    updateTransform: createSceneModificationAction((id, newTransform) => { get().engine?.updateTransform(id, newTransform); markActiveSceneDirty(); }),
    updateMaterialProperties: createSceneModificationAction((id, props) => { get().engine?.updateMaterialProperties(id, props); markActiveSceneDirty(); }),
    updatePhysicsProperties: createSceneModificationAction((id, props) => { get().engine?.updatePhysicsProperties(id, props); markActiveSceneDirty(); }),
    updateAudioProperties: createSceneModificationAction((id, props) => { get().engine?.updateAudioProperties(id, props); markActiveSceneDirty(); }),
    updateLightProperties: createSceneModificationAction((id, props) => { get().engine?.updateLightProperties(id, props); markActiveSceneDirty(); }),
    updateLiquidProperties: createSceneModificationAction((id, props) => { get().engine?.updateLiquidProperties(id, props); markActiveSceneDirty(); }),
    updateScriptProperties: createSceneModificationAction((id, props) => { get().engine?.updateScriptProperties(id, props); markActiveSceneDirty(); }),
    updateForgeScriptProperties: createSceneModificationAction((id, props) => { get().engine?.updateForgeScriptProperties(id, props); markActiveSceneDirty(); }),
    updateAnimatorProperties: createSceneModificationAction((id, props) => { get().engine?.updateAnimatorProperties(id, props); markActiveSceneDirty(); }),
    updateParticleEmitterProperties: createSceneModificationAction((id, props) => { get().engine?.updateParticleEmitterProperties(id, props); markActiveSceneDirty(); }),
    updateNavAgentProperties: createSceneModificationAction((id, props) => { get().engine?.updateNavAgentProperties(id, props); markActiveSceneDirty(); }),
    updateUIElementProperties: createSceneModificationAction((id, props) => { get().engine?.updateUIElementProperties(id, props); markActiveSceneDirty(); }),
    updateLODGroupProperties: createSceneModificationAction((id, props) => { get().engine?.updateLODGroupProperties(id, props); markActiveSceneDirty(); }),
    updateTagProperties: createSceneModificationAction((id, props) => { get().engine?.updateTagProperties(id, props); markActiveSceneDirty(); }),
    updateHealthProperties: createSceneModificationAction((id, props) => { get().engine?.updateHealthProperties(id, props); markActiveSceneDirty(); }),
    updateBehaviorTreeProperties: createSceneModificationAction((id, props) => { get().engine?.updateBehaviorTreeProperties(id, props); markActiveSceneDirty(); }),
    updateDataAssetProperties: createSceneModificationAction((id, props) => { get().engine?.updateDataAssetProperties(id, props); markActiveSceneDirty(); }),
    updateCameraProperties: createSceneModificationAction((id, props) => { get().engine?.updateCameraProperties(id, props); markActiveSceneDirty(); }),
    updateCinematicCameraProperties: createSceneModificationAction((id, props) => { get().engine?.updateCinematicCameraProperties(id, props); markActiveSceneDirty(); }),
}
});