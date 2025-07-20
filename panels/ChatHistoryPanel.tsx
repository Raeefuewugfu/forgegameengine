
import React, { useEffect, useRef } from 'react';
import { useEditorStore, BlueprintChatMessage } from '../../store/editorStore';
import { Bot, Sparkles, CheckCircle, Trash2 } from 'lucide-react';

const AiAgentResponseCard: React.FC<{ message: BlueprintChatMessage }> = ({ message }) => (
    <div className="bg-gradient-to-br from-zinc-800 to-zinc-800/80 text-[var(--text-primary)] rounded-lg rounded-bl-none p-4 max-w-[90%] border border-zinc-700 shadow-xl animate-fade-in-slide-up">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Sparkles size={16} className="text-fuchsia-400"/> Blueprint Updated</h4>
        {message.agentData?.summaryActions && (
            <div className="border-t border-zinc-700 pt-3 mt-3">
                <h5 className="text-xs font-semibold text-zinc-400 mb-2">Summary of Actions</h5>
                <ul className="space-y-1.5">
                    {message.agentData.summaryActions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                            <CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{action}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);

const AiAskResponseCard: React.FC<{ message: BlueprintChatMessage }> = ({ message }) => (
     <div className="bg-gradient-to-br from-zinc-800 to-zinc-800/80 text-[var(--text-primary)] rounded-lg rounded-bl-none p-4 max-w-[90%] border border-zinc-700 shadow-xl animate-fade-in-slide-up">
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
    </div>
);

export const ChatHistoryPanel: React.FC = () => {
    const { blueprintChatHistory, clearBlueprintChatHistory } = useEditorStore(state => ({
        blueprintChatHistory: state.blueprintChatHistory,
        clearBlueprintChatHistory: state.clearBlueprintChatHistory,
    }));
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [blueprintChatHistory]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow p-3 space-y-5 overflow-y-auto">
                {blueprintChatHistory.length === 0 && (
                    <div className="h-full flex items-center justify-center text-center text-[var(--text-secondary)] text-sm">
                        <p>Your Blueprint AI chat history will appear here.</p>
                    </div>
                )}
                {blueprintChatHistory.map((msg) => (
                     <div key={msg.id} className={`flex gap-3 items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg"><Bot size={18} /></div>}
                        
                        {msg.sender === 'ai' && msg.type === 'agent' && <AiAgentResponseCard message={msg} />}
                        {msg.sender === 'ai' && msg.type === 'ask' && <AiAskResponseCard message={msg} />}

                        {msg.sender === 'user' && (
                             <div className={`p-3 rounded-lg text-sm max-w-[90%] ${'bg-blue-600 text-white rounded-br-none shadow-md animate-fade-in-slide-up'}`}>
                               <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            </div>
                        )}
                        {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0"></div>}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-1 border-t border-[var(--border-color)] flex justify-end">
                <button
                    onClick={clearBlueprintChatHistory}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"
                >
                    <Trash2 size={14} /> Clear History
                </button>
            </div>
        </div>
    );
};
