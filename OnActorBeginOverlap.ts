
import { BlueprintNode } from '../../store/blueprintStore';

export const OnActorBeginOverlapNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnActorBeginOverlap',
    description: 'Fires when this actor starts overlapping another actor with collision enabled.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'otherActor', name: 'Other Actor', type: 'data' }
    ],
};
