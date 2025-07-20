import { vec3, MaterialProperties } from '../../types';
import { Mesh } from '../Scene';
import { mat4 as mat4_lib, vec3 as vec3_lib } from 'gl-matrix';

type Logger = (message: string, type?: 'log' | 'warn' | 'error') => void;

// BVH node structure for the GPU
// 16 bytes for min, 4 for left/first, 16 for max, 4 for triCount = 40 bytes. Pad to 48 for alignment.
// Using 12 floats per node (48 bytes).
// vec3 min, float leftFirst, vec3 max, float triCount, vec2 padding
const SIZEOF_BVHNODE = 12 * 4; 

// Triangle structure for the GPU
// 3 * vec3 for points, 1 vec3 for normal = 48 bytes.
// vec3 p0, vec3 p1, vec3 p2, vec3 normal, uint materialIdx, 3 floats padding
const SIZEOF_TRIANGLE = 16 * 4;

// Material structure for the GPU
// vec4 color, vec4 emissive, vec4 metallic_roughness_specular_padding
const SIZEOF_MATERIAL = 12 * 4;

interface BVHNode {
    min: vec3;
    max: vec3;
    leftFirst: number; // If leaf, index of first triangle. If internal, index of left child.
    triCount: number;  // If leaf, number of triangles. If internal, 0.
}

interface Tri {
    p0: vec3;
    p1: vec3;
    p2: vec3;
    centroid: vec3;
    materialIndex: number;
}

export class BVH {
    private bvhNodes: BVHNode[] = [];
    private triIndices: number[] = [];
    private triangles: Tri[] = [];
    private logger: Logger;
    private device: GPUDevice;

    private bvhBuffer: GPUBuffer;
    private sceneVertexBuffer: GPUBuffer;
    private sceneMaterialBuffer: GPUBuffer;
    
    constructor(meshes: Mesh[], device: GPUDevice, logger: Logger) {
        this.device = device;
        this.logger = logger;
        
        this.logger("Starting BVH build...");
        this.build(meshes);
        this.logger(`BVH build complete. ${this.bvhNodes.length} nodes, ${this.triangles.length} triangles.`);
    }

    private build(meshes: Mesh[]): void {
        let materialMap = new Map<MaterialProperties, number>();
        let materials: MaterialProperties[] = [];
        
        // 1. Flatten all mesh geometry into a single list of triangles
        for (const mesh of meshes) {
            if (!mesh.renderable || mesh.meshData.indices.length === 0 || !mesh.material) continue;

            let matIndex = materialMap.get(mesh.material);
            if(matIndex === undefined) {
                matIndex = materials.length;
                materials.push(mesh.material);
                materialMap.set(mesh.material, matIndex);
            }

            const modelMatrix = mesh.transform.getModelMatrix();
            const vertices = mesh.meshData.vertices;
            const indices = mesh.meshData.indices;

            for (let i = 0; i < indices.length; i += 3) {
                const i0 = indices[i], i1 = indices[i+1], i2 = indices[i+2];
                
                const v0 = vec3_lib.transformMat4(vec3_lib.create(), [vertices[i0*3], vertices[i0*3+1], vertices[i0*3+2]], modelMatrix);
                const v1 = vec3_lib.transformMat4(vec3_lib.create(), [vertices[i1*3], vertices[i1*3+1], vertices[i1*3+2]], modelMatrix);
                const v2 = vec3_lib.transformMat4(vec3_lib.create(), [vertices[i2*3], vertices[i2*3+1], vertices[i2*3+2]], modelMatrix);

                const centroid = vec3_lib.fromValues((v0[0]+v1[0]+v2[0])/3, (v0[1]+v1[1]+v2[1])/3, (v0[2]+v1[2]+v2[2])/3);
                
                this.triangles.push({ p0: v0, p1: v1, p2: v2, centroid, materialIndex: matIndex });
            }
        }
        
        if (this.triangles.length === 0) {
            this.logger("No triangles found to build BVH.", "warn");
            this.triangles.push({ // Add a dummy triangle to prevent buffer errors
                p0: [0,0,0], p1: [0,0,0], p2: [0,0,0], centroid: [0,0,0], materialIndex: 0
            });
            materials.push({ albedoTexture: null, tint: [0.8, 0.8, 0.8], tiling: [1, 1], offset: [0, 0], emissive:[0,0,0], metallic:0, roughness:0.8 });
        }
        
        this.triIndices = Array.from({ length: this.triangles.length }, (_, i) => i);
        
        // 2. Recursively build the BVH tree
        const rootNode: BVHNode = { min: [Infinity,Infinity,Infinity], max: [-Infinity,-Infinity,-Infinity], leftFirst: 0, triCount: 0 };
        this.bvhNodes.push(rootNode);
        
        this.subdivide(0, 0, this.triangles.length);

        // 3. Create GPU buffers
        this.createGpuBuffers(materials);
    }
    
    private updateNodeBounds(nodeIndex: number, first: number, count: number): void {
        const node = this.bvhNodes[nodeIndex];
        node.min = [Infinity, Infinity, Infinity];
        node.max = [-Infinity, -Infinity, -Infinity];

        for (let i = 0; i < count; i++) {
            const tri = this.triangles[this.triIndices[first + i]];
            vec3_lib.min(node.min, node.min, tri.p0); vec3_lib.min(node.min, node.min, tri.p1); vec3_lib.min(node.min, node.min, tri.p2);
            vec3_lib.max(node.max, node.max, tri.p0); vec3_lib.max(node.max, node.max, tri.p1); vec3_lib.max(node.max, node.max, tri.p2);
        }
    }

    private subdivide(nodeIndex: number, first: number, count: number): void {
        this.updateNodeBounds(nodeIndex, first, count);
        const node = this.bvhNodes[nodeIndex];
        
        // Simple median split
        const extent = vec3_lib.subtract(vec3_lib.create(), node.max, node.min);
        let axis = 0;
        if (extent[1] > extent[axis]) axis = 1;
        if (extent[2] > extent[axis]) axis = 2;

        const splitPos = node.min[axis] + extent[axis] * 0.5;

        let i = first;
        let j = first + count - 1;
        while(i <= j) {
            if (this.triangles[this.triIndices[i]].centroid[axis] < splitPos) {
                i++;
            } else {
                [this.triIndices[i], this.triIndices[j]] = [this.triIndices[j], this.triIndices[i]];
                j--;
            }
        }
        
        let leftCount = i - first;
        if (leftCount === 0 || leftCount === count) {
            leftCount = Math.floor(count / 2);
        }
        
        // If it's a small leaf, stop
        if (count <= 4) {
            node.leftFirst = first;
            node.triCount = count;
            return;
        }

        const leftChildIdx = this.bvhNodes.length;
        this.bvhNodes.push({ min: [0,0,0], max:[0,0,0], leftFirst: 0, triCount: 0 });
        const rightChildIdx = this.bvhNodes.length;
        this.bvhNodes.push({ min: [0,0,0], max:[0,0,0], leftFirst: 0, triCount: 0 });
        
        node.leftFirst = leftChildIdx;
        node.triCount = 0;

        this.subdivide(leftChildIdx, first, leftCount);
        this.subdivide(rightChildIdx, first + leftCount, count - leftCount);
    }

    private createGpuBuffers(materials: MaterialProperties[]): void {
        // Pack BVH data
        const bvhData = new Float32Array(this.bvhNodes.length * (SIZEOF_BVHNODE / 4));
        for (let i = 0; i < this.bvhNodes.length; i++) {
            const node = this.bvhNodes[i];
            const offset = i * (SIZEOF_BVHNODE / 4);
            bvhData.set(node.min, offset);
            bvhData[offset + 3] = node.leftFirst;
            bvhData.set(node.max, offset + 4);
            bvhData[offset + 7] = node.triCount;
        }
        
        this.bvhBuffer = this.device.createBuffer({
            size: bvhData.byteLength,
            usage: GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });
        new Float32Array(this.bvhBuffer.getMappedRange()).set(bvhData);
        this.bvhBuffer.unmap();
        
        // Pack triangle data
        const triData = new Float32Array(this.triangles.length * (SIZEOF_TRIANGLE / 4));
        for (let i = 0; i < this.triangles.length; i++) {
            const triIdx = this.triIndices[i];
            const tri = this.triangles[triIdx];
            const offset = i * (SIZEOF_TRIANGLE / 4);

            const edge1 = vec3_lib.sub(vec3_lib.create(), tri.p1, tri.p0);
            const edge2 = vec3_lib.sub(vec3_lib.create(), tri.p2, tri.p0);
            const normal = vec3_lib.normalize(vec3_lib.create(), vec3_lib.cross(vec3_lib.create(), edge1, edge2));

            triData.set(tri.p0, offset); // vec4 alignment, p0 takes slot 0,1,2, pad 3
            triData.set(tri.p1, offset + 4); // p1 takes 4,5,6, pad 7
            triData.set(tri.p2, offset + 8); // p2 takes 8,9,10, pad 11
            triData.set(normal, offset + 12); // normal takes 12,13,14
            (new Uint32Array(triData.buffer))[offset + 15] = tri.materialIndex;
        }
        
        this.sceneVertexBuffer = this.device.createBuffer({
            size: triData.byteLength,
            usage: GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });
        new Float32Array(this.sceneVertexBuffer.getMappedRange()).set(triData);
        this.sceneVertexBuffer.unmap();

        // Pack material data
        const materialData = new Float32Array(materials.length * (SIZEOF_MATERIAL / 4));
        for(let i=0; i<materials.length; ++i) {
            const mat = materials[i];
            const offset = i * (SIZEOF_MATERIAL / 4);
            materialData.set([...mat.tint, 1.0], offset);
            materialData.set([...mat.emissive, 1.0], offset + 4);
            materialData.set([mat.metallic, mat.roughness, 0, 0], offset + 8);
        }

        this.sceneMaterialBuffer = this.device.createBuffer({
            size: Math.max(materialData.byteLength, SIZEOF_MATERIAL), // Min size
            usage: GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });
        new Float32Array(this.sceneMaterialBuffer.getMappedRange()).set(materialData);
        this.sceneMaterialBuffer.unmap();
    }

    public getBuffers(): { bvhBuffer: GPUBuffer, sceneVertexBuffer: GPUBuffer, sceneMaterialBuffer: GPUBuffer } {
        return { 
            bvhBuffer: this.bvhBuffer, 
            sceneVertexBuffer: this.sceneVertexBuffer,
            sceneMaterialBuffer: this.sceneMaterialBuffer,
        };
    }

    public getTriangleCount(): number {
        return this.triangles.length;
    }
    
    public destroy(): void {
        this.bvhBuffer?.destroy();
        this.sceneVertexBuffer?.destroy();
        this.sceneMaterialBuffer?.destroy();
    }
}