
import { BlueprintNode } from '../../store/blueprintStore';

export const OnWidgetUnhoveredNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnWidgetUnhovered',
    description: 'Fires when the mouse cursor leaves a UMG widget.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
    ],
};
