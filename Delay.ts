
import { BlueprintNode } from '../../store/blueprintStore';

export const DelayNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Delay',
    description: 'Pauses the execution flow for a specified number of seconds.',
    inputs: [
        { id: 'execIn', name: '', type: 'exec' },
        { id: 'duration', name: 'Duration', type: 'data' }
    ],
    outputs: [{ id: 'execOut', name: '', type: 'exec' }],
    properties: {
        duration: 1.0,
    }
};
