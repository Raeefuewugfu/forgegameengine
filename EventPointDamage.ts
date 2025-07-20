
import { BlueprintNode } from '../../store/blueprintStore';

export const EventPointDamageNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Event PointDamage',
    description: 'Fires for damage applied at a specific point, like a bullet hit.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'damage', name: 'Damage', type: 'data' },
        { id: 'hitFromDirection', name: 'Hit From Direction', type: 'data' },
        { id: 'hitLocation', name: 'Hit Location', type: 'data' },
        { id: 'boneName', name: 'Bone Name', type: 'data' },
        { id: 'damageType', name: 'Damage Type', type: 'data' },
        { id: 'instigatedBy', name: 'Instigated By', type: 'data' },
        { id: 'damageCauser', name: 'Damage Causer', type: 'data' },
    ],
};
