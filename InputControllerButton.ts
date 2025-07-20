
import { BlueprintNode } from '../../store/blueprintStore';

export const InputControllerButtonNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'InputControllerButton',
    description: 'Fires events for a specific gamepad button press or release.',
    inputs: [],
    outputs: [
        { id: 'pressed', name: 'Pressed', type: 'exec' },
        { id: 'released', name: 'Released', type: 'exec' },
    ],
    properties: {
        buttonName: 'Gamepad FaceButton Top'
    }
};
