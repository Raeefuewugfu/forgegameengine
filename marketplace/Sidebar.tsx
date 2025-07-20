
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

// Interfaces
export interface Category {
    id: string;
    name: string;
    count?: number;
    icon?: React.ReactNode;
    children?: Category[];
}

// Collapsible Section Component
const SidebarSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="py-2">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-xs font-bold uppercase text-zinc-400 hover:text-white px-2 py-1">
                {title}
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isOpen && <div className="mt-2 space-y-1">{children}</div>}
        </div>
    );
};

// Item in the sidebar
const SidebarItem: React.FC<{
    item: Category;
    level: number;
    activeItemId: string;
    onItemClick: (id: string) => void;
}> = ({ item, level, activeItemId, onItemClick }) => {
    const [isOpen, setIsOpen] = useState(item.name === '3D' || item.name === 'Characters & Creatures');
    const isActive = activeItemId === item.id;
    const hasChildren = item.children && item.children.length > 0;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div>
            <button
                onClick={() => onItemClick(item.id)}
                className={`w-full flex items-center justify-between text-left text-sm rounded transition-colors pr-2 ${
                    isActive ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
                style={{ paddingLeft: `${0.5 + level * 1}rem` }}
            >
                <div className="flex items-center gap-2 py-1.5">
                    {hasChildren ? (
                        <span onClick={handleToggle} className="p-0.5 text-zinc-500 hover:text-white">
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                    ) : (
                        <span className="w-[18px] flex items-center justify-center">{item.icon}</span>
                    )}
                    <span>{item.name}</span>
                </div>
                {item.count && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-zinc-500' : 'bg-zinc-700'}`}>
                        {item.count.toLocaleString()}{typeof item.count === 'number' && item.count % 1 !== 0 ? '' : 'K'}
                    </span>
                )}
            </button>
            {isOpen && hasChildren && (
                <div className="mt-1 space-y-px">
                    {item.children?.map(child => (
                        <SidebarItem key={child.id} item={child} level={level + 1} activeItemId={activeItemId} onItemClick={onItemClick} />
                    ))}
                </div>
            )}
        </div>
    );
};

// Main Sidebar Component
interface SidebarProps {
    categories: Record<string, Category[]>;
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ categories, isOpen, onClose }) => {
    const [activeItemId, setActiveItemId] = useState('anatomy');

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            <aside
                className={`
                    w-72 bg-zinc-900 p-2 flex-shrink-0 h-full overflow-y-auto border-r border-zinc-800
                    fixed inset-y-0 left-0 z-40 transform transition-transform md:relative md:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex items-center justify-between text-white px-2 py-4">
                    <h2 className="text-2xl font-bold">Discover</h2>
                    <button onClick={onClose} className="p-2 md:hidden text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                {Object.entries(categories).map(([title, items]) => (
                    <SidebarSection key={title} title={title}>
                        {items.map(item => (
                            <SidebarItem key={item.id} item={item} level={0} activeItemId={activeItemId} onItemClick={setActiveItemId} />
                        ))}
                    </SidebarSection>
                ))}
            </aside>
        </>
    );
};
