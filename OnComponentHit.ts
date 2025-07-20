
import { BlueprintNode } from '../../store/blueprintStore';

export const OnComponentHitNode: Omit<BlueprintNode, 'id' | 'x' | 'y'> = {
    title: 'OnComponentHit',
    description: 'Fires when a component of this actor has a physical collision with another.',
    inputs: [],
    outputs: [
        { id: 'execOut', name: '', type: 'exec' },
        { id: 'otherComp', name: 'Other Comp', type: 'data' },
        { id: 'otherActor', name: 'Other Actor', type: 'data' },
        { id: 'normalImpulse', name: 'Normal Impulse', type: 'data' },
        { id: 'hitResult', name: 'Hit Result', type: 'data' },
    ],
};
