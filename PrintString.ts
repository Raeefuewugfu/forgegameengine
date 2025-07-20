
import { BlueprintNode } from '../../store/blueprintStore';

export const PrintStringNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Print String',
    description: 'Prints a string to the screen and/or the log. Excellent for debugging.',
    inputs: [
        { id: 'execIn', name: '', type: 'exec' },
        { id: 'inString', name: 'In String', type: 'data' }
    ],
    outputs: [{ id: 'execOut', name: '', type: 'exec' }],
    properties: {
        inString: 'Hello World',
        printToScreen: true,
        printToLog: true,
        textColor: '#00DDFF',
        duration: 2.0
    }
};
