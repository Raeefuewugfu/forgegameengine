
import { BlueprintNode } from '../../store/blueprintStore';

export const OnActorMouseEnterNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnActorMouseEnter',
    description: 'Fires when the mouse cursor enters this actor\'s collision shape.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
    ],
};
