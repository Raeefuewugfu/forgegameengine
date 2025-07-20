
import { BlueprintNode } from '../../store/blueprintStore';

export const OnButtonClickedNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnButtonClicked (Widget)',
    description: 'Fires when a UMG Button widget is clicked.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
    ],
};
