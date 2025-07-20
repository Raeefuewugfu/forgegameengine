
import { BlueprintNode } from '../../store/blueprintStore';

export const EventTickNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Event Tick',
    description: 'Runs every frame. Use for continuous updates. Provides time since last frame (Delta Seconds).',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'deltaTime', name: 'Delta Seconds', type: 'data' }
    ],
};
