
import { BlueprintNode, InputConfiguration } from '../../store/blueprintStore';

export const AddMovementInputNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Add Movement Input',
    description: 'Adds movement input to a Pawn or Character in a specific world direction.',
    inputs: [
        { id: 'execIn', name: '', type: 'exec' },
        { id: 'worldDirection', name: 'World Direction', type: 'data' },
        { id: 'scaleValue', name: 'Scale Value', type: 'data' }
    ],
    outputs: [{ id: 'execOut', name: '', type: 'exec' }],
    properties: { 
        scaleValue: 1.0, 
        force: false,
        inputConfiguration: {
            mappingType: 'Axis',
            mappingName: 'MoveForward',
            bindings: [
                { id: 'bind1', key: 'W', scale: 1.0, device: 'Keyboard' },
                { id: 'bind2', key: 'S', scale: -1.0, device: 'Keyboard' },
                { id: 'bind3', key: 'Gamepad Left Y', scale: 1.0, device: 'Gamepad' },
            ],
            deadZone: 0.1,
            sensitivity: 1.0,
            context: 'GameplayOnly',
            inputGroup: 'MovementGroup',
            priority: 0,
        } as InputConfiguration
    }
};
