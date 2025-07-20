
import { MaterialNode } from '../../store/materialStore';

export type MaterialNodeDefinition = Omit<MaterialNode, 'id' | 'x' | 'y'>;

export const MaterialOutputNode: MaterialNodeDefinition = {
    title: 'Material Output',
    inputs: [
        { id: 'baseColor', name: 'Base Color', type: 'vec3' },
        { id: 'metallic', name: 'Metallic', type: 'float' },
        { id: 'roughness', name: 'Roughness', type: 'float' },
        { id: 'normal', name: 'Normal', type: 'vec3' },
        { id: 'emissive', name: 'Emissive', type: 'vec3' },
    ],
    outputs: [],
};

export const VectorConstantNode: MaterialNodeDefinition = {
    title: 'Vector3 Constant',
    inputs: [],
    outputs: [{ id: 'out', name: '', type: 'vec3' }],
    properties: {
        value: [1.0, 1.0, 1.0],
    }
};

export const ScalarConstantNode: MaterialNodeDefinition = {
    title: 'Scalar Constant',
    inputs: [],
    outputs: [{ id: 'out', name: '', type: 'float' }],
    properties: {
        value: 0.5,
    }
};

export const TextureSampleNode: MaterialNodeDefinition = {
    title: 'Texture Sample',
    inputs: [
        { id: 'uv', name: 'UV', type: 'vec2' }
    ],
    outputs: [
        { id: 'rgb', name: 'RGB', type: 'vec3' },
        { id: 'r', name: 'R', type: 'float' },
        { id: 'g', name: 'G', type: 'float' },
        { id: 'b', name: 'B', type: 'float' },
        { id: 'a', name: 'A', type: 'float' },
    ],
    properties: {
        texturePath: null
    }
};

export const MATERIAL_NODE_DEFINITIONS: {
    category: string;
    nodes: MaterialNodeDefinition[];
}[] = [
    {
        category: 'Constants',
        nodes: [VectorConstantNode, ScalarConstantNode],
    },
    {
        category: 'Textures',
        nodes: [TextureSampleNode],
    },
];
