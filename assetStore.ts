


import { create } from 'zustand';
import { AssetManager } from '../engine/AssetManager';
import { useEditorStore } from './editorStore';
import { useScriptStore } from './scriptStore';
import { useDataAssetStore } from './dataAssetStore';
import { ForgeAsset } from '../types';

export interface Asset {
    id: string;
    name: string;
    path: string; // For files, the remote/local URL. For folders, its own name.
    type: 'texture' | 'fasset' | 'script' | 'folder';
    parentId: string | null;
}

export interface MarketplaceAssetData {
    name: string;
    path: string; // The URL to download from
    assetStoreType: 'texture' | 'fasset' | 'script';
}

interface AssetState {
    assets: Asset[];
    loadedTextures: { [path:string]: HTMLImageElement };
    isLoading: boolean;
    currentFolderId: string | null;
    loadInitialAssets: (assetManager: AssetManager) => Promise<void>;
    addFiles: (files: File[]) => void;
    addMarketplaceAsset: (assetData: MarketplaceAssetData) => Promise<void>;
    getAssetByPath: (path: string) => Asset | undefined;
    getAssetById: (id: string) => Asset | undefined;
    createFolder: (name: string) => string;
    createDataAsset: (name: string, structId: string) => Asset | null;
    setCurrentFolderId: (id: string | null) => void;
    moveAssets: (assetIds: string[], targetFolderId: string | null) => void;
    renameAsset: (id: string, newName: string) => void;
    deleteAssets: (ids: string[]) => void;
}

// Using a more reliable CDN (picsum.photos) to prevent CORS/loading issues.
const initialAssets: Asset[] = [
    { id: 'texture-BrickWall', name: 'Brick Wall', path: 'https://picsum.photos/seed/brick/512', type: 'texture', parentId: null },
    { id: 'texture-Wood', name: 'Wood', path: 'https://picsum.photos/seed/wood/512', type: 'texture', parentId: null },
    { id: 'texture-Metal', name: 'Metal', path: 'https://picsum.photos/seed/metal/512', type: 'texture', parentId: null },
    { id: 'texture-Ground', name: 'Ground', path: 'https://picsum.photos/seed/ground/512', type: 'texture', parentId: null },
    { id: 'texture-Grass', name: 'Grass', path: 'https://picsum.photos/seed/grass_texture/512', type: 'texture', parentId: null },
    { id: 'texture-Rock', name: 'Rock', path: 'https://picsum.photos/seed/rock_texture/512', type: 'texture', parentId: null },
    { id: 'texture-Snow', name: 'Snow', path: 'https://picsum.photos/seed/snow_texture/512', type: 'texture', parentId: null },
    { id: 'texture-Sand', name: 'Sand', path: 'https://picsum.photos/seed/sand_texture/512', type: 'texture', parentId: null },
    // Forge Assets (.fasset) - The ID here must match the ID in dataAssetStore
    { id: 'Sword_Bronze', name: 'Bronze Sword.fasset', path: 'assets/Sword_Bronze.fasset', type: 'fasset', parentId: null },
    { id: 'Axe_Iron', name: 'Iron Axe.fasset', path: 'assets/Axe_Iron.fasset', type: 'fasset', parentId: null },
    { id: 'Goblin_Scout', name: 'Goblin Scout.fasset', path: 'assets/Goblin_Scout.fasset', type: 'fasset', parentId: null },
     // Forge Scripts (.fs) - Path and name need to match scriptStore for drop to work
    { id: 'script-PlayerController', name: 'PlayerController.fs', path: 'scripts/PlayerController.fs', type: 'script', parentId: null },
    { id: 'script-EnemyAI', name: 'EnemyAI.fs', path: 'scripts/EnemyAI.fs', type: 'script', parentId: null },
];

export const useAssetStore = create<AssetState>((set, get) => ({
    assets: initialAssets,
    loadedTextures: {},
    isLoading: false,
    currentFolderId: null,

    loadInitialAssets: async (assetManager) => {
        if (get().isLoading || Object.keys(get().loadedTextures).length > 0) {
            return;
        }

        set({ isLoading: true });
        
        const textureAssets = get().assets.filter(a => a.type === 'texture');

        const texturePromises = textureAssets.map(textureAsset => 
            assetManager.loadTexture(textureAsset.path)
                .then(image => ({ path: textureAsset.path, image }))
                .catch(error => {
                    const errorMessage = String(error) || `Failed to load texture: ${textureAsset.path}`;
                    useEditorStore.getState().addLog(errorMessage, 'error');
                    console.error(`Failed to load texture ${textureAsset.path}:`, error);
                    return null;
                })
        );

        const loaded = await Promise.all(texturePromises);
        
        const newLoadedTextures: { [path: string]: HTMLImageElement } = {};
        loaded.forEach(result => {
            if (result) {
                newLoadedTextures[result.path] = result.image;
            }
        });

        set({ loadedTextures: newLoadedTextures, isLoading: false });
    },

    addFiles: (files: File[]) => {
        const currentFolderId = get().currentFolderId;
        const newAssets: Asset[] = [];
        const newLoadedTextures: { [path:string]: HTMLImageElement } = { ...get().loadedTextures };

        for (const file of files) {
            const extension = file.name.split('.').pop()?.toLowerCase();
            let type: Asset['type'] = 'fasset'; // default
            const path = `uploads/${file.name}`;

            if (get().assets.some(a => a.path === path)) continue;

            if (['png', 'jpg', 'jpeg', 'webp'].includes(extension || '')) {
                type = 'texture';
                const objectUrl = URL.createObjectURL(file);
                const image = new Image();
                image.src = objectUrl;
                newLoadedTextures[path] = image;
            } else if (extension === 'fs') {
                type = 'script';
            }
            
            const newAsset: Asset = { 
                id: `asset-${Date.now()}-${file.name}`,
                name: file.name, 
                path, 
                type, 
                parentId: currentFolderId 
            };
            newAssets.push(newAsset);
        }

        if (newAssets.length > 0) {
            set(state => ({
                assets: [...state.assets, ...newAssets],
                loadedTextures: newLoadedTextures
            }));
        }
    },
    
    addMarketplaceAsset: async (assetData) => {
        const { addLog } = useEditorStore.getState();
        const { getAssetByPath } = get();
    
        addLog(`Adding '${assetData.name}' to project...`, 'log');
    
        // Use the original path for checking existence
        if (getAssetByPath(assetData.path)) {
            addLog(`'${assetData.name}' is already in the project.`, 'warn');
            return;
        }
    
        const newAsset: Asset = {
            id: `asset-${Date.now()}-${assetData.name.replace(/\s/g, '')}`,
            name: assetData.name,
            path: assetData.path, // Store original path
            type: assetData.assetStoreType,
            parentId: null // Add to root by default
        };
    
        if (newAsset.type === 'texture') {
            try {
                const assetManager = useEditorStore.getState().engine?.assetManager;
                if (!assetManager) throw new Error("Asset manager not available");
                
                const image = await assetManager.loadTexture(newAsset.path);
                
                set(state => ({
                    assets: [...state.assets, newAsset],
                    loadedTextures: { ...state.loadedTextures, [newAsset.path]: image }
                }));
                addLog(`Successfully added '${assetData.name}' to assets.`, 'log');
    
            } catch (error) {
                console.error(error);
                addLog(`Failed to download texture for ${assetData.name}.`, 'error');
            }
        } else {
            // For fasset or script, we just add the metadata.
            set(state => ({ assets: [...state.assets, newAsset] }));
            addLog(`Successfully added '${assetData.name}' to assets.`, 'log');
        }
    },

    getAssetByPath: (path) => {
        return get().assets.find(a => a.path === path);
    },

    getAssetById: (id) => {
        return get().assets.find(a => a.id === id);
    },

    createFolder: (name) => {
        const parentId = get().currentFolderId;
        const siblings = get().assets.filter(a => a.parentId === parentId);
        let newName = name;
        let counter = 1;
        while (siblings.some(s => s.name === newName && s.type === 'folder')) {
            newName = `${name} ${counter}`;
            counter++;
        }
        
        const newFolder: Asset = {
            id: `folder-${Date.now()}`,
            name: newName,
            path: newName,
            type: 'folder',
            parentId: parentId,
        };
        set(state => ({ assets: [...state.assets, newFolder] }));
        return newFolder.id;
    },
    
    createDataAsset: (name, structId) => {
        const { createAsset } = useDataAssetStore.getState();
        const parentId = get().currentFolderId;

        // Ensure unique name for the data asset content
        const dataAssets = useDataAssetStore.getState().assets;
        let finalName = name;
        let counter = 1;
        while(dataAssets.some(da => da.name === finalName)) {
            finalName = `${name} ${counter++}`;
        }
        
        const dataAssetContent = createAsset(finalName, structId);

        // Ensure unique name for the file
        const fileAssets = get().assets;
        let finalFileName = `${finalName}.fasset`;
        counter = 1;
        while(fileAssets.some(fa => fa.name === finalFileName && fa.parentId === parentId)) {
            finalFileName = `${finalName} ${counter++}.fasset`;
        }
        
        const newFileAsset: Asset = {
            id: dataAssetContent.id,
            name: finalFileName,
            path: `assets/${finalFileName}`,
            type: 'fasset',
            parentId: parentId,
        };

        set(state => ({ assets: [...state.assets, newFileAsset] }));
        return newFileAsset;
    },

    setCurrentFolderId: (id) => set({ currentFolderId: id }),

    moveAssets: (assetIds, targetFolderId) => {
        set(state => ({
            assets: state.assets.map(asset => 
                assetIds.includes(asset.id) ? { ...asset, parentId: targetFolderId } : asset
            )
        }));
    },

    renameAsset: (id, newName) => {
        set(state => ({
            assets: state.assets.map(asset => {
                if (asset.id === id) {
                    const currentName = asset.name;
                    const extension = currentName.includes('.fasset') ? '.fasset' : currentName.includes('.fs') ? '.fs' : '';
                    const finalName = newName.endsWith(extension) ? newName : `${newName}${extension}`;
                    return { ...asset, name: finalName, path: `assets/${finalName}` };
                }
                return asset;
            })
        }));
        if (get().assets.find(a => a.id === id)?.type === 'fasset') {
            useDataAssetStore.getState().renameAsset(id, newName.replace('.fasset', ''));
        }
    },

    deleteAssets: (ids) => {
        set(state => {
            const deletionSet = new Set(ids);
            // Also delete children of any deleted folder
            const queue = [...ids];
            while(queue.length > 0) {
                const currentId = queue.shift();
                if(!currentId) continue;
                state.assets.forEach(asset => {
                    if (asset.parentId === currentId && !deletionSet.has(asset.id)) {
                        deletionSet.add(asset.id);
                        if (asset.type === 'folder') {
                            queue.push(asset.id);
                        }
                    }
                });
            }
            
            // Sync deletions with dataAssetStore
            const assetsToDelete = state.assets.filter(asset => deletionSet.has(asset.id));
            assetsToDelete.forEach(asset => {
                if (asset.type === 'fasset') {
                    useDataAssetStore.getState().deleteAsset(asset.id);
                }
            });

            return { assets: state.assets.filter(asset => !deletionSet.has(asset.id)) };
        });
    },
}));