
import { BlueprintNode } from '../../store/blueprintStore';

export const OnTextCommittedNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnTextCommitted (Widget)',
    description: 'Fires when text is submitted in a UMG TextEdit widget (e.g., by pressing Enter).',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'text', name: 'Text', type: 'data' },
        { id: 'commitMethod', name: 'Commit Method', type: 'data' },
    ],
};
