
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MATERIAL_NODE_DEFINITIONS, MaterialOutputNode } from '../components/materials';

export interface MaterialPin {
  id: string;
  name: string;
  type: 'vec3' | 'float' | 'vec2' | 'texture';
}

export interface MaterialNode {
  id: string;
  title: string;
  x: number;
  y: number;
  inputs: MaterialPin[];
  outputs: MaterialPin[];
  properties?: Record<string, any>;
}

export interface MaterialWire {
  id: string;
  fromNodeId: string;
  fromPinId: string;
  toNodeId: string;
  toPinId: string;
}

export interface MaterialAsset {
    id: string;
    name: string;
    nodes: MaterialNode[];
    wires: MaterialWire[];
}

interface MaterialState {
    materials: MaterialAsset[];
    getMaterial: (id: string) => MaterialAsset | undefined;
    saveMaterial: (data: MaterialAsset) => void;
    createMaterial: () => string; // returns new ID
    deleteMaterial: (id: string) => void;
    renameMaterial: (id: string, name: string) => void;
    getNodeDefinitions: () => typeof MATERIAL_NODE_DEFINITIONS;
}

export const useMaterialStore = create<MaterialState>()(
    persist(
        (set, get) => ({
            materials: [],
            getMaterial: (id) => get().materials.find(m => m.id === id),
            createMaterial: () => {
                const newId = `Mat_${Date.now()}`;
                const existingNames = get().materials.map(m => m.name);
                let newName = 'NewMaterial';
                let counter = 1;
                while (existingNames.includes(newName)) {
                    newName = `NewMaterial_${counter}`;
                    counter++;
                }

                const newMaterial: MaterialAsset = {
                    id: newId,
                    name: newName,
                    nodes: [
                         { id: 'MaterialOutput_Root', ...MaterialOutputNode, x: 500, y: 200 },
                    ],
                    wires: [],
                };
                set(state => ({ materials: [...state.materials, newMaterial] }));
                return newId;
            },
            saveMaterial: (data) => {
                set(state => ({
                    materials: state.materials.map(m => m.id === data.id ? data : m)
                }));
            },
            deleteMaterial: (id) => {
                 set(state => ({
                    materials: state.materials.filter(m => m.id !== id)
                }));
            },
            renameMaterial: (id, name) => {
                set(state => ({
                    materials: state.materials.map(m => m.id === id ? { ...m, name } : m)
                }));
            },
            getNodeDefinitions: () => MATERIAL_NODE_DEFINITIONS,
        }),
        {
            name: 'forge-engine-materials-storage',
        }
    )
);
