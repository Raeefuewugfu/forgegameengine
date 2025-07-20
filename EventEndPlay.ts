
import { BlueprintNode } from '../../store/blueprintStore';

export const EventEndPlayNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Event EndPlay',
    description: 'Runs when the actor is removed from the world (e.g., level change, destroyed).',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'reason', name: 'Reason', type: 'data' }
    ],
};
