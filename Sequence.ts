
import { BlueprintNode } from '../../store/blueprintStore';

export const SequenceNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Sequence',
    description: 'Executes a series of outputs in order, one after the other, within the same frame.',
    inputs: [{ id: 'execIn', name: '', type: 'exec' }],
    outputs: [
        { id: 'then0', name: 'Then 0', type: 'exec' },
        { id: 'then1', name: 'Then 1', type: 'exec' },
    ],
};
