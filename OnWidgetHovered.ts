
import { BlueprintNode } from '../../store/blueprintStore';

export const OnWidgetHoveredNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnWidgetHovered',
    description: 'Fires when the mouse cursor enters a UMG widget.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
    ],
};
