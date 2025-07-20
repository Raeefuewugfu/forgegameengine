
import { BlueprintNode } from '../../store/blueprintStore';

export const EventRadialDamageNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Event RadialDamage',
    description: 'Fires for damage applied in an area, like an explosion.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'damage', name: 'Damage', type: 'data' },
        { id: 'origin', name: 'Origin', type: 'data' },
        { id: 'radius', name: 'Radius', type: 'data' },
        { id: 'damageType', name: 'Damage Type', type: 'data' },
        { id: 'instigatedBy', name: 'Instigated By', type: 'data' },
        { id: 'damageCauser', name: 'Damage Causer', type: 'data' },
    ],
};
