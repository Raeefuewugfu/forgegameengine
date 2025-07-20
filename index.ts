
import React from 'react';
import { AddMovementInputNode } from './AddMovementInput';
import { BranchNode } from './Branch';
import { EventBeginPlayNode } from './EventBeginPlay';
import { EventTickNode } from './EventTick';
import { PrintStringNode } from './PrintString';
import { BlueprintNode } from '../../store/blueprintStore';
import { EventEndPlayNode } from './EventEndPlay';
import { EventDestroyedNode } from './EventDestroyed';
import { EventAnyDamageNode } from './EventAnyDamage';
import { EventPointDamageNode } from './EventPointDamage';
import { EventRadialDamageNode } from './EventRadialDamage';
import { OnActorBeginOverlapNode } from './OnActorBeginOverlap';
import { OnActorEndOverlapNode } from './OnActorEndOverlap';
import { OnComponentBeginOverlapNode } from './OnComponentBeginOverlap';
import { OnComponentEndOverlapNode } from './OnComponentEndOverlap';
import { OnComponentHitNode } from './OnComponentHit';
import { InputActionNode } from './InputAction';
import { InputAxisNode } from './InputAxis';
import { InputTouchNode } from './InputTouch';
import { InputKeyNode } from './InputKey';
import { InputMouseMoveNode } from './InputMouseMove';
import { InputControllerButtonNode } from './InputControllerButton';
import { OnActorClickedNode } from './OnActorClicked';
import { OnActorTouchNode } from './OnActorTouch';
import { OnActorMouseEnterNode } from './OnActorMouseEnter';
import { OnActorMouseLeaveNode } from './OnActorMouseLeave';
import { OnButtonClickedNode } from './OnButtonClicked';
import { OnSliderValueChangedNode } from './OnSliderValueChanged';
import { OnTextCommittedNode } from './OnTextCommitted';
import { OnWidgetHoveredNode } from './OnWidgetHovered';
import { OnWidgetUnhoveredNode } from './OnWidgetUnhovered';
import { TimelineNode } from './Timeline';
import { DelayNode } from './Delay';
import { GateNode } from './Gate';
import { DoOnceNode } from './DoOnce';
import { SequenceNode } from './Sequence';
import { Zap, AlertTriangle, ChevronsRight, Atom, Pointer, Gamepad2, Mouse, Touchpad, Tv, Droplet, Clock, GitBranch, Binary, Forward, Footprints } from 'lucide-react';

export type NodeDefinition = Omit<BlueprintNode, 'id' | 'x' | 'y'>;

export const NODE_DEFINITIONS: {
    category: string;
    icon: React.ReactNode;
    nodes: NodeDefinition[];
}[] = [
    {
        category: 'Core Actor Events',
        icon: React.createElement(Zap, { size: 16 }),
        nodes: [EventBeginPlayNode, EventTickNode, EventEndPlayNode, EventDestroyedNode],
    },
    {
        category: 'Damage Events',
        icon: React.createElement(AlertTriangle, { size: 16 }),
        nodes: [EventAnyDamageNode, EventPointDamageNode, EventRadialDamageNode],
    },
    {
        category: 'Collision Events',
        icon: React.createElement(ChevronsRight, { size: 16 }),
        nodes: [OnActorBeginOverlapNode, OnActorEndOverlapNode, OnComponentBeginOverlapNode, OnComponentEndOverlapNode, OnComponentHitNode],
    },
    {
        category: 'Input Events',
        icon: React.createElement(Gamepad2, { size: 16 }),
        nodes: [InputActionNode, InputAxisNode, InputTouchNode, InputKeyNode, InputMouseMoveNode, InputControllerButtonNode],
    },
    {
        category: 'Mouse Events',
        icon: React.createElement(Mouse, { size: 16 }),
        nodes: [OnActorClickedNode, OnActorTouchNode, OnActorMouseEnterNode, OnActorMouseLeaveNode],
    },
    {
        category: 'Widget Events',
        icon: React.createElement(Tv, { size: 16 }),
        nodes: [OnButtonClickedNode, OnSliderValueChangedNode, OnTextCommittedNode, OnWidgetHoveredNode, OnWidgetUnhoveredNode],
    },
    {
        category: 'Flow Control',
        icon: React.createElement(GitBranch, { size: 16 }),
        nodes: [BranchNode, GateNode, DoOnceNode, SequenceNode],
    },
    {
        category: 'Time',
        icon: React.createElement(Clock, { size: 16 }),
        nodes: [DelayNode, TimelineNode],
    },
    {
        category: 'Utilities',
        icon: React.createElement(Binary, { size: 16 }),
        nodes: [PrintStringNode],
    },
    {
        category: 'Pawn',
        icon: React.createElement(Footprints, { size: 16 }),
        nodes: [AddMovementInputNode],
    },
];

export const ALL_AVAILABLE_NODES: NodeDefinition[] = NODE_DEFINITIONS.flatMap(cat => cat.nodes);
