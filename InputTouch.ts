
import { BlueprintNode } from '../../store/blueprintStore';

export const InputTouchNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'InputTouch',
    description: 'Handles touch events for mobile screens, providing location and finger index.',
    inputs: [],
    outputs: [
        { id: 'pressed', name: 'Pressed', type: 'exec' },
        { id: 'released', name: 'Released', type: 'exec' },
        { id: 'moved', name: 'Moved', type: 'exec' },
        { id: 'location', name: 'Location', type: 'data' },
        { id: 'fingerIndex', name: 'Finger Index', type: 'data' },
    ],
};
