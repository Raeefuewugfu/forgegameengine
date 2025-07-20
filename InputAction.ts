
import { BlueprintNode } from '../../store/blueprintStore';

export const InputActionNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'InputAction',
    description: 'Fires events for a configured input action (e.g., Jump, Fire). Requires setup in Project Settings.',
    inputs: [],
    outputs: [
        { id: 'pressed', name: 'Pressed', type: 'exec' },
        { id: 'released', name: 'Released', type: 'exec' },
        { id: 'held', name: 'Held', type: 'exec' },
        { id: 'value', name: 'Value', type: 'data' },
    ],
    properties: {
        actionName: 'MyAction'
    }
};
