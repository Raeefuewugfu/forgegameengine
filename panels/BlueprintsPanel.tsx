

import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useBlueprintStore, BlueprintScript } from '../../store/blueprintStore';
import { LayoutTemplate, PlusCircle, MoreVertical, Edit3, Trash2, Check, X, MessageCircleQuestion } from 'lucide-react';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';

const BlueprintWelcome: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
    <div className="h-full p-4 flex flex-col items-center justify-center text-center text-[var(--text-secondary)]">
        <LayoutTemplate size={48} className="mb-4 text-[var(--accent)]" />
        <h3 className="font-semibold text-xl text-[var(--text-primary)] mb-2">Welcome to Blueprints</h3>
        <p className="text-sm max-w-2xl mb-2">
           Blueprints are a visual scripting system that allows you to create game logic by connecting nodes, without writing code.
        </p>
        <p className="text-xs max-w-xl mb-6">
            They are used to create interactions, control movement and input, program AI behavior, drive UI systems, and build multiplayer events.
        </p>
        <button
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-md font-semibold text-sm transition-transform transform hover:scale-105"
        >
            <PlusCircle size={18} />
            Create Your First Blueprint
        </button>
    </div>
);

const BlueprintCard: React.FC<{ blueprint: BlueprintScript }> = ({ blueprint }) => {
    const { openBlueprintEditor, askAiAboutBlueprint } = useEditorStore(state => ({
        openBlueprintEditor: state.openBlueprintEditor,
        askAiAboutBlueprint: state.askAiAboutBlueprint,
    }));
    const { renameBlueprint, deleteBlueprint } = useBlueprintStore();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState(blueprint.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isRenaming]);

    const handleRename = () => {
        if (name.trim() && name.trim() !== blueprint.name) {
            renameBlueprint(blueprint.id, name.trim());
        }
        setIsRenaming(false);
    };

    const handleCancelRename = () => {
        setName(blueprint.name);
        setIsRenaming(false);
    };

    const menuItems: ContextMenuItem[] = [
        { label: 'Edit', icon: <Edit3 size={16} />, action: () => openBlueprintEditor(blueprint.id) },
        { label: 'Rename', icon: <Check size={16} />, action: () => setIsRenaming(true) },
        { label: 'Ask AI', icon: <MessageCircleQuestion size={16} />, action: () => askAiAboutBlueprint(blueprint.id) },
        { type: 'separator' },
        { label: 'Delete', icon: <Trash2 size={16} />, action: () => deleteBlueprint(blueprint.id) }
    ];

    return (
        <div 
            onDoubleClick={() => openBlueprintEditor(blueprint.id)}
            className="group relative flex flex-col items-center gap-2 p-3 rounded-lg bg-[var(--bg-dark)] border border-[var(--border-color)] hover:border-[var(--accent)] transition-all cursor-pointer"
        >
            <LayoutTemplate size={40} className="text-[var(--accent)] transition-transform group-hover:scale-110" />
            
            {isRenaming ? (
                 <div className="flex items-center gap-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') handleCancelRename();
                        }}
                        className="w-full bg-black/50 border border-[var(--accent)] rounded-sm px-1 text-xs text-center"
                    />
                 </div>
            ) : (
                <p className="text-xs text-[var(--text-primary)] font-semibold truncate w-full text-center">{blueprint.name}</p>
            )}

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY });
                }}
                className="absolute top-1 right-1 p-1 rounded-full text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white transition-opacity"
            >
                <MoreVertical size={16} />
            </button>

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


export const BlueprintsPanel: React.FC = () => {
    const blueprints = useBlueprintStore(state => state.blueprints);
    const createNewBlueprintAndEdit = useEditorStore(state => state.createNewBlueprintAndEdit);

    if (blueprints.length === 0) {
        return <BlueprintWelcome onCreate={createNewBlueprintAndEdit} />;
    }

    return (
        <div className="h-full w-full flex flex-col p-2">
            <div className="flex-shrink-0 flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Project Blueprints</h3>
                <button
                    onClick={createNewBlueprintAndEdit}
                    className="flex items-center gap-2 px-3 py-1 bg-[var(--accent)]/80 text-white rounded-md font-semibold text-xs transition-transform transform hover:scale-105 hover:bg-[var(--accent)]"
                >
                    <PlusCircle size={14} />
                    New Blueprint
                </button>
            </div>
            <div className="flex-grow overflow-y-auto p-2">
                <div className="grid grid-cols-5 gap-4">
                    {blueprints.map(bp => (
                        <BlueprintCard key={bp.id} blueprint={bp} />
                    ))}
                </div>
            </div>
        </div>
    );
};