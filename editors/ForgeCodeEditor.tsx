import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, Save, File, Plus, Trash2, Edit, Code2, BookOpen, Bot, CornerDownLeft, Loader2, Wand2, Sparkles, CheckCircle } from 'lucide-react';
import { useScriptStore, ForgeScript } from '../../store/scriptStore';
import { GoogleGenAI } from "@google/genai";

const FORGE_SCRIPT_API_REFERENCE = `
### Core
- \`log(message: string)\`: Prints a message to the console.

### Entity ('self')
- \`self.getComponent(name: string): Component\`: Retrieves a component attached to the entity.
- \`self.name: string\`: The name of the entity.

### Input
- \`Input.isKeyDown(key: string): boolean\`: Returns true if the key is currently held down.
- \`Input.isKeyPressed(key: string): boolean\`: Returns true for the single frame the key is first pressed.
- \`Input.isKeyReleased(key: string): boolean\`: Returns true for the single frame the key is released.

### Time
- \`Time.deltaTime: float\`: The time in seconds since the last frame. Useful for framerate-independent movement.

### Physics
- \`physicsComponent.applyForce(force: Vector3)\`: Applies a continuous force.
- \`physicsComponent.applyImpulse(impulse: Vector3)\`: Applies an instantaneous force (like a jump or explosion).
- \`physicsComponent.velocity: Vector3\`: Read or write the object's velocity.

### Transform
- \`transform.position: Vector3\`: The world position of the entity.
- \`transform.rotation: Vector3\`: The Euler rotation of the entity.
- \`transform.scale: Vector3\`: The scale of the entity.

### Data Types
- \`Vector3(x, y, z)\`
- \`float\`, \`int\`, \`string\`, \`boolean\`
`;

const ForgeCodeLoadingScreen = () => (
    <div className="w-screen h-screen bg-zinc-900 flex flex-col items-center justify-center text-white/80 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
            <Code2 size={64} className="text-[var(--accent)] animate-pulse" />
            <h1 className="text-3xl font-bold tracking-wider">SCRIPTFORGE</h1>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Loader2 size={16} className="animate-spin" />
                <p>Compiling environment...</p>
            </div>
        </div>
    </div>
);

const ApiReferencePanel = () => {
    return (
        <div className="flex-grow overflow-y-auto p-4 text-xs font-mono space-y-4 text-[var(--text-secondary)]">
            {FORGE_SCRIPT_API_REFERENCE.trim().split('###').map((section, i) => {
                if (!section.trim()) return null;
                const lines = section.trim().split('\n');
                const title = lines.shift();
                return (
                    <div key={i}>
                        <h4 className="font-bold text-sm text-[var(--accent)] mb-2">{title}</h4>
                        <div className="space-y-1">
                            {lines.map((line, j) => (
                                <p key={j} className="hover:text-white transition-colors">{line}</p>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}

const AiHelperPanel: React.FC<{
    onInsertCode: (code: string) => void;
    currentScriptContent: string;
}> = ({ onInsertCode, currentScriptContent }) => {
    const [messages, setMessages] = useState<{sender: 'ai'|'user', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userPrompt = input;
        setMessages(prev => [...prev, { sender: 'user', text: userPrompt }]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `You are an expert ForgeScript assistant. Your task is to write clean, efficient ForgeScript code based on the user's request.
            Your response MUST be ONLY the generated code block. Do not add any explanation, conversation, or markdown formatting.
            ---
            ForgeScript API Reference:
            ${FORGE_SCRIPT_API_REFERENCE}
            ---
            User's Current Script:
            \`\`\`fsharp
            ${currentScriptContent}
            \`\`\`
            ---
            User's Request: "${userPrompt}"
            `;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const code = response.text.replace(/```(fsharp|javascript|typescript|)\n?([\s\S]+)```/, '$2').trim();
            setMessages(prev => [...prev, { sender: 'ai', text: code }]);
        } catch (error) {
            const errorMessage = (error as Error).message || "An unknown error occurred.";
            setMessages(prev => [...prev, { sender: 'ai', text: `// Error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div className="flex-grow flex flex-col h-full">
            <div ref={messagesEndRef} className="flex-grow p-3 space-y-4 overflow-y-auto">
                 {messages.length === 0 && !isLoading && (
                    <div className="text-center text-xs text-[var(--text-secondary)] p-4">
                        <Sparkles size={24} className="mx-auto mb-2 text-[var(--accent)]" />
                        Ask me to write or modify code for you.
                        <br/>e.g., "Make the player jump" or "add a variable to track score".
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <div className="w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-1"><Bot size={14}/></div>}
                        <div className={`p-3 rounded-lg text-sm max-w-full ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[var(--bg-deep-dark)] border border-[var(--border-color)]'}`}>
                           {msg.sender === 'ai' ? (
                                <pre className="font-mono text-xs whitespace-pre-wrap break-words">{msg.text}</pre>
                           ) : <p>{msg.text}</p>}
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-1 animate-pulse"><Bot size={14}/></div>
                        <div className="p-3 rounded-lg bg-[var(--bg-deep-dark)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)]">
                            <Loader2 size={16} className="animate-spin"/>
                        </div>
                    </div>
                 )}
            </div>
            <div className="p-2 border-t border-[var(--border-color)]">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Describe the code you need..."
                        className="w-full bg-[var(--bg-deep-dark)] border border-[var(--border-color)] rounded-md p-2 pr-10 resize-none text-sm focus:outline-none focus:border-[var(--accent)]"
                        rows={2}
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={!input.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><CornerDownLeft size={16}/></button>
                </div>
            </div>
        </div>
    );
};

const highlightCode = (code: string) => {
    const keywords = '\\b(func|var|if|else|for|while|return|log)\\b';
    const types = '\\b(float|int|string|boolean|Vector3)\\b';
    const builtins = '\\b(Input|Time|self)\\b';
    const comments = /(\/\/.*$)/;
    const strings = /(".*?")/;
    const numbers = /\b\d+(\.\d+)?\b/;
    const punctuation = /([,;=+\-*\/(){}\[\]])/;

    let highlighted = code;

    const replacer = (regex: string | RegExp, className: string) => {
        highlighted = highlighted.replace(new RegExp(regex, 'gm'), (match) => `<span class="${className}">${match}</span>`);
    };
    
    highlighted = highlighted.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Order matters
    replacer(comments, 'token-comment');
    replacer(strings, 'token-string');
    replacer(keywords, 'token-keyword');
    replacer(types, 'token-type');
    replacer(builtins, 'token-function');
    replacer(numbers, 'token-number');
    replacer(punctuation, 'token-punctuation');

    return highlighted.replace(/\n/g, '<br/>');
};

const AdvancedCodeEditor = ({ content, onContentChange, readOnly }: {
    content: string,
    onContentChange: (newContent: string) => void,
    readOnly: boolean
}) => {
    const lineCounterRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLPreElement>(null);

    const syncScroll = () => {
        if (lineCounterRef.current && textareaRef.current && highlightRef.current) {
            lineCounterRef.current.scrollTop = textareaRef.current.scrollTop;
            highlightRef.current.scrollTop = textareaRef.current.scrollTop;
            highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };
    
    const highlightedContent = useMemo(() => highlightCode(content + '\n'), [content]);

    return (
        <div className="flex-grow flex h-full bg-[#1e1e1e] relative">
            <div ref={lineCounterRef} className="text-right text-sm text-gray-500 p-3 font-mono select-none overflow-hidden bg-[#1e1e1e] flex-shrink-0" style={{ lineHeight: '1.5rem' }}>
                {content.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <div className="flex-grow relative">
                 <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => onContentChange(e.target.value)}
                    onScroll={syncScroll}
                    readOnly={readOnly}
                    className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white font-mono text-sm p-3 resize-none focus:outline-none z-10"
                    style={{ lineHeight: '1.5rem', whiteSpace: 'pre', overflowWrap: 'normal' }}
                    spellCheck="false"
                />
                 <pre
                    ref={highlightRef}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full text-white font-mono text-sm p-3 pointer-events-none"
                    style={{ lineHeight: '1.5rem', whiteSpace: 'pre', overflowWrap: 'normal' }}
                    dangerouslySetInnerHTML={{ __html: highlightedContent }}
                />
            </div>
        </div>
    );
};


export const ForgeCodeEditor: React.FC<{ onExit: () => void, scriptId: string | null }> = ({ onExit, scriptId }) => {
    const { scripts, getScript, createScript, updateScript, deleteScript, renameScript } = useScriptStore();
    const [activeScriptId, setActiveScriptId] = useState<string | null>(scriptId);
    const [editorContent, setEditorContent] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeToolTab, setActiveToolTab] = useState<'api' | 'ai'>('api');

    const activeScript = useMemo(() => activeScriptId ? getScript(activeScriptId) : null, [activeScriptId, getScript]);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (activeScriptId) {
            const script = getScript(activeScriptId);
            if (script) {
                setEditorContent(script.content);
                setIsDirty(false);
            }
        } else {
            setEditorContent('');
        }
    }, [activeScriptId, getScript, scripts]);

    const handleSave = () => {
        if (activeScript && isDirty) {
            updateScript(activeScript.id, activeScript.name, editorContent);
            setIsDirty(false);
        }
    };
    
    const handleContentChange = (content: string) => {
        setEditorContent(content);
        if (!isDirty) setIsDirty(true);
    };
    
    const insertCodeAtCursor = (code: string) => {
        // This is a simplified insertion. A real implementation would be more robust.
        setEditorContent(prev => prev + '\n' + code);
        setIsDirty(true);
    };

    if (isLoading) {
        return <ForgeCodeLoadingScreen />;
    }

    return (
        <div className="w-screen h-screen bg-zinc-900 flex flex-col text-[var(--text-primary)]">
            <header className="h-12 bg-[var(--bg-dark)] border-b border-[var(--border-color)] flex items-center justify-between px-4 flex-shrink-0 z-20">
                <button onClick={onExit} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors">
                    <ChevronLeft size={18} />
                    <span>Editor</span>
                </button>
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Code2 size={16} className="text-[var(--accent)]"/>
                    {activeScript?.name} {isDirty && <span className="text-yellow-400 ml-1">*</span>}
                </div>
                <button
                    onClick={handleSave}
                    disabled={!isDirty || !activeScript}
                    className="flex items-center gap-2 px-4 py-1.5 bg-[var(--accent)] text-white rounded-md font-semibold text-sm transition-all transform hover:scale-105 disabled:opacity-50 disabled:bg-[var(--accent-hover)] disabled:cursor-not-allowed"
                >
                    <Save size={16} />
                    <span>Save Script</span>
                </button>
            </header>

            <div className="flex-grow flex flex-row overflow-hidden">
                {/* File Explorer */}
                <div className="w-64 h-full bg-[var(--bg-panel)] border-r border-[var(--border-color)] flex flex-col flex-shrink-0">
                    <div className="flex items-center justify-between p-2.5 border-b border-[var(--border-color)]">
                        <h3 className="font-semibold text-sm">Scripts</h3>
                        <button onClick={() => createScript()} className="p-1 rounded-md text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors" title="New Script">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {scripts.map(s => (
                            <div key={s.id} className={`group flex items-center gap-2 pl-3 pr-2 py-2 cursor-pointer border-l-2 ${activeScriptId === s.id ? 'bg-[var(--accent)]/20 border-[var(--accent)]' : 'border-transparent hover:bg-white/5'}`} onClick={() => setActiveScriptId(s.id)}>
                                <File size={16} className="text-gray-400 flex-shrink-0" />
                                {renamingId === s.id ? (
                                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} onBlur={() => { renameScript(s.id, newName); setRenamingId(null);}} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} autoFocus className="bg-black/50 border border-[var(--accent)] rounded-sm px-1 flex-grow text-sm w-full" />
                                ) : (
                                    <span className="flex-grow truncate text-sm">{s.name}</span>
                                )}
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                    <button onClick={(e) => { e.stopPropagation(); setRenamingId(s.id); setNewName(s.name); }} className="p-1 rounded text-[var(--text-secondary)] hover:text-white"><Edit size={14}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); if(confirm(`Delete ${s.name}?`)) deleteScript(s.id); }} className="p-1 rounded text-[var(--text-secondary)] hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Pane */}
                <div className="flex-grow flex flex-col min-w-0">
                    {activeScriptId ? (
                         <AdvancedCodeEditor content={editorContent} onContentChange={handleContentChange} readOnly={!activeScriptId} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-center text-[var(--text-secondary)]">
                            <p>Select a script to start editing<br/>or create a new one.</p>
                        </div>
                    )}
                </div>

                {/* Tools Panel */}
                <div className="w-96 h-full bg-[var(--bg-panel)] border-l border-[var(--border-color)] flex flex-col flex-shrink-0">
                    <div className="p-2 border-b border-[var(--border-color)]">
                         <div className="flex items-center bg-[var(--bg-dark)] p-1 rounded-lg">
                             <button onClick={() => setActiveToolTab('api')} className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-1.5 rounded-md transition-colors ${activeToolTab === 'api' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-white/10'}`}>
                                 <BookOpen size={14}/> API Reference
                             </button>
                             <button onClick={() => setActiveToolTab('ai')} className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-1.5 rounded-md transition-colors ${activeToolTab === 'ai' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-white/10'}`}>
                                 <Bot size={14}/> AI Helper
                             </button>
                         </div>
                    </div>
                    {activeToolTab === 'api' && <ApiReferencePanel />}
                    {activeToolTab === 'ai' && <AiHelperPanel onInsertCode={insertCodeAtCursor} currentScriptContent={editorContent}/>}
                </div>
            </div>
        </div>
    );
};