
import { BlueprintNode } from '../../store/blueprintStore';

export const OnActorClickedNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnActorClicked',
    description: 'Fires when this actor is clicked by the mouse in the game world.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'buttonClicked', name: 'Button Clicked', type: 'data' },
    ],
};
