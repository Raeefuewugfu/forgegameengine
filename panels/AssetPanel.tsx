
import React, { useState, useRef, useMemo } from 'react';
import { useAssetStore } from '../../store/assetStore';
import { Image, Package, FileCode, FileQuestion, Upload, Download, Folder, FolderPlus, MoreVertical, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { Asset } from '../../store/assetStore';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';

const FolderCard: React.FC<{
    asset: Asset;
    onDoubleClick: (id: string) => void;
    onContextMenu: (e: React.MouseEvent, asset: Asset) => void;
    onDrop: (targetFolderId: string, e: React.DragEvent) => void;
}> = ({ asset, onDoubleClick, onContextMenu, onDrop }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        handleDragLeave(e);
        onDrop(asset.id, e);
    };

    return (
        <div
            onDoubleClick={() => onDoubleClick(asset.id)}
            onContextMenu={(e) => onContextMenu(e, asset)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-md bg-[var(--bg-dark)] border transition-colors cursor-pointer group ${isDragOver ? 'border-[var(--accent)] bg-[var(--accent)]/20' : 'border-transparent hover:border-[var(--accent)]/50'}`}
        >
            <div className="w-20 h-20 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                <Folder size={48} className="text-amber-500" />
            </div>
            <p className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate w-full text-center">{asset.name}</p>
        </div>
    );
};


const AssetCard: React.FC<{
    asset: Asset;
    previewSrc?: string;
    onContextMenu: (e: React.MouseEvent, asset: Asset) => void;
}> = ({ asset, previewSrc, onContextMenu }) => {
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/forge-asset-id', asset.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const getIcon = () => {
        switch (asset.type) {
            case 'fasset':
                return <Package size={32} className="text-[var(--text-secondary)]" />;
            case 'script':
                return <FileCode size={32} className="text-blue-400" />;
            case 'texture':
                if (previewSrc) {
                    return <img src={previewSrc} alt={asset.name} className="w-full h-full object-cover rounded-md" />;
                }
                return <Image size={32} className="text-[var(--text-secondary)] animate-pulse" />;
            default:
                return <FileQuestion size={32} className="text-[var(--text-secondary)]" />;
        }
    };

    return (
        <div 
            className="flex flex-col items-center gap-1.5 p-2 rounded-md bg-[var(--bg-dark)] border border-transparent hover:border-[var(--accent)]/50 transition-colors cursor-pointer group"
            draggable
            onDragStart={handleDragStart}
            onContextMenu={(e) => onContextMenu(e, asset)}
        >
            <div className="w-20 h-20 bg-[var(--bg-deep-dark)] rounded-md flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                {getIcon()}
            </div>
            <p className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate w-full text-center">{asset.name}</p>
        </div>
    );
};

const Breadcrumbs: React.FC<{
    path: Asset[];
    onNavigate: (id: string | null) => void;
    onDrop: (targetFolderId: string | null, e: React.DragEvent) => void;
}> = ({ path, onNavigate, onDrop }) => {
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-hover)';
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).style.backgroundColor = '';
    };

    return (
        <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)] px-2 py-1">
            {path.map((folder, index) => (
                 <React.Fragment key={folder.id || 'root'}>
                    <button 
                        onClick={() => onNavigate(folder.id)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => { handleDragLeave(e); onDrop(folder.id, e); }}
                        className="px-2 py-0.5 rounded-md hover:bg-white/10"
                        disabled={index === path.length - 1}
                    >
                        {folder.name}
                    </button>
                    {index < path.length - 1 && <ChevronRight size={16} />}
                </React.Fragment>
            ))}
        </div>
    );
};


export const AssetPanel: React.FC = () => {
    const { assets, loadedTextures, addFiles, currentFolderId, setCurrentFolderId, createFolder, moveAssets, renameAsset, deleteAssets, getAssetById } = useAssetStore();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; asset: Asset | null } | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const itemsInCurrentFolder = useMemo(() => {
        const folders = assets.filter(a => a.parentId === currentFolderId && a.type === 'folder').sort((a,b) => a.name.localeCompare(b.name));
        const files = assets.filter(a => a.parentId === currentFolderId && a.type !== 'folder').sort((a,b) => a.name.localeCompare(b.name));
        return [...folders, ...files];
    }, [assets, currentFolderId]);

    const breadcrumbPath = useMemo(() => {
        const path: Asset[] = [];
        let currentId = currentFolderId;
        while(currentId) {
            const folder = getAssetById(currentId);
            if (folder) {
                path.unshift(folder);
                currentId = folder.parentId;
            } else {
                currentId = null;
            }
        }
        path.unshift({ id: null, name: 'Assets', type: 'folder', path: 'Assets', parentId: null });
        return path;
    }, [currentFolderId, getAssetById]);

    const handleUploadClick = () => uploadInputRef.current?.click();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        addFiles(Array.from(e.target.files));
        e.target.value = '';
    };

    const handleCreateFolder = () => {
        const newId = createFolder('New Folder');
        setRenamingId(newId);
        setRenameValue('New Folder');
    };

    const handleDrop = (targetFolderId: string | null, e: React.DragEvent) => {
        const assetId = e.dataTransfer.getData('application/forge-asset-id');
        if (assetId && assetId !== targetFolderId) {
            moveAssets([assetId], targetFolderId);
        }
    };
    
    const startRename = (asset: Asset) => {
        setRenamingId(asset.id);
        setRenameValue(asset.name);
        setContextMenu(null);
    };

    const finishRename = () => {
        if (renamingId && renameValue.trim()) {
            renameAsset(renamingId, renameValue.trim());
        }
        setRenamingId(null);
        setRenameValue('');
    };

    const handleContextMenu = (e: React.MouseEvent, asset: Asset | null) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, asset });
    };

    const menuItems: ContextMenuItem[] = contextMenu?.asset
        ? [
            { label: 'Rename', icon: <Edit3 size={16} />, action: () => startRename(contextMenu.asset!) },
            { type: 'separator' },
            { label: 'Delete', icon: <Trash2 size={16} />, action: () => { deleteAssets([contextMenu.asset!.id]); setContextMenu(null); } },
        ] : [
            { label: 'New Folder', icon: <FolderPlus size={16} />, action: () => { handleCreateFolder(); setContextMenu(null); } },
        ];


    return (
        <div className="h-full flex flex-col" onContextMenu={(e) => handleContextMenu(e, null)}>
             <div className="flex-shrink-0 p-2 border-b border-[var(--border-color)] flex items-center justify-between">
                <Breadcrumbs path={breadcrumbPath} onNavigate={setCurrentFolderId} onDrop={handleDrop} />
                <div className="flex items-center gap-2">
                    <input type="file" ref={uploadInputRef} onChange={handleFileSelect} multiple className="hidden" />
                    <button onClick={handleUploadClick} title="Upload files" className="flex items-center gap-2 px-3 py-1 bg-white/5 text-[var(--text-secondary)] rounded-md font-semibold text-xs hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors">
                        <Upload size={14} /> Upload
                    </button>
                    <button onClick={handleCreateFolder} title="Create New Folder" className="flex items-center gap-2 px-3 py-1 bg-white/5 text-[var(--text-secondary)] rounded-md font-semibold text-xs hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors">
                        <FolderPlus size={14} /> New Folder
                    </button>
                </div>
            </div>
            <div className="flex-grow p-2 overflow-y-auto" onDrop={(e) => handleDrop(currentFolderId, e)} onDragOver={e => e.preventDefault()}>
                <div className="grid grid-cols-auto-fill-100 gap-4">
                     {itemsInCurrentFolder.map(asset => {
                        if (renamingId === asset.id) {
                            return (
                                <div key={asset.id} className="flex flex-col items-center gap-1.5 p-2 rounded-md bg-[var(--bg-dark)] border border-[var(--accent)]">
                                     <div className="w-20 h-20 flex items-center justify-center">
                                        {asset.type === 'folder' ? <Folder size={48} className="text-amber-500" /> : <Package size={32} />}
                                    </div>
                                    <input
                                        type="text"
                                        value={renameValue}
                                        onChange={e => setRenameValue(e.target.value)}
                                        onBlur={finishRename}
                                        onKeyDown={e => {if (e.key === 'Enter') finishRename()}}
                                        autoFocus
                                        className="w-full bg-black/50 border border-[var(--accent)] rounded-sm px-1 text-xs text-center"
                                    />
                                </div>
                            );
                        }
                         if (asset.type === 'folder') {
                             return <FolderCard key={asset.id} asset={asset} onDoubleClick={setCurrentFolderId} onContextMenu={handleContextMenu} onDrop={handleDrop} />;
                         }
                         return (
                            <AssetCard 
                                key={asset.id}
                                asset={asset}
                                previewSrc={asset.type === 'texture' ? loadedTextures[asset.path] ?.src : undefined}
                                onContextMenu={handleContextMenu}
                            />
                         );
                     })}
                </div>
            </div>
             {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    items={menuItems}
                />
            )}
        </div>
    );
};

// A utility class in CSS is needed for the grid layout
const style = document.createElement('style');
style.textContent = `
    .grid-cols-auto-fill-100 {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
`;
document.head.append(style);
