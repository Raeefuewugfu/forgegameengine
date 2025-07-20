
import { BlueprintNode } from '../../store/blueprintStore';

export const EventDestroyedNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Event Destroyed',
    description: 'Fires when this actor is explicitly destroyed.',
    inputs: [],
    outputs: [{ id: 'execOut', name: '', type: 'exec' }],
};
