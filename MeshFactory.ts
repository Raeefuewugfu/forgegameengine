
import { MeshData } from "../types";

export class MeshFactory {
    public static createGrid(size: number = 10, divisions: number = 10): MeshData {
        const vertices: number[] = [];
        const colors: number[] = [];
        const step = size / divisions;
        const halfSize = size / 2;
        const color = [0.3, 0.3, 0.3, 1.0];

        for (let i = 0; i <= divisions; i++) {
            const pos = -halfSize + i * step;
            
            // Vertical lines
            vertices.push(pos, 0, -halfSize, pos, 0, halfSize);
            colors.push(...color, ...color);

            // Horizontal lines
            vertices.push(-halfSize, 0, pos, halfSize, 0, pos);
            colors.push(...color, ...color);
        }

        return { vertices, colors, indices: [] };
    }

    public static createPlane(width: number, depth: number, widthSegments: number, depthSegments: number): MeshData {
        const vertices: number[] = [];
        const colors: number[] = [];
        const indices: number[] = [];
        const texCoords: number[] = [];
        const normals: number[] = [];
        const halfWidth = width / 2;
        const halfDepth = depth / 2;

        for (let z = 0; z <= depthSegments; z++) {
            for (let x = 0; x <= widthSegments; x++) {
                const u = x / widthSegments;
                const v = z / depthSegments;
                vertices.push(u * width - halfWidth, 0, v * depth - halfDepth);
                colors.push(1, 1, 1, 1);
                texCoords.push(u, v);
                normals.push(0, 1, 0);
            }
        }
        for (let z = 0; z < depthSegments; z++) {
            for (let x = 0; x < widthSegments; x++) {
                const a = x + (z * (widthSegments + 1));
                const b = a + 1;
                const c = a + (widthSegments + 1);
                const d = c + 1;
                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }
        return { vertices, colors, indices, texCoords, normals };
    }

    public static createCube(): MeshData {
        const vertices = [
            // Front face
            -0.5, -0.5,  0.5,
             0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5,  0.5,  0.5,

            // Back face
            -0.5, -0.5, -0.5,
            -0.5,  0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5, -0.5, -0.5,

            // Top face
            -0.5,  0.5, -0.5,
            -0.5,  0.5,  0.5,
             0.5,  0.5,  0.5,
             0.5,  0.5, -0.5,

            // Bottom face
            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5, -0.5,  0.5,
            -0.5, -0.5,  0.5,

            // Right face
             0.5, -0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5,  0.5,  0.5,
             0.5, -0.5,  0.5,

            // Left face
            -0.5, -0.5, -0.5,
            -0.5, -0.5,  0.5,
            -0.5,  0.5,  0.5,
            -0.5,  0.5, -0.5,
        ];

        const texCoords = [
            // Front
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Back
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Top
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Bottom
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Right
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Left
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
        ];

        const indices = [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23,   // left
        ];
        
        const normals = [
            // Front face
            0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
            // Back face
            0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
            // Top face
            0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
            // Bottom face
            0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
            // Right face
            1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
            // Left face
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
        ];

        // A default color array in case materials are not used
        const colors = new Array(24 * 4).fill(1.0);

        return { vertices, colors, indices, texCoords, normals };
    }
}
