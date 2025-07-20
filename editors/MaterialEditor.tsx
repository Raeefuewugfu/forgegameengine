
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ChevronLeft, Save, Palette, ToyBrick, Eye, Loader2 } from 'lucide-react';
import { useMaterialStore, MaterialAsset, MaterialNode, MaterialWire, MaterialPin } from '../../store/materialStore';
import { MATERIAL_NODE_DEFINITIONS, MaterialNodeDefinition } from '../materials';
import { Core } from '../../engine/Core';
import { useEditorStore } from '../../store/editorStore';

// --- SUB-COMPONENTS ---

const NodePalette: React.FC<{ onNodeSelect: (nodeDef: MaterialNodeDefinition) => void }> = ({ onNodeSelect }) => (
    <div className="flex flex-col h-full">
        <div className="p-2 border-b border-[var(--border-color)]">
            <h3 className="font-semibold text-sm">Material Nodes</h3>
        </div>
        <div className="flex-grow overflow-y-auto">
            {MATERIAL_NODE_DEFINITIONS.map(category => (
                <div key={category.category}>
                    <h4 className="px-3 py-2 text-xs font-bold uppercase text-[var(--text-secondary)]">{category.category}</h4>
                    {category.nodes.map(nodeDef => (
                        <button key={nodeDef.title} onClick={() => onNodeSelect(nodeDef)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--accent)] hover:text-white transition-colors">
                            {nodeDef.title}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    </div>
);

const PropertiesPanel: React.FC<{ selectedNode: MaterialNode | null }> = ({ selectedNode }) => (
    <div className="flex flex-col h-full">
        <div className="p-2 border-b border-[var(--border-color)]">
            <h3 className="font-semibold text-sm">Properties</h3>
        </div>
        <div className="flex-grow overflow-y-auto p-3">
            {selectedNode ? (
                <div>
                    <h4 className="font-bold mb-2">{selectedNode.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Properties editing is not yet implemented.</p>
                </div>
            ) : (
                <p className="text-xs text-[var(--text-secondary)]">Select a node to view its properties.</p>
            )}
        </div>
    </div>
);

const PreviewPanel: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Core | null>(null);

    useEffect(() => {
        if (canvasRef.current && !engineRef.current) {
            const engine = new Core(canvasRef.current, ()=>{}, ()=>{});
            engine.start();
            engineRef.current = engine;
            
            // Customize scene for preview
            engine.setGridVisibility(false);
            const allIds = engine.getSceneObjects().map(o => o.id);
            engine.deleteObjects(allIds);
            const sphereId = engine.createObject('cube'); // Using cube as placeholder for now
            engine.renameObject(sphereId, 'Preview Mesh');
            engine.focusOn(sphereId);
            engine.createObject('directionalLight');
        }
        return () => {
            engineRef.current?.stop();
        }
    }, []);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};


const NodeComponent: React.FC<{ node: MaterialNode; onPinMouseDown: (nodeId: string, pin: MaterialPin, e: React.MouseEvent) => void; onPinMouseUp: (nodeId: string, pin: MaterialPin, e: React.MouseEvent) => void; isConnected: (pinId: string) => boolean; }> = ({ node, onPinMouseDown, onPinMouseUp, isConnected }) => {
    const PinComponent: React.FC<{ pin: MaterialPin, isOutput: boolean }> = ({ pin, isOutput }) => (
        <div className={`flex items-center gap-2 text-xs ${isOutput ? 'flex-row-reverse' : ''}`}>
            <div 
                id={`pin-${node.id}-${pin.id}`}
                className={`w-3 h-3 rounded-full border-2 cursor-pointer transition-colors border-sky-400 ${
                    isConnected(pin.id) ? 'bg-sky-400' : 'bg-transparent hover:bg-white/30'
                }`}
                 onMouseDown={(e) => isOutput && onPinMouseDown(node.id, pin, e)}
                 onMouseUp={(e) => !isOutput && onPinMouseUp(node.id, pin, e)}
            />
            {pin.name && <span className="text-[var(--text-secondary)] select-none">{pin.name}</span>}
        </div>
    );

    return (
        <div id={node.id} className="absolute bg-zinc-800/80 backdrop-blur-md border border-[var(--border-color)] rounded-lg shadow-xl flex flex-col z-10 select-none" style={{ top: node.y, left: node.x, minWidth: 180 }}>
            <div data-drag-handle className="pl-3 pr-1 py-1 font-bold text-sm border-b border-[var(--border-color)] cursor-move bg-zinc-900/50 rounded-t-lg">
                {node.title}
            </div>
            <div className="flex justify-between p-3">
                <div className="space-y-2">{node.inputs.map(pin => <PinComponent key={pin.id} pin={pin} isOutput={false} />)}</div>
                <div className="space-y-2">{node.outputs.map(pin => <PinComponent key={pin.id} pin={pin} isOutput={true} />)}</div>
            </div>
        </div>
    );
};

// --- MAIN EDITOR ---

export const MaterialEditor: React.FC<{ onExit: () => void, materialId: string }> = ({ onExit, materialId }) => {
    const { getMaterial, saveMaterial } = useMaterialStore();
    const [name, setName] = useState('');
    const [nodes, setNodes] = useState<MaterialNode[]>([]);
    const [wires, setWires] = useState<MaterialWire[]>([]);
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const mat = getMaterial(materialId);
        if (mat) {
            setName(mat.name);
            setNodes(mat.nodes);
            setWires(mat.wires);
        }
    }, [materialId, getMaterial]);

    const handleSaveAndExit = useCallback(() => {
        setIsSaving(true);
        const materialData: MaterialAsset = { id: materialId, name, nodes, wires };
        saveMaterial(materialData);
        setTimeout(() => { // Simulate save
            setIsSaving(false);
            onExit();
        }, 300);
    }, [materialId, name, nodes, wires, saveMaterial, onExit]);
    
    // Most of the graph logic can be simplified or adapted from BlueprintEditor
    // For brevity, only showing essential parts
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.altKey && e.button === 0)) {
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
        const target = e.target as HTMLElement;
        if (target.getAttribute('data-drag-handle')) {
            const nodeEl = target.closest<HTMLDivElement>('.absolute');
            if(nodeEl) {
                const nodeId = nodeEl.id;
                const node = nodes.find(n => n.id === nodeId);
                if(node) {
                    setDraggingNodeId(nodeId);
                    setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
                }
            }
        }
    }, [nodes]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
        if (draggingNodeId) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
        }
    }, [isPanning, lastMousePos, draggingNodeId, dragOffset]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
        setDraggingNodeId(null);
    }, []);

    const addNode = (nodeDef: MaterialNodeDefinition) => {
        const newNode: MaterialNode = {
            id: `${nodeDef.title.replace(/\s/g, '')}-${Date.now()}`,
            ...nodeDef,
            x: 200, y: 150, // Position relative to pan
        };
        setNodes(prev => [...prev, newNode]);
    };

    return (
        <div className="w-screen h-screen bg-zinc-900 flex flex-col text-[var(--text-primary)]">
            <header className="h-12 bg-[var(--bg-dark)] border-b border-[var(--border-color)] flex items-center justify-between px-4 flex-shrink-0 z-20">
                 <button onClick={handleSaveAndExit} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors">
                    <ChevronLeft size={18} />
                    <span>Back to Main Editor</span>
                </button>
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Palette size={16} className="text-[var(--accent)]"/>
                    {name}
                </div>
                 <button onClick={handleSaveAndExit} disabled={isSaving} className="flex items-center gap-2 px-4 py-1.5 bg-[var(--accent)] text-white rounded-md font-semibold text-sm transition-transform transform hover:scale-105 disabled:opacity-70">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{isSaving ? 'Saving...' : 'Save & Exit'}</span>
                </button>
            </header>

            <main className="flex-grow flex flex-row overflow-hidden">
                <PanelGroup direction="horizontal">
                    <Panel defaultSize={20} minSize={15}>
                        <PanelGroup direction="vertical">
                            <Panel defaultSize={50} minSize={20}><NodePalette onNodeSelect={addNode} /></Panel>
                            <PanelResizeHandle />
                            <Panel defaultSize={50} minSize={20}><PropertiesPanel selectedNode={null} /></Panel>
                        </PanelGroup>
                    </Panel>
                    <PanelResizeHandle />
                    <Panel defaultSize={55} minSize={30}>
                        <div ref={editorRef} className="w-full h-full relative overflow-hidden bg-zinc-900" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                             <div className="absolute inset-0 z-0" style={{ backgroundPosition: `${pan.x}px ${pan.y}px`, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 0)', backgroundSize: `20px 20px`}}></div>
                             <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(1)`, transformOrigin: 'top left' }}>
                                {nodes.map(node => <NodeComponent key={node.id} node={node} onPinMouseDown={()=>{}} onPinMouseUp={()=>{}} isConnected={() => false} />)}
                            </div>
                        </div>
                    </Panel>
                    <PanelResizeHandle />
                    <Panel defaultSize={25} minSize={15}>
                        <div className="h-full flex flex-col">
                            <div className="p-2 border-b border-[var(--border-color)] flex items-center gap-2">
                                <Eye size={16} className="text-[var(--text-secondary)]"/>
                                <h3 className="font-semibold text-sm">Preview</h3>
                            </div>
                            <div className="flex-grow bg-black"><PreviewPanel /></div>
                        </div>
                    </Panel>
                </PanelGroup>
            </main>
        </div>
    );
};
