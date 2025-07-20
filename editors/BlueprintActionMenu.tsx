
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useBlueprintStore, BlueprintNode, Wire } from '../../store/blueprintStore';
import { Search, Info, Loader2, Wand2 } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

type NodeDefinition = Omit<BlueprintNode, 'id' | 'x' | 'y'>;

interface ActionMenuProps {
    menu: { x: number; y: number };
    onSelect: (nodeType: NodeDefinition) => void;
    onClose: () => void;
    graph: { nodes: BlueprintNode[], wires: Wire[] };
}

const suggestionSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            description: 'Array of 3 node titles that would be the most logical next steps.',
            items: { type: Type.STRING }
        }
    },
    required: ['suggestions']
};

const AiSuggestions: React.FC<{ graph: { nodes: BlueprintNode[], wires: Wire[] }, onSelect: (node: NodeDefinition) => void }> = ({ graph, onSelect }) => {
    const [suggestions, setSuggestions] = useState<NodeDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const ALL_NODES = useBlueprintStore(state => state.getAllNodeDefinitions());

    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
                const prompt = `Based on the current blueprint graph, suggest the 3 most logical nodes to add next.
                Only suggest nodes from this list: ${ALL_NODES.map(n => `"${n.title}"`).join(', ')}.
                Current graph: ${JSON.stringify(graph)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: suggestionSchema,
                    },
                });

                const result = JSON.parse(response.text);
                const suggestedNodes = result.suggestions
                    .map((title: string) => ALL_NODES.find(n => n.title === title))
                    .filter(Boolean) as NodeDefinition[];
                setSuggestions(suggestedNodes);

            } catch (error) {
                console.error("AI suggestion error:", error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [graph, ALL_NODES]);
    
    return (
        <div className="p-2">
            <h3 className="text-xs font-semibold text-zinc-400 px-2 mb-2 flex items-center gap-2"><Wand2 size={14} className="text-fuchsia-400"/> AI SUGGESTIONS</h3>
            <div className="space-y-1">
                 {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-2 py-2 rounded-md bg-zinc-800 animate-pulse">
                            <div className="w-4 h-4 bg-zinc-700 rounded"></div>
                            <div className="w-32 h-4 bg-zinc-700 rounded"></div>
                        </div>
                    ))
                ) : (
                    suggestions.map(node => (
                        <button key={node.title} onClick={() => onSelect(node)} className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors duration-150 text-zinc-200 hover:bg-[var(--accent)] hover:text-white">
                            <span className="w-4 text-zinc-500">{ALL_NODES.find(n => n.title === node.title) ? <Wand2 size={16}/> : '?'}</span>
                            <span className="flex-grow">{node.title}</span>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}


export const BlueprintActionMenu: React.FC<ActionMenuProps> = ({ menu, onSelect, onClose, graph }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [hoveredNode, setHoveredNode] = useState<NodeDefinition | null>(null);
    const NODE_DEFINITIONS = useBlueprintStore(state => state.getNodeDefinitions());

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const filteredDefs = NODE_DEFINITIONS.map(cat => ({
        ...cat,
        nodes: cat.nodes.filter(node => node.title.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(cat => cat.nodes.length > 0);

    useEffect(() => {
        if (!activeCategory && filteredDefs.length > 0) {
            setActiveCategory(filteredDefs[0].category);
        } else if (filteredDefs.length > 0 && !filteredDefs.some(c => c.category === activeCategory)) {
             setActiveCategory(filteredDefs[0].category);
        }
    }, [searchTerm, activeCategory, filteredDefs]);
    
    const handleSelect = (node: NodeDefinition) => {
        onSelect(node);
        onClose();
    };

    return ReactDOM.createPortal(
        <div 
            ref={menuRef} 
            className="fixed z-[1001] bg-zinc-900/80 backdrop-blur-md border border-[var(--border-color)] rounded-xl shadow-2xl text-sm animate-fade-in flex flex-col" 
            style={{ top: menu.y, left: menu.x, width: 600, height: 500 }}
        >
             <div className="p-2 flex-shrink-0">
                <div className="relative">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search Actions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        className="w-full bg-zinc-800 border border-[var(--border-color)] rounded-lg pl-10 pr-4 py-2.5 text-base focus:outline-none focus:border-[var(--accent)]"
                    />
                </div>
            </div>

            {searchTerm.length === 0 && <AiSuggestions graph={graph} onSelect={handleSelect}/>}
            
            <div className="h-px bg-[var(--border-color)] mx-2 flex-shrink-0"/>

            <div className="flex-grow flex overflow-hidden">
                <div className="w-1/3 border-r border-[var(--border-color)] py-2 overflow-y-auto">
                    {filteredDefs.map(({ category, icon }) => (
                         <button
                            key={category}
                            onMouseEnter={() => setActiveCategory(category)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-150 ${activeCategory === category ? 'bg-[var(--accent)] text-white' : 'text-zinc-300 hover:bg-zinc-700/50'}`}
                        >
                            <span className={`w-4 ${activeCategory !== category ? 'text-zinc-400' : ''}`}>{icon}</span>
                            <span>{category}</span>
                        </button>
                    ))}
                </div>
                <div className="w-2/3 flex flex-col">
                    <div className="flex-grow overflow-y-auto p-2">
                        {(filteredDefs.find(c => c.category === activeCategory)?.nodes ?? []).map(node => (
                            <button
                                key={node.title}
                                onClick={() => handleSelect(node)}
                                onMouseEnter={() => setHoveredNode(node)}
                                onMouseLeave={() => setHoveredNode(null)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors duration-150 text-zinc-200 hover:bg-zinc-700/50"
                            >
                                <span className="flex-grow">{node.title}</span>
                            </button>
                        ))}
                    </div>
                     <div className="flex-shrink-0 h-24 p-3 border-t border-[var(--border-color)] bg-zinc-800/50">
                        {hoveredNode && (
                            <div className="flex items-start gap-3">
                                <Info size={16} className="text-[var(--accent)] mt-0.5 flex-shrink-0"/>
                                <p className="text-xs text-zinc-400">{hoveredNode.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
