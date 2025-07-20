
import { create } from 'zustand';
import { Core } from '../engine/Core';
import { vec3 } from '../types';

interface FrameData {
    fps: number;
    deltaTime: number;
    frameCount: number;
}

interface DebugState {
    // Visibility toggles
    showFrameInfo: boolean;
    showPhysicsInfo: boolean;
    showEntityInfo: boolean;
    showRendererInfo: boolean;
    showMemoryInfo: boolean;
    isPhysicsDebugVisible: boolean; // aka collision overlay
    isWireframeVisible: boolean;
    
    // Data
    frameData: FrameData;
    physicsStats: { activeBodies: number; gravity: vec3 };
    sceneStats: { entityCount: number; componentCounts: Record<string, number> };
    rendererStats: { drawCalls: number; triangleCount: number };
    memoryStats: { textureMemory: number; geometryMemory: number };
    
    // Actions
    toggle: (key: keyof DebugState) => void;
    setFrameData: (data: FrameData) => void;
    updateStats: (engine: Core | null) => void;
}

export const useDebugStore = create<DebugState>((set, get) => ({
    // Visibility
    showFrameInfo: false,
    showPhysicsInfo: false,
    showEntityInfo: false,
    showRendererInfo: false,
    showMemoryInfo: false,
    isPhysicsDebugVisible: false,
    isWireframeVisible: false,

    // Data
    frameData: { fps: 0, deltaTime: 0, frameCount: 0 },
    physicsStats: { activeBodies: 0, gravity: [0, -9.81, 0] },
    sceneStats: { entityCount: 0, componentCounts: {} },
    rendererStats: { drawCalls: 0, triangleCount: 0 },
    memoryStats: { textureMemory: 0, geometryMemory: 0 },
    
    // Actions
    toggle: (key) => set(state => ({ [key]: !state[key] })),
    setFrameData: (data) => set({ frameData: data }),
    updateStats: (engine) => {
        if (!engine) return;
        set({
            physicsStats: engine.getPhysicsStats(),
            sceneStats: engine.getSceneStats(),
            rendererStats: engine.getRendererStats(),
            memoryStats: engine.getMemoryStats(),
        });
    },
}));
