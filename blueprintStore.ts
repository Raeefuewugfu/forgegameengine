
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NODE_DEFINITIONS, ALL_AVAILABLE_NODES, NodeDefinition } from '../components/blueprints';

// --- TYPES ---
export interface Pin {
  id: string;
  name: string;
  type: 'exec' | 'data';
}

export interface InputBinding {
    id: string;
    key: string;
    scale: number;
    device: 'Keyboard' | 'Mouse' | 'Gamepad';
    modifiers?: ('Shift' | 'Ctrl' | 'Alt')[];
}

export interface InputConfiguration {
    mappingType: 'Action' | 'Axis';
    mappingName: string;
    bindings: InputBinding[];
    deadZone: number;
    sensitivity: number;
    context: 'GameplayOnly' | 'UIOnly' | 'Always';
    inputGroup: string;
    priority: number;
}

export interface BlueprintNode {
  id: string;
  title: string;
  x: number;
  y: number;
  inputs: Pin[];
  outputs: Pin[];
  properties?: Record<string, any>;
  description?: string;
}

export interface Wire {
  id: string;
  fromNodeId: string;
  fromPinId: string;
  toNodeId: string;
  toPinId: string;
}

export interface BlueprintScript {
    id: string;
    name: string;
    nodes: BlueprintNode[];
    wires: Wire[];
}


interface BlueprintState {
    blueprints: BlueprintScript[];
    getBlueprint: (id: string) => BlueprintScript | undefined;
    saveBlueprint: (data: BlueprintScript) => void;
    createBlueprint: () => string; // returns new ID
    deleteBlueprint: (id: string) => void;
    renameBlueprint: (id: string, name: string) => void;
    getNodeDefinitions: () => typeof NODE_DEFINITIONS;
    getAllNodeDefinitions: () => NodeDefinition[];
}

export const useBlueprintStore = create<BlueprintState>()(
    persist(
        (set, get) => ({
            blueprints: [],
            getBlueprint: (id) => get().blueprints.find(bp => bp.id === id),
            createBlueprint: () => {
                const newId = `BP_${Date.now()}`;
                const existingNames = get().blueprints.map(bp => bp.name);
                let newName = 'NewBlueprint';
                let counter = 1;
                while (existingNames.includes(newName)) {
                    newName = `NewBlueprint_${counter}`;
                    counter++;
                }

                const newBlueprint: BlueprintScript = {
                    id: newId,
                    name: newName,
                    nodes: [
                        // Add a default event node to new blueprints
                         { id: `EventBeginPlay-${Date.now()}`, title: 'Event BeginPlay', description: 'Runs once when this actor is spawned into the world.', x: 150, y: 200, inputs: [], outputs: [{ id: 'execOut', name: '', type: 'exec' }] },
                    ],
                    wires: [],
                };
                set(state => ({ blueprints: [...state.blueprints, newBlueprint] }));
                return newId;
            },
            saveBlueprint: (data) => {
                set(state => ({
                    blueprints: state.blueprints.map(bp => bp.id === data.id ? data : bp)
                }));
            },
            deleteBlueprint: (id) => {
                 set(state => ({
                    blueprints: state.blueprints.filter(bp => bp.id !== id)
                }));
            },
            renameBlueprint: (id, name) => {
                set(state => ({
                    blueprints: state.blueprints.map(bp => bp.id === id ? { ...bp, name } : bp)
                }));
            },
            getNodeDefinitions: () => NODE_DEFINITIONS,
            getAllNodeDefinitions: () => ALL_AVAILABLE_NODES,
        }),
        {
            name: 'forge-engine-blueprints-storage', // name of the item in the storage (must be unique)
        }
    )
);
