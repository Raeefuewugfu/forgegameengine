
import { BlueprintNode } from '../../store/blueprintStore';

export const OnSliderValueChangedNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnSliderValueChanged (Widget)',
    description: 'Fires when the value of a UMG Slider or Combo Box widget is changed.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'newValue', name: 'New Value', type: 'data' },
    ],
};
