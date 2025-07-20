
import { BlueprintNode } from '../../store/blueprintStore';

export const EventAnyDamageNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'Event AnyDamage',
    description: 'Fires when this actor receives any type of damage.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'damage', name: 'Damage', type: 'data' },
        { id: 'damageType', name: 'Damage Type', type: 'data' },
        { id: 'instigatedBy', name: 'Instigated By', type: 'data' },
        { id: 'damageCauser', name: 'Damage Causer', type: 'data' },
    ],
};
