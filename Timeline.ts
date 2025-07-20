
import { BlueprintNode } from '../../store/blueprintStore';

export const TimelineNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Timeline',
    description: 'Animates values over time using curves. Ideal for movement, color changes, etc.',
    inputs: [
        { id: 'play', name: 'Play', type: 'exec' },
        { id: 'playFromStart', name: 'Play from Start', type: 'exec' },
        { id: 'stop', name: 'Stop', type: 'exec' },
        { id: 'reverse', name: 'Reverse', type: 'exec' },
        { id: 'reverseFromEnd', name: 'Reverse from End', type: 'exec' },
        { id: 'setNewTime', name: 'Set New Time', type: 'exec' },
        { id: 'newTime', name: 'New Time', type: 'data' },
    ],
    outputs: [
        { id: 'update', name: 'Update', type: 'exec' },
        { id: 'finished', name: 'Finished', type: 'exec' },
        { id: 'trackValue', name: 'Track Value', type: 'data' },
    ],
    properties: {
        length: 5.0,
        loop: false,
    }
};
