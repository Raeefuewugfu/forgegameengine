
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Save, Plus, Bot, Loader2, MoreHorizontal, Trash2, Copy, Settings2, MessageCircleQuestion, X } from 'lucide-react';
import ReactDOM from 'react-dom';
import { useBlueprintStore, BlueprintScript, BlueprintNode, Wire, Pin, InputConfiguration, InputBinding } from '../../store/blueprintStore';
import { BlueprintAiPanel, generateBlueprintName } from './BlueprintAiPanel';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { BlueprintActionMenu } from './BlueprintActionMenu';
import { useEditorStore } from '../../store/editorStore';

// --- TYPES ---
interface WireCreationState {
    fromNodeId: string;
    fromPinId: string;
    fromPinType: 'exec' | 'data';
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

// --- SUB-COMPONENTS ---
const InputConfigurationModal: React.FC<{
    nodeId: string;
    initialConfig: InputConfiguration;
    onSave: (nodeId: string, newConfig: InputConfiguration) => void;
    onClose: () => void;
}> = ({ nodeId, initialConfig, onSave, onClose }) => {
    const [config, setConfig] = useState<InputConfiguration>(initialConfig);

    const handleBindingChange = (bindingId: string, field: keyof InputBinding, value: any) => {
        setConfig(prev => ({
            ...prev,
            bindings: prev.bindings.map(b => b.id === bindingId ? { ...b, [field]: value } : b)
        }));
    };

    const addBinding = () => {
        const newBinding: InputBinding = {
            id: `bind-${Date.now()}`,
            key: '',
            scale: 1.0,
            device: 'Keyboard'
        };
        setConfig(prev => ({ ...prev, bindings: [...prev.bindings, newBinding] }));
    };

    const removeBinding = (bindingId: string) => {
        setConfig(prev => ({ ...prev, bindings: prev.bindings.filter(b => b.id !== bindingId) }));
    };

    const handleSave = () => {
        onSave(nodeId, config);
        onClose();
    };

    const commonInputClass = "bg-[var(--bg-deep-dark)] text-white p-2 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm";
    const commonSelectClass = `${commonInputClass} pr-8`;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-[var(--bg-panel)] w-full max-w-2xl rounded-lg shadow-2xl border border-[var(--border-color)] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <h2 className="font-semibold text-lg">Input Configuration for "{config.mappingName}"</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)]"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-sm text-[var(--text-secondary)]">Mapping Type</label>
                        <select value={config.mappingType} onChange={e => setConfig(c => ({...c, mappingType: e.target.value as any}))} className={`${commonSelectClass} w-full mt-1`}>
                            <option>Action</option>
                            <option>Axis</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-[var(--text-secondary)]">Bindings</label>
                        <div className="border border-[var(--border-color)] rounded-md">
                            <div className="grid grid-cols-4 gap-4 p-2 bg-[var(--bg-dark)] text-xs text-[var(--text-secondary)] font-semibold">
                                <span>Key / Axis</span>
                                <span>Scale</span>
                                <span>Device</span>
                                <span></span>
                            </div>
                            <div className="max-h-40 overflow-y-auto p-2 space-y-2">
                                {config.bindings.map(b => (
                                    <div key={b.id} className="grid grid-cols-4 gap-4 items-center">
                                        <input type="text" value={b.key} onChange={e => handleBindingChange(b.id, 'key', e.target.value)} className={commonInputClass} />
                                        <input type="number" step="0.1" value={b.scale} onChange={e => handleBindingChange(b.id, 'scale', parseFloat(e.target.value))} className={commonInputClass} />
                                        <select value={b.device} onChange={e => handleBindingChange(b.id, 'device', e.target.value)} className={commonSelectClass}>
                                            <option>Keyboard</option>
                                            <option>Mouse</option>
                                            <option>Gamepad</option>
                                        </select>
                                        <button onClick={() => removeBinding(b.id)} className="text-red-400 hover:text-red-300 justify-self-center"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={addBinding} className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]">+ Add Binding</button>
                    </div>

                    {config.mappingType === 'Axis' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-[var(--text-secondary)]">Dead Zone</label>
                                <input type="number" step="0.01" min="0" max="1" value={config.deadZone} onChange={e => setConfig(c => ({...c, deadZone: parseFloat(e.target.value)}))} className={`${commonInputClass} w-full mt-1`} />
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-secondary)]">Sensitivity</label>
                                <input type="number" step="0.1" min="0" value={config.sensitivity} onChange={e => setConfig(c => ({...c, sensitivity: parseFloat(e.target.value)}))} className={`${commonInputClass} w-full mt-1`} />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-[var(--text-secondary)]">Context</label>
                            <select value={config.context} onChange={e => setConfig(c => ({...c, context: e.target.value as any}))} className={`${commonSelectClass} w-full mt-1`}>
                                <option>GameplayOnly</option>
                                <option>UIOnly</option>
                                <option>Always</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--text-secondary)]">Input Group</label>
                             <input type="text" value={config.inputGroup} onChange={e => setConfig(c => ({...c, inputGroup: e.target.value}))} className={`${commonInputClass} w-full mt-1`} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-4 bg-[var(--bg-dark)]/50 border-t border-[var(--border-color)]">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-white/10">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)]">Save</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const NodePropertyEditor: React.FC<{ nodeId: string, propKey: string, value: any, onChange: (nodeId: string, propKey: string, value: any) => void }> = ({ nodeId, propKey, value, onChange }) => {
    // We don't want to render the input configuration object directly.
    if (propKey === 'inputConfiguration') return null;

    const type = typeof value;
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => { setLocalValue(value); }, [value]);

    const handleBlur = () => {
        if (type === 'number' && localValue !== value) {
            onChange(nodeId, propKey, parseFloat(localValue) || 0);
        } else if (type === 'string' && localValue !== value) {
            onChange(nodeId, propKey, localValue);
        }
    };
    
    const commonInputClass = "w-full bg-[var(--bg-deep-dark)] text-white p-1 mt-1 rounded-md border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] text-sm";

    return (
        <div className="px-3 pb-2">
            <label className="text-xs text-[var(--text-secondary)] capitalize">{propKey.replace(/([A-Z])/g, ' $1')}</label>
            {type === 'number' && (
                <input type="number" step={0.1} value={localValue} onChange={e => setLocalValue(e.target.value)} onBlur={handleBlur} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className={commonInputClass} />
            )}
            {type === 'string' && (
                <input type="text" value={localValue} onChange={e => setLocalValue(e.target.value)} onBlur={handleBlur} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className={commonInputClass} />
            )}
            {type === 'boolean' && (
                 <input type="checkbox" checked={value} onChange={e => onChange(nodeId, propKey, e.target.checked)} className="w-4 h-4 rounded mt-1 accent-[var(--accent)]" />
            )}
        </div>
    );
};


const NodeComponent: React.FC<{
    node: BlueprintNode;
    onPinMouseDown: (nodeId: string, pin: Pin, e: React.MouseEvent) => void;
    onPinMouseUp: (nodeId: string, pin: Pin, e: React.MouseEvent) => void;
    onPropertyChange: (nodeId: string, propKey: string, value: any) => void;
    isConnected: (pinId: string) => boolean;
    onDelete: (nodeId: string) => void;
    onDuplicate: (node: BlueprintNode) => void;
    onConfigureInput: (nodeId: string) => void;
    onAskAi: (nodeId: string) => void;
}> = ({ node, onPinMouseDown, onPinMouseUp, onPropertyChange, isConnected, onDelete, onDuplicate, onConfigureInput, onAskAi }) => {
    const [nodeMenu, setNodeMenu] = useState<{ x: number; y: number } | null>(null);

    const PinComponent: React.FC<{ pin: Pin, isOutput: boolean }> = ({ pin, isOutput }) => (
        <div className={`flex items-center gap-2 text-xs ${isOutput ? 'flex-row-reverse' : ''}`}>
            <div 
                id={`pin-${node.id}-${pin.id}`}
                data-pin-type={pin.type}
                className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-colors ${
                    pin.type === 'exec' ? 'border-[var(--accent)]' : 'border-green-400'
                } ${isConnected(pin.id) ? (pin.type === 'exec' ? 'bg-[var(--accent)]' : 'bg-green-400') : 'bg-transparent hover:bg-white/30' }`}
                 onMouseDown={(e) => isOutput && onPinMouseDown(node.id, pin, e)}
                 onMouseUp={(e) => !isOutput && onPinMouseUp(node.id, pin, e)}
            />
            {pin.name && <span className="text-[var(--text-secondary)] select-none">{pin.name}</span>}
        </div>
    );

    const nodeMenuItems: ContextMenuItem[] = [
        { label: 'Ask AI about node', icon: <MessageCircleQuestion size={16} />, action: () => onAskAi(node.id) },
        { label: 'Duplicate Node', icon: <Copy size={16} />, action: () => onDuplicate(node) },
        { type: 'separator' },
        { label: 'Delete Node', icon: <Trash2 size={16} />, action: () => onDelete(node.id) },
    ];


    return (
        <div id={node.id} className="absolute bg-zinc-800/80 backdrop-blur-md border border-[var(--border-color)] rounded-lg shadow-xl flex flex-col z-10 select-none" style={{ top: node.y, left: node.x, minWidth: 200 }}>
            <div data-drag-handle className="flex items-center justify-between pl-3 pr-1 py-1 font-bold text-sm border-b border-[var(--border-color)] cursor-move bg-zinc-900/50 rounded-t-lg">
                <span className="flex-grow">{node.title}</span>
                 <button onClick={(e) => { e.stopPropagation(); setNodeMenu({ x: e.clientX, y: e.clientY }); }} className="p-1 rounded-md text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-colors">
                    <MoreHorizontal size={16} />
                </button>
            </div>
            <div className="flex justify-between p-3">
                <div className="space-y-2">{node.inputs.map(pin => <PinComponent key={pin.id} pin={pin} isOutput={false} />)}</div>
                <div className="space-y-2">{node.outputs.map(pin => <PinComponent key={pin.id} pin={pin} isOutput={true} />)}</div>
            </div>
            {node.properties && Object.keys(node.properties).length > 0 && (
                <div className="border-t border-[var(--border-color)] pt-2">
                    {Object.entries(node.properties).map(([key, value]) => {
                         if (isConnected(key)) return null; // Don't render input if pin is connected
                         return <NodePropertyEditor key={key} nodeId={node.id} propKey={key} value={value} onChange={onPropertyChange} />
                    })}
                </div>
            )}
            {node.title === 'Add Movement Input' && (
                <div className="p-2 border-t border-[var(--border-color)]">
                    <button
                        onClick={() => onConfigureInput(node.id)}
                        className="w-full flex items-center justify-center gap-2 text-center py-1.5 px-3 bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-semibold rounded-md hover:bg-[var(--accent)]/40 transition-colors"
                    >
                        <Settings2 size={14} /> Configure Input
                    </button>
                </div>
            )}
             {nodeMenu && <ContextMenu items={nodeMenuItems} x={nodeMenu.x} y={nodeMenu.y} onClose={() => setNodeMenu(null)} />}
        </div>
    );
};


// --- MAIN EDITOR COMPONENT ---

export const BlueprintEditor: React.FC<{ onExit: () => void, blueprintId: string }> = ({ onExit, blueprintId }) => {
    const { getBlueprint, saveBlueprint } = useBlueprintStore();
    const { askAiAboutNode } = useEditorStore();
    
    const [name, setName] = useState('NewBlueprint');
    const [nodes, setNodes] = useState<BlueprintNode[]>([]);
    const [wires, setWires] = useState<Wire[]>([]);
    const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [wireCreationState, setWireCreationState] = useState<WireCreationState | null>(null);
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [inputConfigState, setInputConfigState] = useState<{ isOpen: boolean; nodeId: string | null }>({ isOpen: false, nodeId: null });
    const editorRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const bp = getBlueprint(blueprintId);
        if (bp) {
            setName(bp.name);
            setNodes(bp.nodes);
            setWires(bp.wires);
        }
    }, [blueprintId, getBlueprint]);

    const handleSaveAndExit = useCallback(async () => {
        setIsSaving(true);
        let finalName = name;
        if (name.startsWith('NewBlueprint')) {
            finalName = await generateBlueprintName({nodes, wires});
        }
        const blueprintData: BlueprintScript = { id: blueprintId, name: finalName, nodes, wires };
        saveBlueprint(blueprintData);
        await new Promise(res => setTimeout(res, 300)); // Simulate save time
        setIsSaving(false);
        onExit();
    }, [blueprintId, name, nodes, wires, saveBlueprint, onExit]);

    const addNode = useCallback((nodeType: Omit<BlueprintNode, 'id' | 'x' | 'y'>, pos: {x: number, y: number}) => {
        const newNode: BlueprintNode = {
            id: `${nodeType.title.replace(/\s/g, '')}-${Date.now()}`,
            ...nodeType,
            x: pos.x,
            y: pos.y,
        };
        setNodes(prev => [...prev, newNode]);
    }, []);

    const deleteNode = useCallback((nodeId: string) => {
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setWires(prev => prev.filter(w => w.fromNodeId !== nodeId && w.toNodeId !== nodeId));
    }, []);

    const duplicateNode = useCallback((nodeToDuplicate: BlueprintNode) => {
        const newNode: BlueprintNode = {
            ...nodeToDuplicate,
            id: `${nodeToDuplicate.title.replace(/\s/g, '')}-${Date.now()}`,
            x: nodeToDuplicate.x + 30,
            y: nodeToDuplicate.y + 30,
        };
        setNodes(prev => [...prev, newNode]);
    }, []);
    
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const target = e.target as HTMLElement;
        if (target.closest('[data-ai-panel]') || target.closest('.absolute')) {
            return;
        }
        setContextMenu({ x: e.clientX, y: e.clientY });
    }, []);
    
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (contextMenu) setContextMenu(null);
        const target = e.target as HTMLElement;

        if (e.button === 1 || (e.altKey && e.button === 0) || (e.metaKey && e.button === 0)) { // Pan
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
            return;
        }

        if (target.getAttribute('data-drag-handle')) { // Drag node
            const nodeEl = target.closest<HTMLDivElement>('.absolute');
            if (nodeEl) {
                const nodeId = nodeEl.id;
                const node = nodes.find(n => n.id === nodeId);
                if(nodeId && node) {
                    setDraggingNodeId(nodeId);
                    const mouseX = (e.clientX - pan.x) / zoom;
                    const mouseY = (e.clientY - pan.y) / zoom;
                    setDragOffset({ x: mouseX - node.x, y: mouseY - node.y });
                }
            }
        }
    }, [contextMenu, nodes, pan, zoom]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
        if (draggingNodeId) {
            const mouseX = (e.clientX - pan.x) / zoom;
            const mouseY = (e.clientY - pan.y) / zoom;
            const newX = mouseX - dragOffset.x;
            const newY = mouseY - dragOffset.y;
            setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
        }
        if (wireCreationState && editorRef.current) {
             const rect = editorRef.current.getBoundingClientRect();
            setWireCreationState(s => s ? { ...s, endX: e.clientX - rect.left, endY: e.clientY - rect.top } : null);
        }
    }, [draggingNodeId, dragOffset, wireCreationState, isPanning, lastMousePos, pan, zoom]);

    const handleMouseUp = useCallback(() => {
        setDraggingNodeId(null);
        setWireCreationState(null);
        setIsPanning(false);
    }, []);

    const handlePinMouseDown = useCallback((nodeId: string, pin: Pin, e: React.MouseEvent) => {
        e.stopPropagation();
        const pinEl = document.getElementById(`pin-${nodeId}-${pin.id}`);
        if (!pinEl || !editorRef.current) return;
        const editorRect = editorRef.current.getBoundingClientRect();
        const pinRect = pinEl.getBoundingClientRect();
        const startX = (pinRect.left + pinRect.width / 2 - editorRect.left - pan.x) / zoom;
        const startY = (pinRect.top + pinRect.height / 2 - editorRect.top - pan.y) / zoom;
        setWireCreationState({ fromNodeId: nodeId, fromPinId: pin.id, fromPinType: pin.type, startX, startY, endX: startX, endY: startY });
    }, [pan.x, pan.y, zoom]);

    const handlePinMouseUp = useCallback((nodeId: string, pin: Pin, e: React.MouseEvent) => {
        e.stopPropagation();
        if (wireCreationState && wireCreationState.fromNodeId !== nodeId && wireCreationState.fromPinType === pin.type) {
             // Avoid connecting an output to another output, or input to input.
            const fromNode = nodes.find(n => n.id === wireCreationState.fromNodeId);
            const toNode = nodes.find(n => n.id === nodeId);
            const fromPinIsOutput = fromNode?.outputs.some(p => p.id === wireCreationState.fromPinId);
            const toPinIsInput = toNode?.inputs.some(p => p.id === pin.id);

            if(fromPinIsOutput && toPinIsInput) {
                const newWire: Wire = {
                    id: `wire-${wireCreationState.fromNodeId}-${nodeId}-${Date.now()}`,
                    fromNodeId: wireCreationState.fromNodeId,
                    fromPinId: wireCreationState.fromPinId,
                    toNodeId: nodeId,
                    toPinId: pin.id,
                };
                setWires(prev => [...prev.filter(w => w.toNodeId !== nodeId || w.toPinId !== pin.id), newWire]);
            }
        }
        setWireCreationState(null);
    }, [wireCreationState, nodes]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (editorRef.current) {
            e.preventDefault();
            const editorRect = editorRef.current.getBoundingClientRect();
            const mouseX = e.clientX - editorRect.left;
            const mouseY = e.clientY - editorRect.top;

            const zoomFactor = -e.deltaY * 0.001;
            const newZoom = Math.max(0.2, Math.min(2, zoom + zoomFactor));

            const panX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
            const panY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
            
            setZoom(newZoom);
            setPan({ x: panX, y: panY });
        }
    }, [zoom, pan]);

    const handleAiGenerate = useCallback((generated: { nodes: Omit<BlueprintNode, 'id'>[], wires: Omit<Wire, 'id'>[] }) => {
        const tempIdToNewIdMap = new Map<string, string>();
        const newNodes: BlueprintNode[] = [];

        generated.nodes.forEach((aiNode: any) => {
            const newNode: BlueprintNode = {
                ...aiNode,
                id: `${aiNode.title.replace(/\s/g, '')}-${Date.now()}-${Math.random()}`,
            };
            newNodes.push(newNode);
            tempIdToNewIdMap.set(aiNode.tempId, newNode.id);
        });

        const newWires: Wire[] = [];
        generated.wires.forEach((aiWire: any) => {
            const fromNodeId = tempIdToNewIdMap.get(aiWire.fromNodeTempId);
            const toNodeId = tempIdToNewIdMap.get(aiWire.toNodeTempId);

            if (fromNodeId && toNodeId) {
                const newWire: Wire = {
                    id: `wire-${Date.now()}-${Math.random()}`,
                    fromNodeId,
                    fromPinId: aiWire.fromPinId,
                    toNodeId,
                    toPinId: aiWire.toPinId,
                };
                newWires.push(newWire);
            }
        });

        setNodes(prev => [...prev, ...newNodes]);
        setWires(prev => [...prev, ...newWires]);
    }, []);

     const handleNodePropertyChange = useCallback((nodeId: string, propKey: string, value: any) => {
        setNodes(prev => prev.map(n => {
            if (n.id === nodeId && n.properties) {
                return { ...n, properties: { ...n.properties, [propKey]: value } };
            }
            return n;
        }));
    }, []);
    
    const handleSaveInputConfiguration = useCallback((nodeId: string, newConfig: InputConfiguration) => {
        handleNodePropertyChange(nodeId, 'inputConfiguration', newConfig);
    }, [handleNodePropertyChange]);
    
    const getPinPosition = (nodeId: string, pinId: string): {x: number, y: number} | null => {
        const pinEl = document.getElementById(`pin-${nodeId}-${pinId}`);
        const nodeEl = document.getElementById(nodeId);
        if(!pinEl || !nodeEl) return null;
        const nodeRect = nodeEl.getBoundingClientRect();
        const pinRect = pinEl.getBoundingClientRect();
        return {
            x: nodeEl.offsetLeft + pinEl.offsetLeft + pinRect.width / 2,
            y: nodeEl.offsetTop + pinEl.offsetTop + pinRect.height / 2
        };
    };

    const getWirePath = (startPos: {x:number, y:number}, endPos: {x:number, y:number}) => {
        const dx = Math.abs(endPos.x - startPos.x) * 0.6;
        const handleX1 = startPos.x + Math.max(50, dx);
        const handleX2 = endPos.x - Math.max(50, dx);
        return `M ${startPos.x} ${startPos.y} C ${handleX1} ${startPos.y}, ${handleX2} ${endPos.y}, ${endPos.x} ${endPos.y}`;
    };

    const isPinConnected = useCallback((pinId: string) => {
        return wires.some(w => w.fromPinId === pinId || w.toPinId === pinId);
    }, [wires]);

    return (
        <div className="w-screen h-screen bg-zinc-900 flex flex-col text-[var(--text-primary)]">
            <header className="h-12 bg-[var(--bg-dark)] border-b border-[var(--border-color)] flex items-center justify-between px-4 flex-shrink-0 z-20">
                <button onClick={handleSaveAndExit} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors">
                    <ChevronLeft size={18} />
                    <span>Back to Main Editor</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{name}</span>
                </div>
                 <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsAiPanelOpen(p => !p)}
                        className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm transition-colors transform ${isAiPanelOpen ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-white hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]'}`}
                    >
                        <Bot size={16} />
                        <span>Blueprint AI</span>
                    </button>
                    <button
                        onClick={handleSaveAndExit}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-[var(--accent)] text-white rounded-md font-semibold text-sm transition-transform transform hover:scale-105 disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        <span>{isSaving ? 'Saving...' : 'Save & Exit'}</span>
                    </button>
                </div>
            </header>

            <div className="flex-grow flex flex-row overflow-hidden">
                <main 
                    ref={editorRef}
                    className="flex-grow relative overflow-hidden bg-zinc-900" 
                    onContextMenu={handleContextMenu}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    style={{ cursor: isPanning ? 'grabbing' : 'default', background: 'radial-gradient(circle at center, rgb(30,31,34) 0%, rgb(22,23,25) 100%)' }}
                >
                    <div 
                        className="absolute inset-0 z-0" 
                        style={{
                            backgroundPosition: `${pan.x}px ${pan.y}px`,
                            backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 0)',
                            backgroundSize: `${20 * zoom}px ${20 * zoom}px`
                        }}
                    ></div>
                    
                    <div className="relative w-full h-full" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left'}}>
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-[5]" style={{ overflow: 'visible' }}>
                            {/* Render existing wires */}
                            {wires.map(wire => {
                                const startNode = nodes.find(n => n.id === wire.fromNodeId);
                                const endNode = nodes.find(n => n.id === wire.toNodeId);
                                if (!startNode || !endNode) return null;
                                const startPos = getPinPosition(wire.fromNodeId, wire.fromPinId);
                                const endPos = getPinPosition(wire.toNodeId, wire.toPinId);
                                if (!startPos || !endPos) return null;
                                
                                const startPin = startNode.outputs.find(p => p.id === wire.fromPinId);
                                const isExec = startPin?.type === 'exec';
                                const strokeColor = isExec ? 'var(--accent)' : 'rgb(34 197 94)';
                                const strokeWidth = isExec ? 3 : 2;
                                
                                return <path key={wire.id} d={getWirePath(startPos, endPos)} stroke={strokeColor} strokeWidth={strokeWidth} fill="none"/>;
                            })}
                            {/* Render wire being created */}
                            {wireCreationState && (
                                <path
                                    d={getWirePath({ x: wireCreationState.startX, y: wireCreationState.startY }, { x: (wireCreationState.endX - pan.x)/zoom, y: (wireCreationState.endY-pan.y)/zoom })}
                                    stroke={wireCreationState.fromPinType === 'exec' ? 'var(--accent)' : 'rgb(34 197 94)'}
                                    strokeWidth={wireCreationState.fromPinType === 'exec' ? 3 : 2}
                                    fill="none"
                                />
                            )}
                        </svg>

                        {nodes.map(node => <NodeComponent key={node.id} node={node} onPinMouseDown={handlePinMouseDown} onPinMouseUp={handlePinMouseUp} onPropertyChange={handleNodePropertyChange} isConnected={(pinId) => isPinConnected(pinId)} onDelete={deleteNode} onDuplicate={duplicateNode} onConfigureInput={(nodeId) => setInputConfigState({isOpen: true, nodeId})} onAskAi={askAiAboutNode} />)}
                    </div>
                </main>

                {isAiPanelOpen && (
                    <BlueprintAiPanel 
                        onGenerate={handleAiGenerate}
                        onClose={() => setIsAiPanelOpen(false)}
                        nodes={nodes}
                        wires={wires}
                    />
                )}
            </div>
            {contextMenu && <BlueprintActionMenu menu={contextMenu} graph={{nodes, wires}} onSelect={(nodeType) => {
                if(!editorRef.current) return;
                const rect = editorRef.current.getBoundingClientRect();
                const x = (contextMenu.x - rect.left - pan.x) / zoom;
                const y = (contextMenu.y - rect.top - pan.y) / zoom;
                addNode(nodeType, { x, y });
                setContextMenu(null);
            }} onClose={() => setContextMenu(null)} />}

            {inputConfigState.isOpen && inputConfigState.nodeId && (
                <InputConfigurationModal
                    nodeId={inputConfigState.nodeId}
                    initialConfig={nodes.find(n => n.id === inputConfigState.nodeId)?.properties?.inputConfiguration}
                    onSave={handleSaveInputConfiguration}
                    onClose={() => setInputConfigState({isOpen: false, nodeId: null})}
                />
            )}
        </div>
    );
};
