
import { BlueprintNode } from '../../store/blueprintStore';

export const OnComponentEndOverlapNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnComponentEndOverlap',
    description: 'Fires when a component of this actor stops overlapping another component.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'otherComp', name: 'Other Comp', type: 'data' },
        { id: 'otherActor', name: 'Other Actor', type: 'data' },
        { id: 'bodyIndex', name: 'Body Index', type: 'data' },
    ],
};
