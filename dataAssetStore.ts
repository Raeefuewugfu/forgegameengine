import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ForgeAsset, ForgeStruct, ForgeStructField } from '../types';

// Hardcoded struct definitions
const FORGE_STRUCTS: ForgeStruct[] = [
    {
        id: 'struct_weapondata',
        name: 'Weapon Data',
        icon: 'Sword',
        fields: [
            { id: 'damage', name: 'Damage', type: 'number', defaultValue: 10 },
            { id: 'range', name: 'Range', type: 'number', defaultValue: 1.5 },
            { id: 'swingSpeed', name: 'Swing Speed', type: 'number', defaultValue: 1.0 },
            { id: 'isTwoHanded', name: 'Two-Handed', type: 'boolean', defaultValue: false },
            { id: 'icon', name: 'UI Icon', type: 'texture', defaultValue: null },
        ]
    },
    {
        id: 'struct_enemydata',
        name: 'Enemy Data',
        icon: 'ShieldAlert',
        fields: [
            { id: 'health', name: 'Health', type: 'number', defaultValue: 100 },
            { id: 'speed', name: 'Movement Speed', type: 'number', defaultValue: 3.0 },
            { id: 'attackDamage', name: 'Attack Damage', type: 'number', defaultValue: 15 },
            { id: 'attackRange', name: 'Attack Range', type: 'number', defaultValue: 2.0 },
        ]
    }
];

// Mock data assets
const MOCK_DATA_ASSETS: ForgeAsset[] = [
    { id: 'Sword_Bronze', name: 'Bronze Sword', assetType: 'struct_weapondata', data: { damage: 12, range: 1.8, swingSpeed: 0.9, isTwoHanded: false, icon: null } },
    { id: 'Axe_Iron', name: 'Iron Axe', assetType: 'struct_weapondata', data: { damage: 18, range: 2.2, swingSpeed: 0.7, isTwoHanded: true, icon: null } },
    { id: 'Goblin_Scout', name: 'Goblin Scout', assetType: 'struct_enemydata', data: { health: 50, speed: 4.0, attackDamage: 8, attackRange: 1.5 } },
];

interface DataAssetState {
    structs: ForgeStruct[];
    assets: ForgeAsset[];
    getStructById: (id: string) => ForgeStruct | undefined;
    getAssetById: (id: string) => ForgeAsset | undefined;
    createAsset: (name: string, structId: string) => ForgeAsset;
    updateAsset: (id: string, newData: Record<string, any>) => void;
    renameAsset: (id: string, newName: string) => void;
    deleteAsset: (id: string) => void;
}

export const useDataAssetStore = create<DataAssetState>()(
    persist(
        (set, get) => ({
            structs: FORGE_STRUCTS,
            assets: MOCK_DATA_ASSETS,

            getStructById: (id) => get().structs.find(s => s.id === id),
            getAssetById: (id) => get().assets.find(a => a.id === id),

            createAsset: (name, structId) => {
                const struct = get().getStructById(structId);
                if (!struct) throw new Error('Struct not found');
                
                const defaultData: Record<string, any> = {};
                struct.fields.forEach(field => {
                    defaultData[field.id] = field.defaultValue;
                });

                const newAsset: ForgeAsset = {
                    id: `${name.replace(/\s/g, '_')}_${Date.now()}`,
                    name,
                    assetType: structId,
                    data: defaultData
                };
                
                set(state => ({ assets: [...state.assets, newAsset] }));
                return newAsset;
            },

            updateAsset: (id, newData) => {
                set(state => ({
                    assets: state.assets.map(asset => 
                        asset.id === id ? { ...asset, data: { ...newData } } : asset
                    )
                }));
            },

            renameAsset: (id, newName) => {
                set(state => ({
                    assets: state.assets.map(asset => 
                        asset.id === id ? { ...asset, name: newName } : asset
                    )
                }));
            },

            deleteAsset: (id) => {
                 set(state => ({ assets: state.assets.filter(a => a.id !== id) }));
            },
        }),
        { name: 'forge-engine-data-assets-storage' }
    )
);