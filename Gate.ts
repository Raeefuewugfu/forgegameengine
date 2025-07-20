
import { BlueprintNode } from '../../store/blueprintStore';

export const GateNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Gate',
    description: 'Controls execution flow. Can be opened, closed, or toggled to allow or block signals.',
    inputs: [
        { id: 'enter', name: 'Enter', type: 'exec' },
        { id: 'open', name: 'Open', type: 'exec' },
        { id: 'close', name: 'Close', type: 'exec' },
        { id: 'toggle', name: 'Toggle', type: 'exec' },
    ],
    outputs: [{ id: 'exit', name: 'Exit', type: 'exec' }],
    properties: {
        startClosed: true,
    }
};
