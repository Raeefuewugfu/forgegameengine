
import { BlueprintNode } from '../../store/blueprintStore';

export const EventBeginPlayNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Event BeginPlay',
    description: 'Runs once when this actor is spawned into the world.',
    inputs: [],
    outputs: [{ id: 'execOut', name: '', type: 'exec' }],
};
