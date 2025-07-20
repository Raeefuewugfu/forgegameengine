
import { BlueprintNode } from '../../store/blueprintStore';

export const OnActorTouchNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnActorTouch',
    description: 'Fires when this actor is touched on a mobile device.',
    inputs: [],
    outputs: [
        { id: 'pressed', name: 'Pressed', type: 'exec' },
        { id: 'released', name: 'Released', type: 'exec' },
        { id: 'fingerIndex', name: 'Finger Index', type: 'data' },
    ],
};
