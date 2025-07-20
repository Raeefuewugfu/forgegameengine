
import { BlueprintNode } from '../../store/blueprintStore';

export const InputMouseMoveNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'InputMouseMove',
    description: 'Fires every frame the mouse is moved, providing the change in X and Y position.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'deltaX', name: 'Delta X', type: 'data' },
        { id: 'deltaY', name: 'Delta Y', type: 'data' },
    ],
};
