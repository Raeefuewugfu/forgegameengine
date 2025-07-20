





import React, { useState } from 'react';
import { DataTablePanel } from './panels/DataTablePanel';
import { DataAssetPanel } from './panels/DataAssetPanel';
import { Header } from './Header';
import { Database } from 'lucide-react';

const TabButton: React.FC<{ name: string; activeTab: string; onClick: () => void; }> = ({ name, activeTab, onClick }) => (
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

export const DataManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dataassets');

    return (
        <div className="flex-grow flex flex-col min-h-0">
            <Header />
            <main className="flex-grow min-h-0 p-1">
                <div className="h-full flex flex-col bg-[var(--bg-panel)] rounded-lg">
                    <div className="flex-shrink-0 border-b border-[var(--border-color)] flex items-center">
                        <div className="flex items-center gap-2 p-3 text-[var(--text-secondary)]">
                            <Database size={16} />
                            <h2 className="font-semibold text-sm text-[var(--text-primary)]">Data Manager</h2>
                        </div>
                        <div className="h-6 w-px bg-[var(--border-color)] mx-2"></div>
                        <TabButton name="Data Assets" activeTab={activeTab} onClick={() => setActiveTab('dataassets')} />
                        <TabButton name="DataTables" activeTab={activeTab} onClick={() => setActiveTab('datatables')} />
                    </div>
                    <div className="flex-grow min-h-0">
                        {activeTab === 'datatables' && <DataTablePanel />}
                        {activeTab === 'dataassets' && <DataAssetPanel />}
                    </div>
                </div>
            </main>
        </div>
    );
};