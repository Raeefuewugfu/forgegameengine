
import { BlueprintNode } from '../../store/blueprintStore';

export const BranchNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Branch',
    description: 'The classic "if" statement. Executes one of two outputs based on a boolean condition.',
    inputs: [
        { id: 'execIn', name: '', type: 'exec' },
        { id: 'condition', name: 'Condition', type: 'data' }
    ],
    outputs: [
        { id: 'true', name: 'True', type: 'exec' },
        { id: 'false', name: 'False', type: 'exec' }
    ],
};
