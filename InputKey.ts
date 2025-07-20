
import { BlueprintNode } from '../../store/blueprintStore';

export const InputKeyNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'InputKey',
    description: 'Fires events for a direct key press, without needing an action mapping.',
    inputs: [],
    outputs: [
        { id: 'pressed', name: 'Pressed', type: 'exec' },
        { id: 'released', name: 'Released', type: 'exec' },
    ],
    properties: {
        key: 'F'
    }
};
