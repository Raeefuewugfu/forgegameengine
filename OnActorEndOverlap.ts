
import { BlueprintNode } from '../../store/blueprintStore';

export const OnActorEndOverlapNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnActorEndOverlap',
    description: 'Fires when this actor stops overlapping another actor.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'otherActor', name: 'Other Actor', type: 'data' }
    ],
};
