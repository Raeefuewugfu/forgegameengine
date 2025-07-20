

import { MeshData, TerrainOptions } from "../types";
import { SimplexNoise } from "./utils/noise";
import { vec3 } from 'gl-matrix';

function fbm(noise: SimplexNoise, x: number, y: number, octaves: number, lacunarity: number, persistence: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
        total += ((noise.noise2D(x * frequency, y * frequency) + 1) / 2) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return total / maxValue;
}


export class TerrainFactory {
    public static createTerrain(options: TerrainOptions): MeshData {
        const { width, depth, heightScale, noiseScale, seed, octaves, lacunarity, persistence } = options;
        const noise = new SimplexNoise(seed);

        const vertices: number[] = [];
        const normals: number[] = [];
        const indices: number[] = [];
        
        const halfWidth = width / 2;
        const halfDepth = depth / 2;
        
        const heightMap = new Float32Array((width + 1) * (depth + 1));

        for (let z = 0; z <= depth; z++) {
            for (let x = 0; x <= width; x++) {
                const nx = x / noiseScale;
                const nz = z / noiseScale;
                
                let y = fbm(noise, nx, nz, octaves, lacunarity, persistence);
                // Apply power function for sharper features. A higher exponent will create more flat lowlands and sharper cliffs.
                y = Math.pow(y, 2.2); 
                y *= heightScale;

                heightMap[z * (width + 1) + x] = y;
                vertices.push(x - halfWidth, y, z - halfDepth);
            }
        }
        
        const getHeight = (x: number, z: number) => {
            if (x < 0 || x > width || z < 0 || z > depth) return 0;
            return heightMap[z * (width + 1) + x];
        };
        
        for (let z = 0; z <= depth; z++) {
            for (let x = 0; x <= width; x++) {
                 const heightL = getHeight(x - 1, z);
                 const heightR = getHeight(x + 1, z);
                 const heightD = getHeight(x, z - 1);
                 const heightU = getHeight(x, z + 1);
                 
                 const normal = vec3.fromValues(heightL - heightR, 2.0, heightD - heightU);
                 vec3.normalize(normal, normal);
                 normals.push(normal[0], normal[1], normal[2]);
            }
        }

        for (let z = 0; z < depth; z++) {
            for (let x = 0; x < width; x++) {
                const a = x + (z * (width + 1));
                const b = a + 1;
                const c = a + (width + 1);
                const d = c + 1;
                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }

        return { vertices, colors: [], indices, normals, texCoords: [] };
    }
}