
import { BlueprintNode } from '../../store/blueprintStore';

export const OnComponentBeginOverlapNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnComponentBeginOverlap',
    description: 'Fires when a component of this actor starts overlapping another component.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'otherComp', name: 'Other Comp', type: 'data' },
        { id: 'otherActor', name: 'Other Actor', type: 'data' },
        { id: 'bodyIndex', name: 'Body Index', type: 'data' },
        { id: 'sweepResult', name: 'Sweep Result', type: 'data' },
    ],
};
