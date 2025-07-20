
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { usePackageStore, ForgePackage } from '../../store/packageStore';
import { X, Package, CheckCircle, Download, ArrowUpCircle, Info, Search, Loader2, Lock } from 'lucide-react';

const PackageRow: React.FC<{ pkg: ForgePackage }> = ({ pkg }) => {
    const { installPackage, uninstallPackage, updatePackage } = usePackageStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = (action: () => void) => {
        setIsLoading(true);
        setTimeout(() => { // Simulate network request
            action();
            setIsLoading(false);
        }, 800);
    };

    const actionButton = () => {
        if (pkg.isUninstallable) {
            return (
                <div className="flex items-center justify-end gap-1.5 text-xs text-zinc-500 font-semibold">
                    <Lock size={12} />
                    Required
                </div>
            );
        }

        switch(pkg.status) {
            case 'installed':
                return <button onClick={() => handleAction(() => uninstallPackage(pkg.id))} className="px-3 py-1 text-xs font-semibold text-red-400 bg-red-500/10 rounded-md hover:bg-red-500/20 transition-colors">Uninstall</button>;
            case 'not_installed':
                return <button onClick={() => handleAction(() => installPackage(pkg.id))} className="px-3 py-1 text-xs font-semibold text-white bg-[var(--accent)] rounded-md hover:bg-[var(--accent-hover)] transition-colors">Install</button>;
            case 'update_available':
                return (
                    <div className="flex items-center gap-2">
                         <button onClick={() => handleAction(() => uninstallPackage(pkg.id))} className="px-3 py-1 text-xs font-semibold text-red-400 bg-red-500/10 rounded-md hover:bg-red-500/20 transition-colors">Uninstall</button>
                        <button onClick={() => handleAction(() => updatePackage(pkg.id))} className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-500 transition-colors">
                            <ArrowUpCircle size={14} /> Update
                        </button>
                    </div>
                );
        }
    }
    
    return (
        <div className="flex items-center p-3 border-b border-[var(--border-color)] last:border-b-0 hover:bg-white/5 transition-colors">
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{pkg.name}</h4>
                    <span className="text-xs text-zinc-400 font-mono bg-zinc-700/50 px-1.5 py-0.5 rounded">{pkg.version}</span>
                    {pkg.status === 'installed' && !isLoading && <CheckCircle size={16} className="text-green-500" />}
                </div>
                <p className="text-sm text-zinc-400 mt-1">{pkg.description}</p>
                <p className="text-xs text-zinc-500 mt-2">by {pkg.author}</p>
            </div>
            <div className="flex-shrink-0 w-32 text-right">
                {isLoading ? <div className="flex items-center justify-end gap-2 text-xs text-zinc-400"><Loader2 size={14} className="animate-spin"/> Processing...</div> : actionButton()}
            </div>
        </div>
    );
};

interface PackageManagerProps {
    onClose: () => void;
}

export const PackageManager: React.FC<PackageManagerProps> = ({ onClose }) => {
    const packages = usePackageStore(state => state.packages);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPackages = packages.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-[var(--bg-panel)] w-full max-w-4xl h-[70vh] rounded-lg shadow-2xl border border-[var(--border-color)] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Package size={20} className="text-[var(--accent)]" />
                        <h2 className="font-semibold text-lg">Package Manager</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)]"><X size={20} /></button>
                </div>
                
                <div className="flex flex-col flex-grow min-h-0">
                    <div className="p-3 border-b border-[var(--border-color)]">
                         <div className="relative">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search packages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-zinc-800 border border-[var(--border-color)] rounded-lg pl-10 pr-4 py-2 text-base focus:outline-none focus:border-[var(--accent)]"
                            />
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {filteredPackages.map(pkg => <PackageRow key={pkg.id} pkg={pkg} />)}
                        {filteredPackages.length === 0 && (
                            <div className="p-8 text-center text-zinc-500">
                                <Info size={24} className="mx-auto mb-2"/>
                                No packages found matching your search.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};