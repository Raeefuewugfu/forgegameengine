import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useAssetStore } from '../../store/assetStore';
import { useDataAssetStore } from '../../store/dataAssetStore';
import { X, Database, Search, CheckSquare, Square } from 'lucide-react';

interface DataAssetPickerModalProps {
    onClose: () => void;
    onAdd: (selectedIds: string[]) => void;
    existingIds: string[];
}

export const DataAssetPickerModal: React.FC<DataAssetPickerModalProps> = ({ onClose, onAdd, existingIds }) => {
    const { assets: fileAssets } = useAssetStore();
    const { assets: dataAssets } = useDataAssetStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const availableAssets = useMemo(() => {
        return fileAssets
            .filter(fa => fa.type === 'fasset' && !existingIds.includes(fa.id))
            .map(fa => dataAssets.find(da => da.id === fa.id))
            .filter(Boolean)
            .filter(da => da!.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [fileAssets, dataAssets, existingIds, searchTerm]);
    
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleAdd = () => {
        onAdd(Array.from(selectedIds));
    };

    return ReactDOM.createPortal(
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-[var(--bg-panel)] w-full max-w-lg h-[60vh] rounded-lg shadow-2xl border border-[var(--border-color)] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                     <div className="flex items-center gap-3">
                        <Database size={20} className="text-[var(--accent)]" />
                        <h2 className="font-semibold text-lg">Select Data Assets</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)]"><X size={20} /></button>
                </div>

                <div className="p-3 border-b border-[var(--border-color)]">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                        <input type="text" placeholder="Search assets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[var(--bg-dark)] pl-9 pr-3 py-2 rounded-md text-sm border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-2">
                    {availableAssets.map(asset => {
                        if (!asset) return null;
                        return (
                            <button key={asset.id} onClick={() => handleToggleSelect(asset.id)} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/10 text-left">
                            {selectedIds.has(asset.id) ? <CheckSquare size={16} className="text-[var(--accent)]" /> : <Square size={16} className="text-[var(--text-secondary)]"/>}
                            <span className="text-sm">{asset.name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-3 p-4 bg-[var(--bg-dark)]/50 border-t border-[var(--border-color)]">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-md hover:bg-white/10">Cancel</button>
                    <button onClick={handleAdd} disabled={selectedIds.size === 0} className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-md disabled:opacity-50">Add Selected</button>
                </div>
            </div>
         </div>,
        document.body
    );
};