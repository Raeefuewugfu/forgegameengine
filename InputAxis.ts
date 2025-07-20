
import { BlueprintNode } from '../../store/blueprintStore';

export const InputAxisNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'InputAxis',
    description: 'Provides a continuous value (-1 to 1) for a configured input axis (e.g., MoveForward, LookUp).',
    inputs: [],
    outputs: [
        { id: 'triggered', name: '', type: 'exec' },
        { id: 'axisValue', name: 'Axis Value', type: 'data' }
    ],
    properties: {
        axisName: 'MyAxis'
    }
};
