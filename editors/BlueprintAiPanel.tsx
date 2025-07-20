
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Bot, CornerDownLeft, Loader2, Wand2, Sparkles, CheckCircle, MessageCircle, GitBranch, FileQuestion, ChevronDown } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { BlueprintNode, Wire, Pin, useBlueprintStore } from '../../store/blueprintStore';
import { useEditorStore, AiMode, BlueprintChatMessage } from '../../store/editorStore';

// --- TYPES ---
interface AvailableNode {
  title: string;
  inputs: Pin[];
  outputs: Pin[];
  properties?: Record<string, any>;
}


// --- Gemini Response Schemas ---
const agentNodeSchema = {
    type: Type.OBJECT,
    properties: {
        tempId: { type: Type.STRING, description: 'A unique temporary ID for this node, e.g., "node1". This is used for wiring.' },
        title: { type: Type.STRING, description: 'The title of the node to create. Must be one of the available node titles.' },
        x: { type: Type.NUMBER, description: 'The x-coordinate for the node on the canvas.' },
        y: { type: Type.NUMBER, description: 'The y-coordinate for the node on the canvas.' },
        properties: { type: Type.STRING, nullable: true, description: 'A JSON string of key-value pairs for editable properties on the node, like `{\\"inString\\":\\"Hello\\"}`. Must be a valid JSON object string. Can be null if no properties.'}
    },
    required: ['tempId', 'title', 'x', 'y']
};

const agentWireSchema = {
    type: Type.OBJECT,
    properties: {
        fromNodeTempId: { type: Type.STRING, description: 'The tempId of the node where the wire starts.' },
        fromPinId: { type: Type.STRING, description: "The ID of the output pin on the start node (e.g., 'execOut', 'deltaTime')." },
        toNodeTempId: { type: Type.STRING, description: 'The tempId of the node where the wire ends.' },
        toPinId: { type: Type.STRING, description: "The ID of the input pin on the end node (e.g., 'execIn', 'condition')." }
    },
    required: ['fromNodeTempId', 'fromPinId', 'toNodeTempId', 'toPinId']
};

const agentResponseSchema = {
    type: Type.OBJECT,
    properties: {
        reasoning: { type: Type.STRING, description: "A step-by-step explanation of the thought process to generate the blueprint. This will be streamed first."},
        summary: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A human-readable list of actions taken, e.g., ['Created Event BeginPlay node', 'Connected pin X to pin Y']."
        },
        nodes: { type: Type.ARRAY, items: agentNodeSchema, description: "List of nodes to be created." },
        wires: { type: Type.ARRAY, items: agentWireSchema, description: "List of wires to connect the nodes." },
        tokenCount: { type: Type.NUMBER, description: "The estimated number of tokens used for this generation."},
        followUpSuggestions: {
            type: Type.ARRAY,
            description: "A list of 3-4 short, actionable follow-up prompts the user might ask next to improve the game logic. These should be things the AI can accomplish in a subsequent turn.",
            items: { type: Type.STRING }
        }
    },
    required: ['reasoning', 'summary', 'nodes', 'wires', 'followUpSuggestions']
};

const askResponseSchema = {
    type: Type.OBJECT,
    properties: {
        reasoning: { type: Type.STRING, description: "A step-by-step explanation of how you arrived at the answer. This will be streamed first."},
        answer: { type: Type.STRING, description: "A detailed, helpful answer to the user's question about the blueprint. This comes after reasoning."},
        followUpSuggestions: {
            type: Type.ARRAY,
            description: "A list of 3-4 short, actionable follow-up questions the user might have.",
            items: { type: Type.STRING }
        }
    },
    required: ['reasoning', 'answer', 'followUpSuggestions']
}

const nameResponseSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: 'A short, descriptive, PascalCase name for the blueprint based on its graph.'}
    },
    required: ['name']
}

export async function generateBlueprintName(graph: { nodes: BlueprintNode[], wires: Wire[] }): Promise<string> {
    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
        const prompt = `Based on the following blueprint graph (nodes and wires), generate a short, descriptive, PascalCase name for it. For example: "PlayerJumpAndShoot", "DoorOpeningMechanism", "EnemyPatrolLogic".
        
Graph:
${JSON.stringify(graph, null, 2)}
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: nameResponseSchema
            }
        });
        const result = JSON.parse(response.text);
        return result.name || 'GeneratedBlueprint';
    } catch (e) {
        console.error("AI Naming Error:", e);
        return 'UnnamedBlueprint';
    }
}


const BLUEPRINT_KNOWLEDGE_BASE = `
### Core Actor-Events
- **Event BeginPlay**: Runs once when the actor spawns.
- **Event Tick**: Runs every frame. Has a 'DeltaSeconds' output.
- **Event EndPlay**: Runs when the actor is removed. Has a 'Reason' output.
- **Event Destroyed**: Runs when this specific actor is destroyed.
- **Event AnyDamage**: Runs on any damage. Outputs: Damage, DamageType, InstigatedBy, DamageCauser.
- **Event PointDamage**: For specific point hits. Additional outputs: HitFromDirection, HitLocation, BoneName.
- **Event RadialDamage**: For area damage. Additional outputs: Origin, Radius.

### Collision & Overlap Events
- **OnActorBeginOverlap**: When this actor's collision overlaps another. Outputs: Other Actor.
- **OnActorEndOverlap**: When an overlap ends. Outputs: Other Actor.
- **OnComponentBeginOverlap**: For component-level overlaps. Outputs: OtherComp, OtherActor, BodyIndex, SweepResult.
- **OnComponentEndOverlap**: When component overlap ends.
- **OnComponentHit**: For physical blocking collisions. Outputs: OtherComp, OtherActor, NormalImpulse, HitResult.

### Input Action & Axis Events
(These require setup in Project Settings > Input)
- **InputAction <MyAction>**: For key presses/releases. Outputs: Pressed, Released, Held exec pins.
- **InputAxis <MyAxis>**: For continuous input like movement. Outputs: an Axis Value float (-1 to 1).
- **InputTouch**: For mobile touch screens. Outputs: Pressed, Released, Moved execs, and Location, FingerIndex data.
- **InputKey**: For direct key presses without mappings. Properties: Key. Outputs: Pressed, Released.
- **InputMouseMove**: Outputs: DeltaX, DeltaY data.
- **InputControllerButton**: Gamepad buttons. Properties: ButtonName. Outputs: Pressed, Released.

### UI & Mouse Events
- **OnActorClicked**: Click on an actor in the world. Outputs: ButtonClicked.
- **OnActorMouseEnter/Leave**: Mouse cursor enters or leaves an actor's collision.
- **OnActorTouch**: Touch event on an actor.

### Widget (UMG) Events
- **OnButtonClicked (Widget)**: Click on a UI button.
- **OnSliderValueChanged (Widget)**: When a UI slider's value changes. Outputs: NewValue.
- **OnTextCommitted (Widget)**: When text is entered in a textbox. Outputs: Text, CommitMethod.
- **OnWidgetHovered/Unhovered**: Mouse cursor enters/leaves a UI widget.

### Timeline & Flow Controls
- **Timeline**: Animates values over time. Inputs: Play, Stop, Reverse etc. Outputs: Update, Finished, Track Value. Properties: Length, Loop.
- **Delay**: Pauses execution for a set duration.
- **Gate**: Controls flow, can be opened, closed, or toggled.
- **DoOnce**: Ensures a piece of logic runs only once until reset.
- **Sequence**: Executes a series of output pins in order.

### Uitleg van de Vijf Kern-Blueprint-Nodes ###

Hieronder een duidelijke uitleg van de vijf kern-Blueprint-nodes die je altijd tegenkomt, hoe ze precies werken, en welke instellingen of pins je kunt aanpassen om het gedrag te finetunen.

#### 1. Add Movement Input
*   **Wat het doet:** Stuurt een bewegingsvector naar de CharacterMovementComponent van je Pawn/Character.
*   **Parameters:**
    *   **Target:** Meestal 'Self' (de eigen Character).
    *   **World Direction:** Vector (X,Y,Z) die de richting van de beweging aangeeft. Vaak: 'Get Actor Forward Vector' of camera-forward.
    *   **Scale Value:** Hoe sterk de beweging is. Normaal tussen –1 en +1, maar je kunt hier ook sprint-multipliers op toepassen.
    *   **Force (boolean):** Als 'true' negeert hij de standaard movement-component regels en drijft hij de movement “forcibly” aan.
*   **Aanpassen:**
    *   Roteer je richting eerst op basis van 'Get Control Rotation' om camera-afhankelijke beweging te maken.
    *   Gebruik variabelen (bv. 'WalkSpeedMultiplier') om 'Scale Value' dynamisch aan te passen (sprint, slow-motion).
    *   Zet 'Force' op 'true' als je voet-physics wilt omzeilen.
    *   **Configure Input Button**: This opens a popup to configure how player input (keyboard, mouse, gamepad) is mapped to this movement action.

#### 2. Branch
*   **Wat het doet:** De klassieke “if”: kiest welk pad in je flow wordt gevolgd op basis van een boolean.
*   **Parameters:**
    *   **Condition:** Een boolean-pin: 'true' of 'false'.
    *   **True:** Uitvoeringspin als 'Condition' == 'true'.
    *   **False:** Uitvoeringspin als 'Condition' == 'false'.
*   **Aanpassen:**
    *   Bouw je 'Condition' uit met nodes als 'AND', 'OR', 'NOT' of vergelijkingen (==, <, >=).
    *   Plaats meerdere 'Branch'-nodes in serie of gebruik 'Switch on Enum' voor meer dan twee paden.
    *   Voeg een 'Gate' of 'DoOnce' toe vóór of na de 'Branch' voor meer verfijnde sturing.

#### 3. Print String
*   **Wat het doet:** Toont een tekstmelding in-game én/of in de Output Log—handig voor debug.
*   **Parameters:**
    *   **In String:** De getoonde tekst (kan statisch of via 'Append' opgebouwd zijn).
    *   **Text Color:** Kleur van de overlay-tekst.
    *   **Duration:** Hoeveel seconden de tekst zichtbaar blijft.
    *   **Print to Log:** Schrijft de tekst ook naar de console/log.
    *   **Print to Screen:** Toggle of het op het scherm mag verschijnen.
*   **Aanpassen:**
    *   Combineer met 'Append' om variabelen (Health, Position) mee te printen.
    *   Gebruik verschillende kleuren om type-meldingen (error = rood, info = groen) te onderscheiden.
    *   Zet 'Duration' op 0 om een permanente melding te krijgen tijdens je sessie.

#### 4. Event BeginPlay
*   **Wat het doet:** Wordt één keer uitgevoerd zodra je Actor/Blueprint in de wereld “playt” of gespawned wordt. Typische toepassingen: initialiseren van variabelen, HUD genereren, timers starten.
*   **Configuratie:**
    *   **DoOnce node:** Voeg toe als je wilt dat iets echt maar één keer gebeurt (zelfs bij respawns).
    *   **Delay:** Voeg een vertraging toe vóór volgende nodes, bijv. om assets te laden.
*   **Aanpassen:**
    *   Chain hier 'Create Widget' + 'Add to Viewport' voor direct je UI.
    *   Gebruik 'Get All Actors of Class' om alle relevante objecten te vinden en te initialiseren.
    *   Koppel aan 'Custom Events' voor duidelijkere structuur (bijv. InitializeGame).

#### 5. Event Tick
*   **Wat het doet:** Wordt elke frame aangeroepen, met een 'Delta Seconds'-input voor framerate-onafhankelijke logica.
*   **Parameter:**
    *   **Delta Seconds:** Tijd (in seconden) verstreken sinds de vorige Tick-call.
*   **Aanpassen:**
    *   Vermijd zware bewerkingen in Tick: gebruik liever 'Timers' of 'Timeline' voor periodieke updates.
    *   Begin altijd met een 'Branch' of 'Gate' om onnodige code te skippen als je registratie niet nodig is.
    *   Gebruik 'Delta Seconds' in je berekeningen ('NewPos = OldPos + Speed * DeltaSeconds') voor consistente beweging op alle framerates.

### In-Depth: Input Configuration for 'Add Movement Input' ###

The 'Configure Input' popup allows for detailed control over player movement.

*   **Input Type**:
    *   **Action Mapping**: For single events (jump, shoot). Maps one or more keys to a single event trigger.
    *   **Axis Mapping**: For continuous input (walking, looking). Maps keys/sticks to a -1 to +1 value range.

*   **Binding Settings**:
    *   **Key / Button**: The specific key or axis (e.g., 'W', 'Gamepad_LeftX').
    *   **Scale**: A multiplier for the axis value (e.g., -1.0 to invert).
    *   **Modifiers**: Requires Shift, Ctrl, or Alt to be held.
    *   **Dead Zone**: For analog sticks, the minimum movement before activation.
    *   **Sensitivity**: Multiplier for raw axis input.

*   **Context & Modes**:
    *   **Game-state Filtering**: Limit mappings to 'Gameplay Only', 'UI Only', of 'Always'.
    *   **Input Priority**: Which mapping wins in case of overlap.
    *   **Input Groups**: Group mappings (e.g., 'MovementGroup') to enable/disable them together.

### How Input Works in the Game ###

1.  **Engine Input Polling**: The engine reads raw hardware inputs every frame.
2.  **Mapping to Actions/Axes**: The Input Subsystem translates raw data into your configured Action and Axis mappings.
    *   **Actions** (e.g., "Jump" on Spacebar) fire an 'InputAction Jump' event in the Blueprint.
    *   **Axes** (e.g., "MoveForward" on W/S) provide a continuous float value to the 'Get Input Axis "MoveForward"' node.
3.  **Blueprint Execution**:
    *   Action events trigger the execution flow from the corresponding event node.
    *   Axis values are typically used in 'Event Tick' to feed into 'Add Movement Input'.
4.  **CharacterMovementComponent Calculation**: This component gathers all 'AddMovementInput' calls for the frame, combines them into a final vector, applies game rules (like 'Max Walk Speed', 'Acceleration'), and updates the character's velocity.
5.  **Rendering**: The renderer draws the character at its new position.
`;


// --- SUB-COMPONENTS ---
const AiModeSelector: React.FC<{
    aiMode: AiMode;
    setAiMode: (mode: AiMode) => void;
    aiContextBlueprintId: string | null;
    aiContextNodeId: string | null;
}> = ({ aiMode, setAiMode, aiContextBlueprintId, aiContextNodeId }) => {
    const { getBlueprint } = useBlueprintStore();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const modes: { key: AiMode; label: string; icon: React.ReactNode; description: string }[] = [
        { key: 'agent', label: 'Agent', icon: <Wand2 size={16} />, description: 'Generate new nodes and logic.' },
        { key: 'editor', label: 'Editor', icon: <GitBranch size={16} />, description: 'Modify or add to existing logic.' },
        { key: 'ask', label: 'Ask', icon: <MessageCircle size={16} />, description: 'Ask questions about the graph.' },
    ];
    
    const currentModeInfo = modes.find(m => m.key === aiMode);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (aiMode === 'reply') {
        const bp = aiContextBlueprintId ? getBlueprint(aiContextBlueprintId) : null;
        const blueprintName = bp?.name || 'Blueprint';
        const node = aiContextNodeId ? bp?.nodes.find(n => n.id === aiContextNodeId) : null;
        const contextText = node ? `${blueprintName} > ${node.title}` : blueprintName;

        return (
            <div className="flex items-center gap-2 text-xs bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 text-zinc-300">
                <FileQuestion size={14} className="text-cyan-400" />
                <span>Replying about: <span className="font-semibold text-white">{contextText}</span></span>
            </div>
        );
    }
    
    return (
        <div ref={wrapperRef} className="relative">
            <button
                onClick={() => setIsOpen(p => !p)}
                className="flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-sm hover:bg-zinc-700 transition-colors"
            >
                {currentModeInfo?.icon}
                <span className="font-semibold">{currentModeInfo?.label}</span>
                <ChevronDown size={16} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-lg shadow-2xl p-1 z-10 animate-scale-in">
                    {modes.map(mode => (
                        <button
                            key={mode.key}
                            onClick={() => { setAiMode(mode.key); setIsOpen(false); }}
                            className="w-full text-left p-2 rounded-md hover:bg-[var(--accent)] flex items-center gap-3"
                        >
                            {mode.icon}
                            <div>
                                <p className="font-semibold text-sm">{mode.label}</p>
                                <p className="text-xs text-[var(--text-secondary)]">{mode.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

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


// --- MAIN PANEL COMPONENT ---
export const BlueprintAiPanel: React.FC<{
    onGenerate: (data: { nodes: Omit<BlueprintNode, 'id'>[], wires: Omit<Wire, 'id'>[] }) => void;
    onClose: () => void;
    nodes: BlueprintNode[];
    wires: Wire[];
}> = ({ onGenerate, onClose, nodes, wires }) => {
    const { 
        blueprintChatHistory: messages, 
        addBlueprintChatMessage,
        aiMode, 
        aiContextBlueprintId, 
        aiContextNodeId, 
        setAiMode 
    } = useEditorStore();
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentReasoning, setCurrentReasoning] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { getBlueprint } = useBlueprintStore();
    const ALL_AVAILABLE_NODES = useBlueprintStore.getState().getAllNodeDefinitions();

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, currentReasoning]);

    useEffect(() => {
        // If the AI is in reply mode, add an initial message to guide the user.
        if (aiMode === 'reply' && messages.length === 0) {
            const bp = aiContextBlueprintId ? getBlueprint(aiContextBlueprintId) : null;
            const node = aiContextNodeId && bp ? bp.nodes.find(n => n.id === aiContextNodeId) : null;
            let initialText = `What would you like to know about the ${bp?.name || 'blueprint'}?`;
            if (node) {
                 initialText = `What would you like to know about the "${node.title}" node?`;
            }
             addBlueprintChatMessage({id: Date.now(), sender: 'ai', type: 'ask', text: initialText});
        }
    }, [aiMode, aiContextBlueprintId, aiContextNodeId, getBlueprint, messages.length, addBlueprintChatMessage]);
    
    const handleSend = useCallback(async (promptText: string) => {
        if (!promptText.trim() || isLoading) return;
        
        const userMessage: BlueprintChatMessage = { id: Date.now(), sender: 'user', text: promptText, type: aiMode === 'ask' ? 'ask' : 'agent' };
        addBlueprintChatMessage(userMessage);
        setInput('');
        setIsLoading(true);
        setCurrentReasoning('');

        const isAskMode = aiMode === 'ask' || aiMode === 'reply';
        
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

            const availableNodesString = JSON.stringify(ALL_AVAILABLE_NODES.map(({properties, ...rest}) => rest), null, 2);
            const currentGraphString = JSON.stringify({ nodes, wires }, null, 2);
            
            const contextNode = aiContextNodeId ? nodes.find(n => n.id === aiContextNodeId) : null;
            const contextName = getBlueprint(aiContextBlueprintId || '')?.name || 'the current blueprint';
            let askModeContext = `The user is asking a question about ${contextName}.`;
            if (contextNode) {
                askModeContext = `The user is asking a question about the "${contextNode.title}" node within the "${contextName}" blueprint. First, explain what this node does in general. Then, analyze its specific connections and properties in the provided graph to explain its current role in the script.`
            }


            const agentPrompt = `You are an expert Unreal Engine visual scripting assistant. Your task is to modify a blueprint graph based on the user's request.
You must respond in a streaming fashion. First, stream the 'reasoning' text. Then, after the reasoning is complete, stream the final JSON payload.

--- Core Knowledge: Blueprint Nodes ---
${BLUEPRINT_KNOWLEDGE_BASE}
---

--- Behavior Rules ---
1. Be Honest: If the user's request is vague, nonsensical, or lacks enough detail to create a meaningful blueprint (e.g., just "hello", "make something cool"), you MUST respond by explaining that you need a more specific goal. Ask for a clear goal, and wrap your response in the 'ask' schema.
2. YouTube Links: If the user provides a YouTube link, use it as context. Try to understand the logic shown or described in the video to inform your blueprint generation.
---

--- Task ---
Available Nodes (you can only use these):
${availableNodesString}

Current Blueprint Graph (existing nodes and wires):
${currentGraphString}
The current nodes are at these positions: ${JSON.stringify(nodes.map(n => ({title: n.title, x: n.x, y: n.y})))}.

User Request: "${promptText}"

Based on the user request, the current graph, and your core knowledge, generate a plan.
Arrange new nodes logically, for example, in a top-to-bottom, left-to-right flow. Do not overlap nodes or place them on top of existing nodes.
You MUST use the exact pin 'id's from the 'Available Nodes' list for wiring.

Instructions:
1.  First, provide a step-by-step "reasoning" of your plan.
2.  Then, provide the final JSON payload containing the nodes and wires to be added, a brief summary of actions, and follow-up suggestions.
The JSON payload must strictly adhere to this schema:
${JSON.stringify(agentResponseSchema)}
`;

            const askPrompt = `You are an expert Unreal Engine visual scripting assistant. 
${askModeContext}
Your task is to answer the user's question clearly and concisely using your deep knowledge of Unreal Engine Blueprints. Do not generate code or nodes.
First, stream your step-by-step reasoning on how you'll answer. Then, stream the final JSON payload with the answer.

--- Core Knowledge: Blueprint Nodes ---
${BLUEPRINT_KNOWLEDGE_BASE}
---

--- Task ---
Current Blueprint Graph:
${currentGraphString}

User Question: "${promptText}"

Based on the user's question, the current graph, and your core knowledge, formulate a helpful and detailed answer.

The JSON payload must strictly adhere to this schema:
${JSON.stringify(askResponseSchema)}
`;

            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: isAskMode ? askPrompt : agentPrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: isAskMode ? askResponseSchema : agentResponseSchema
                }
            });

            let fullText = '';
            for await (const chunk of responseStream) {
                fullText += chunk.text;
                try {
                    const partialJson = JSON.parse(fullText + '"}');
                    if (partialJson.reasoning) {
                        setCurrentReasoning(partialJson.reasoning);
                    }
                } catch (e) {}
            }
            
            const aiResponse = JSON.parse(fullText);

            if (isAskMode || (!aiResponse.nodes && aiResponse.answer)) {
                 if (!aiResponse.answer) throw new Error("AI response is missing the answer.");
                 addBlueprintChatMessage({ id: Date.now(), sender: 'ai', type: 'ask', text: aiResponse.answer, followUpSuggestions: aiResponse.followUpSuggestions });
            } else {
                 if (!aiResponse.nodes || !aiResponse.wires) throw new Error("AI response is malformed or missing required fields.");
                 const finalNodes = aiResponse.nodes.map((n: any) => {
                    const nodeType = ALL_AVAILABLE_NODES.find(an => an.title === n.title);
                    let nodeProperties = {};
                    if (n.properties && typeof n.properties === 'string') {
                        try {
                            nodeProperties = JSON.parse(n.properties || '{}');
                        } catch (e) { console.error("Failed to parse node properties JSON:", n.properties, e); }
                    }
                    return { ...nodeType, ...n, properties: { ...nodeType?.properties, ...nodeProperties } };
                });

                if (finalNodes.length > 0) {
                    onGenerate({ nodes: finalNodes, wires: aiResponse.wires });
                }
                addBlueprintChatMessage({ id: Date.now(), sender: 'ai', type: 'agent', text: 'Blueprint Updated', agentData: { summaryActions: aiResponse.summary, reasoning: aiResponse.reasoning, tokenCount: aiResponse.tokenCount }, followUpSuggestions: aiResponse.followUpSuggestions });
            }

        } catch (error) {
            console.error("Blueprint AI Error:", error);
            const errorMessage = (error as Error).message || "An unknown error occurred.";
            addBlueprintChatMessage({ id: Date.now(), sender: 'ai', type: 'ask', text: `Error: ${errorMessage}` });
        } finally {
            setIsLoading(false);
            setCurrentReasoning('');
            // Reset node-specific context after a reply
            if (aiContextNodeId) {
                useEditorStore.getState().askAiAboutBlueprint(aiContextBlueprintId as string);
            }
        }

    }, [isLoading, aiMode, aiContextBlueprintId, aiContextNodeId, ALL_AVAILABLE_NODES, onGenerate, nodes, wires, getBlueprint, addBlueprintChatMessage]);

    const handleSuggestionClick = (suggestion: string) => {
        handleSend(suggestion);
    };

    return (
        <div data-ai-panel className="w-96 h-full bg-zinc-900/50 backdrop-blur-xl border-l border-zinc-700/80 flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-zinc-700/80 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Bot size={18} className="text-fuchsia-400" />
                    <h3 className="font-semibold text-sm">Blueprint AI</h3>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)]">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-grow p-3 space-y-5 overflow-y-auto">
                {messages.map((msg) => (
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
                 {isLoading && (
                    <div className="flex items-start gap-3 animate-fade-in">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg"><Bot size={18} /></div>
                        <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-[var(--text-secondary)] animate-fade-in">
                            <div className="flex items-center gap-2 mb-2 font-semibold">
                                <Loader2 size={16} className="animate-spin" /> Reasoning...
                            </div>
                            <p className="whitespace-pre-wrap break-words text-xs text-zinc-400">{currentReasoning}</p>
                        </div>
                    </div>
                 )}
                 {messages.length > 0 && messages[messages.length-1].followUpSuggestions && (
                     <div className="flex justify-start pl-11">
                         <div className="flex flex-wrap gap-2 animate-fade-in-slide-up">
                            {messages[messages.length-1].followUpSuggestions?.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(s)}
                                    className="px-2.5 py-1 bg-zinc-700/50 text-zinc-300 text-xs rounded-full hover:bg-zinc-700 hover:text-white transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                     </div>
                 )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-zinc-700/80 flex-shrink-0 bg-zinc-900/50 space-y-2">
                <div className="relative bg-zinc-800 rounded-lg border border-zinc-700 focus-within:border-blue-500 transition-colors">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
                        placeholder={aiMode === 'ask' || aiMode === 'reply' ? 'Ask a question...' : 'e.g., make a character jump'}
                        className="w-full bg-transparent p-3 pr-14 text-sm resize-none focus:outline-none max-h-36"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleSend(input)}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zinc-400 bg-zinc-700/50 hover:bg-blue-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Send (Enter)"
                    >
                        <CornerDownLeft size={16} />
                    </button>
                </div>
                 <div className="flex">
                    <AiModeSelector 
                        aiMode={aiMode}
                        setAiMode={setAiMode}
                        aiContextBlueprintId={aiContextBlueprintId}
                        aiContextNodeId={aiContextNodeId}
                    />
                </div>
            </div>
        </div>
    );
};