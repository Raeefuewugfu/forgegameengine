import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Search, X } from 'lucide-react';
import { ComponentKey } from '../../types';

interface ComponentInfo {
    key: string;
    name: string;
    icon: React.ReactNode;
}

interface AddComponentMenuProps {
    onClose: () => void;
    onSelect: (componentType: ComponentKey) => void;
    availableComponents: ComponentInfo[];
    position: { top: number; left: number; width: number; };
}

export const AddComponentMenu: React.FC<AddComponentMenuProps> = ({ onClose, onSelect, availableComponents, position }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        searchInputRef.current?.focus();
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    
    const handleSelect = (componentType: ComponentKey) => {
        onSelect(componentType);
        onClose();
    };

    const filteredComponents = availableComponents.filter(comp => 
        comp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const style: React.CSSProperties = {
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        transform: 'translateY(-100%) translateY(-8px)',
        zIndex: 1000,
    };

    return ReactDOM.createPortal(
        <div 
            ref={menuRef} 
            style={style}
            className="bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-lg shadow-2xl p-2 text-sm animate-fade-in"
        >
            <div className="relative mb-2">
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search components..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[var(--bg-deep-dark)] border border-[var(--border-color)] rounded-md pl-8 pr-8 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
                {searchTerm && <X size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] cursor-pointer" onClick={() => setSearchTerm('')}/>}
            </div>
            <div className="max-h-60 overflow-y-auto">
                {filteredComponents.length > 0 ? filteredComponents.map((comp) => (
                    <button
                        key={comp.key}
                        onClick={() => handleSelect(comp.key as ComponentKey)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors duration-150 text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white"
                    >
                        <span className="w-4 text-[var(--text-secondary)]">{comp.icon}</span>
                        <span className="flex-grow">{comp.name}</span>
                    </button>
                )) : (
                    <p className="text-center text-[var(--text-secondary)] py-4 text-xs">No matching components found.</p>
                )}
            </div>
        </div>,
        document.body
    );
};