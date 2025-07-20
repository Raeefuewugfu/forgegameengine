
import { BlueprintNode } from '../../store/blueprintStore';

export const DoOnceNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'DoOnce',
    description: 'Ensures a piece of logic is executed only once, until explicitly reset.',
    inputs: [
        { id: 'execIn', name: '', type: 'exec' },
        { id: 'reset', name: 'Reset', type: 'exec' }
    ],
    outputs: [{ id: 'completed', name: 'Completed', type: 'exec' }],
};
