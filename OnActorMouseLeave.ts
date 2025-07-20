
import { BlueprintNode } from '../../store/blueprintStore';

export const OnActorMouseLeaveNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnActorMouseLeave',
    description: 'Fires when the mouse cursor leaves this actor\'s collision shape.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
    ],
};
