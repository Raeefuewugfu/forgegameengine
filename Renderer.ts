




import { Camera } from './Camera';
import { Scene, Mesh } from './Scene';
import { vertexShaderSource } from '../shaders/vertexShader';
import { fragmentShaderSource } from '../shaders/fragmentShader';
import { ShaderProgramInfo, Buffers, MeshData, vec3, LiquidComponent, vec4 } from '../types';
import { AssetManager } from './AssetManager';
import { mat4 as mat4_lib, vec3 as vec3_lib, quat as quat_lib, vec4 as vec4_lib } from 'gl-matrix';
import { TransformTool } from '../store/editorStore';
import { Particle } from './Core';

const particleVertexSource = `
    attribute vec4 a_position; // Vertex position in world space
    attribute vec4 a_color;
    attribute vec2 a_texCoord;

    uniform mat4 u_view;
    uniform mat4 u_projection;
    
    varying vec4 v_color;
    varying vec2 v_texCoord;

    void main() {
        gl_Position = u_projection * u_view * a_position;
        v_color = a_color;
        v_texCoord = a_texCoord;
    }
`;

const particleFragmentSource = `
    precision highp float;

    uniform sampler2D u_texture;

    varying vec4 v_color;
    varying vec2 v_texCoord;

    void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord) * v_color;
    }
`;


type Logger = (message: string, type?: 'log' | 'warn' | 'error') => void;

function isPowerOf2(value: number) {
    return (value & (value - 1)) === 0;
}

interface GizmoPart {
    data: MeshData;
    buffers: Buffers;
    color: vec3;
    hoverColor: vec3;
    type?: 'line' | 'cone' | 'ring' | 'cube' | 'quad';
}

interface TranslateGizmoDragState {
    axis: 'x' | 'y' | 'z';
    object: Mesh;
    startPosition: vec3;
    planeNormal: vec3;
    planePoint: vec3;
}

interface RotateGizmoDragState {
    axis: 'x' | 'y' | 'z';
    object: Mesh;
    startDragVec: vec3;
    planeNormal: vec3;
    planePoint: vec3;
    startRotation: vec3;
}

interface ScaleGizmoDragState {
    axis: 'x' | 'y' | 'z' | 'xyz';
    object: Mesh;
    startScale: vec3;
    startMouse: { x: number, y: number };
}

interface ParticleShaderProgramInfo {
    program: WebGLProgram;
    attribLocations: {
        position: number;
        color: number;
        texCoord: number;
    };
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation | null;
        viewMatrix: WebGLUniformLocation | null;
        texture: WebGLUniformLocation | null;
    };
}

export type WaterGlobalUniforms = LiquidComponent & {
    isUnderwater: boolean;
    waterHeight: number;
};
const MAX_PARTICLES_RENDER = 5000;


export class Renderer {
    private gl: WebGLRenderingContext;
    private shaderProgramInfo: ShaderProgramInfo;
    private logger: Logger;
    private assetManager: AssetManager;
    private textureCache: Map<string, WebGLTexture> = new Map();
    private debugLineBuffers: { position: WebGLBuffer, color: WebGLBuffer } | null = null;
    private cameraGizmoBuffers: Buffers | null = null;
    
    // Particle rendering state
    private particleShaderProgramInfo: ParticleShaderProgramInfo;
    private particleVBO: WebGLBuffer;
    private particleVBOData: Float32Array;

    // Gizmo state
    private translateGizmoParts: { [axis: string]: GizmoPart } = {};
    private rotateGizmoParts: { [axis: string]: GizmoPart } = {};
    private scaleGizmoParts: { [axis: string]: GizmoPart } = {};
    private gizmoActiveAxis: string | null = null;
    public isGizmoDragging = false;
    private translateGizmoDragState: TranslateGizmoDragState | null = null;
    private rotateGizmoDragState: RotateGizmoDragState | null = null;
    private scaleGizmoDragState: ScaleGizmoDragState | null = null;

    constructor(gl: WebGLRenderingContext, logger: Logger, assetManager: AssetManager) {
        this.gl = gl;
        this.logger = logger;
        this.assetManager = assetManager;
        this.shaderProgramInfo = this.initShaderProgram(vertexShaderSource, fragmentShaderSource);
        this.particleShaderProgramInfo = this.initParticleShaderProgram();
        
        // VBO for up to MAX_PARTICLES, each is a quad (6 vertices), each vertex has (pos3 + color4 + uv2 = 9 floats)
        this.particleVBOData = new Float32Array(MAX_PARTICLES_RENDER * 6 * (3 + 4 + 2)); 
        this.particleVBO = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBO);
        gl.bufferData(gl.ARRAY_BUFFER, this.particleVBOData.byteLength, gl.DYNAMIC_DRAW);

        this.createTranslateGizmoGeometry();
        this.createRotateGizmoGeometry();
        this.createScaleGizmoGeometry();
    }

    private initParticleShaderProgram(): ParticleShaderProgramInfo {
        const program = this.createShaderProgram(particleVertexSource, particleFragmentSource, 'Particle');
        return {
            program,
            attribLocations: {
                position: this.gl.getAttribLocation(program, 'a_position'),
                color: this.gl.getAttribLocation(program, 'a_color'),
                texCoord: this.gl.getAttribLocation(program, 'a_texCoord'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(program, 'u_projection'),
                viewMatrix: this.gl.getUniformLocation(program, 'u_view'),
                texture: this.gl.getUniformLocation(program, 'u_texture'),
            }
        }
    }

    private createShaderProgram(vsSource: string, fsSource: string, name: string): WebGLProgram {
        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);
        const shaderProgram = this.gl.createProgram();
        if (!shaderProgram) throw new Error(`Failed to create ${name} shader program`);

        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            const errorMsg = `Unable to initialize ${name} shader program: ` + this.gl.getProgramInfoLog(shaderProgram);
            this.logger(errorMsg, 'error');
            throw new Error(errorMsg);
        }
        return shaderProgram;
    }

    private initShaderProgram(vsSource: string, fsSource: string): ShaderProgramInfo {
        const shaderProgram = this.createShaderProgram(vsSource, fsSource, 'Main');
        return {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(shaderProgram, 'a_position'),
                vertexColor: this.gl.getAttribLocation(shaderProgram, 'a_color'),
                texCoord: this.gl.getAttribLocation(shaderProgram, 'a_texCoord'),
                vertexNormal: this.gl.getAttribLocation(shaderProgram, 'a_normal'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'u_projection'),
                viewMatrix: this.gl.getUniformLocation(shaderProgram, 'u_view'),
                modelMatrix: this.gl.getUniformLocation(shaderProgram, 'u_model'),
                useTexture: this.gl.getUniformLocation(shaderProgram, 'u_useTexture'),
                albedoTexture: this.gl.getUniformLocation(shaderProgram, 'u_albedoTexture'),
                tint: this.gl.getUniformLocation(shaderProgram, 'u_tint'),
                emissive: this.gl.getUniformLocation(shaderProgram, 'u_emissive'),
                fallbackColor: this.gl.getUniformLocation(shaderProgram, 'u_fallbackColor'),
                tiling: this.gl.getUniformLocation(shaderProgram, 'u_tiling'),
                offset: this.gl.getUniformLocation(shaderProgram, 'u_offset'),
                time: this.gl.getUniformLocation(shaderProgram, 'u_time'),
                cameraPos: this.gl.getUniformLocation(shaderProgram, 'u_cameraPos'),
                lightPos: this.gl.getUniformLocation(shaderProgram, 'u_lightPos'),
                lightColor: this.gl.getUniformLocation(shaderProgram, 'u_lightColor'),

                isLiquid: this.gl.getUniformLocation(shaderProgram, 'u_isLiquid'),
                liquidBaseColor: this.gl.getUniformLocation(shaderProgram, 'u_liquidBaseColor'),
                liquidDeepColor: this.gl.getUniformLocation(shaderProgram, 'u_liquidDeepColor'),
                liquidDepthDistance: this.gl.getUniformLocation(shaderProgram, 'u_liquidDepthDistance'),
                liquidSpecularColor: this.gl.getUniformLocation(shaderProgram, 'u_liquidSpecularColor'),
                liquidShininess: this.gl.getUniformLocation(shaderProgram, 'u_liquidShininess'),
                liquidSssColor: this.gl.getUniformLocation(shaderProgram, 'u_liquidSssColor'),
                liquidSssPower: this.gl.getUniformLocation(shaderProgram, 'u_liquidSssPower'),
                foamColor: this.gl.getUniformLocation(shaderProgram, 'u_foamColor'),
                foamCrestMin: this.gl.getUniformLocation(shaderProgram, 'u_foamCrestMin'),
                foamCrestMax: this.gl.getUniformLocation(shaderProgram, 'u_foamCrestMax'),
                waves: Array.from({length: 4}).map((_, i) => ({
                    direction: this.gl.getUniformLocation(shaderProgram, `u_waves[${i}].direction`),
                    frequency: this.gl.getUniformLocation(shaderProgram, `u_waves[${i}].frequency`),
                    amplitude: this.gl.getUniformLocation(shaderProgram, `u_waves[${i}].amplitude`),
                    speed: this.gl.getUniformLocation(shaderProgram, `u_waves[${i}].speed`),
                    steepness: this.gl.getUniformLocation(shaderProgram, `u_waves[${i}].steepness`),
                })) as any,
                ripples: this.gl.getUniformLocation(shaderProgram, 'u_ripples'),
                rippleCount: this.gl.getUniformLocation(shaderProgram, 'u_rippleCount'),
                
                isTerrain: this.gl.getUniformLocation(shaderProgram, 'u_isTerrain'),
                grassTexture: this.gl.getUniformLocation(shaderProgram, 'u_grassTexture'),
                rockTexture: this.gl.getUniformLocation(shaderProgram, 'u_rockTexture'),
                snowTexture: this.gl.getUniformLocation(shaderProgram, 'u_snowTexture'),
                sandTexture: this.gl.getUniformLocation(shaderProgram, 'u_sandTexture'),

                isUnderwater: this.gl.getUniformLocation(shaderProgram, 'u_isUnderwater'),
                waterHeight: this.gl.getUniformLocation(shaderProgram, 'u_waterHeight'),
                causticsTexture: this.gl.getUniformLocation(shaderProgram, 'u_causticsTexture'),
                causticsTiling: this.gl.getUniformLocation(shaderProgram, 'u_causticsTiling'),
                causticsSpeed: this.gl.getUniformLocation(shaderProgram, 'u_causticsSpeed'),
                causticsBrightness: this.gl.getUniformLocation(shaderProgram, 'u_causticsBrightness'),
            },
        };
    }

    private loadShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type);
        if (!shader) {
             const errorMsg = "Failed to create shader";
             this.logger(errorMsg, 'error');
             throw new Error(errorMsg);
        }

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const errorMsg = 'An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader);
            this.logger(errorMsg, 'error');
            this.gl.deleteShader(shader);
            throw new Error(errorMsg);
        }

        return shader;
    }

    public createBuffers(meshData: MeshData): Buffers {
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(meshData.vertices), this.gl.STATIC_DRAW);

        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(meshData.colors), this.gl.STATIC_DRAW);

        let texCoordBuffer: WebGLBuffer | null = null;
        if (meshData.texCoords && meshData.texCoords.length > 0) {
            texCoordBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(meshData.texCoords), this.gl.STATIC_DRAW);
        }
        
        let normalBuffer: WebGLBuffer | null = null;
        if (meshData.normals && meshData.normals.length > 0) {
            normalBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(meshData.normals), this.gl.STATIC_DRAW);
        }

        const indexBuffer = this.gl.createBuffer();
        let wireframeIndexBuffer: WebGLBuffer | null = null;
        let wireframeIndexCount = 0;

        if (meshData.indices.length > 0) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshData.indices), this.gl.STATIC_DRAW);
            
            const wireframeIndices: number[] = [];
            for (let i = 0; i < meshData.indices.length; i += 3) {
                const i0 = meshData.indices[i];
                const i1 = meshData.indices[i + 1];
                const i2 = meshData.indices[i + 2];
                wireframeIndices.push(i0, i1, i1, i2, i2, i0);
            }
            wireframeIndexCount = wireframeIndices.length;
            wireframeIndexBuffer = this.gl.createBuffer()!;
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, wireframeIndexBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wireframeIndices), this.gl.STATIC_DRAW);
        }

        if (!positionBuffer || !colorBuffer || !indexBuffer) {
            const errorMsg = "Failed to create buffers";
            this.logger(errorMsg, 'error');
            throw new Error(errorMsg);
        }

        return {
            position: positionBuffer,
            color: colorBuffer,
            indices: indexBuffer,
            texCoord: texCoordBuffer,
            normal: normalBuffer,
            wireframeIndices: wireframeIndexBuffer,
            wireframeIndexCount,
        };
    }

    private loadTexture(image: HTMLImageElement): WebGLTexture {
        const gl = this.gl;
        const texture = gl.createTexture();
        if (!texture) throw new Error("Could not create texture");
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        return texture;
    }

    private getOrCreateTexture(path: string): WebGLTexture | null {
        if (this.textureCache.has(path)) {
            return this.textureCache.get(path)!;
        }

        const image = this.assetManager.getTexture(path);
        if (image && image.complete) {
            const texture = this.loadTexture(image);
            this.textureCache.set(path, texture);
            return texture;
        }
        return null;
    }

    public render(scene: Scene, camera: Camera, isPlaying: boolean, isGridVisible: boolean, isWireframeVisible: boolean = false, totalTime: number = 0, activeRipples: any[] = [], waterUniforms?: WaterGlobalUniforms): void {
        const gl = this.gl;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.12, 0.12, 0.13, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.shaderProgramInfo.program);
        
        const sp = this.shaderProgramInfo;

        gl.uniformMatrix4fv(sp.uniformLocations.projectionMatrix, false, camera.getProjectionMatrix());
        gl.uniformMatrix4fv(sp.uniformLocations.viewMatrix, false, camera.getViewMatrix());
        gl.uniform1f(sp.uniformLocations.time, totalTime);
        gl.uniform3fv(sp.uniformLocations.cameraPos, camera.position);
        
        // --- Lighting ---
        let lightPos: vec3 = [0.7, 1.0, 0.5]; // Default light direction
        let lightColor: vec3 = [1, 1, 1];
        const directionalLight = scene.getMeshes().find(m => m.light?.type === 'directional');
        if (directionalLight && directionalLight.light) {
            const lightDir = vec3_lib.create();
            // The forward vector for an object is -Z. We transform this by the object's world matrix.
            const forward = vec3_lib.fromValues(0, 0, -1);
            vec3_lib.transformQuat(lightDir, forward, mat4_lib.getRotation(quat_lib.create(), directionalLight.transform.worldMatrix));
            vec3_lib.normalize(lightDir, lightDir);
            lightPos = lightDir;
            lightColor = vec3_lib.scale(vec3_lib.create(), directionalLight.light.color, directionalLight.light.intensity);
        }
        gl.uniform3fv(sp.uniformLocations.lightPos, lightPos);
        gl.uniform3fv(sp.uniformLocations.lightColor, lightColor);


        // Set global water uniforms for caustics etc.
        if (waterUniforms) {
            gl.uniform1i(sp.uniformLocations.isUnderwater, waterUniforms.isUnderwater ? 1 : 0);
            gl.uniform1f(sp.uniformLocations.waterHeight, waterUniforms.waterHeight);
            gl.uniform1f(sp.uniformLocations.causticsTiling, waterUniforms.causticsTiling);
            gl.uniform1f(sp.uniformLocations.causticsSpeed, waterUniforms.causticsSpeed);
            gl.uniform1f(sp.uniformLocations.causticsBrightness, waterUniforms.causticsBrightness);
            
            const causticsTex = waterUniforms.causticsTexture ? this.getOrCreateTexture(waterUniforms.causticsTexture) : null;
            if (causticsTex) {
                gl.activeTexture(gl.TEXTURE1); // Use texture unit 1 for caustics
                gl.bindTexture(gl.TEXTURE_2D, causticsTex);
                gl.uniform1i(sp.uniformLocations.causticsTexture, 1);
            }

        } else {
            gl.uniform1i(sp.uniformLocations.isUnderwater, 0);
            gl.uniform1f(sp.uniformLocations.waterHeight, -10000.0); // Set water level very low if no water object
        }


        for (const mesh of scene.getMeshes()) {
            if (!mesh.renderable || !mesh.buffers) {
                continue;
            }

            if (mesh.type === 'grid' && (isPlaying || !isGridVisible)) {
                continue;
            }

            // Position Attribute
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffers.position);
            gl.vertexAttribPointer(sp.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(sp.attribLocations.vertexPosition);

            // Normal Attribute
            if (mesh.buffers.normal && sp.attribLocations.vertexNormal >= 0) {
                gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffers.normal);
                gl.vertexAttribPointer(sp.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(sp.attribLocations.vertexNormal);
            } else if (sp.attribLocations.vertexNormal >= 0) {
                gl.disableVertexAttribArray(sp.attribLocations.vertexNormal);
            }

            // Set model matrix uniform
            gl.uniformMatrix4fv(sp.uniformLocations.modelMatrix, false, mesh.transform.getModelMatrix());
            
            // Set emissive uniform
            gl.uniform3fv(this.shaderProgramInfo.uniformLocations.emissive, mesh.material?.emissive || [0,0,0]);

            // Default all special flags to off
            gl.uniform1i(sp.uniformLocations.isLiquid, 0);
            gl.uniform1i(sp.uniformLocations.isTerrain, 0);

            // Handle liquid rendering
            if (mesh.liquid) {
                gl.uniform1i(sp.uniformLocations.isLiquid, 1);
                gl.uniform3fv(sp.uniformLocations.liquidBaseColor, mesh.liquid.baseColor);
                gl.uniform3fv(sp.uniformLocations.liquidDeepColor, mesh.liquid.deepColor);
                gl.uniform1f(sp.uniformLocations.liquidDepthDistance, mesh.liquid.depthDistance);
                gl.uniform3fv(sp.uniformLocations.liquidSpecularColor, mesh.liquid.specularColor);
                gl.uniform1f(sp.uniformLocations.liquidShininess, mesh.liquid.shininess);
                gl.uniform3fv(sp.uniformLocations.liquidSssColor, mesh.liquid.sssColor);
                gl.uniform1f(sp.uniformLocations.liquidSssPower, mesh.liquid.sssPower);
                gl.uniform3fv(sp.uniformLocations.foamColor, mesh.liquid.foamColor);
                gl.uniform1f(sp.uniformLocations.foamCrestMin, mesh.liquid.foamCrestMin);
                gl.uniform1f(sp.uniformLocations.foamCrestMax, mesh.liquid.foamCrestMax);

                for (let i = 0; i < 4; i++) {
                    const wave = mesh.liquid.waves[i];
                    const waveUniforms = sp.uniformLocations.waves[i];
                    gl.uniform2fv(waveUniforms.direction, wave.direction);
                    gl.uniform1f(waveUniforms.frequency, wave.frequency);
                    gl.uniform1f(waveUniforms.amplitude, wave.amplitude);
                    gl.uniform1f(waveUniforms.speed, wave.speed);
                    gl.uniform1f(waveUniforms.steepness, wave.steepness);
                }
                
                // Handle ripples
                if (activeRipples.length > 0) {
                    const rippleData = new Float32Array(activeRipples.length * 4);
                    activeRipples.forEach((ripple, i) => {
                        rippleData[i * 4 + 0] = ripple.position[0];
                        rippleData[i * 4 + 1] = ripple.position[1];
                        rippleData[i * 4 + 2] = ripple.startTime;
                        rippleData[i * 4 + 3] = ripple.strength;
                    });
                    gl.uniform4fv(sp.uniformLocations.ripples, rippleData);
                }
                gl.uniform1i(sp.uniformLocations.rippleCount, activeRipples.length);

            } else if (mesh.type === 'terrain' && mesh.material?.terrainTextures) {
                gl.uniform1i(sp.uniformLocations.isTerrain, 1);
                const tex = mesh.material.terrainTextures;
                
                const grassTex = tex.grass ? this.getOrCreateTexture(tex.grass) : null;
                const rockTex = tex.rock ? this.getOrCreateTexture(tex.rock) : null;
                const snowTex = tex.snow ? this.getOrCreateTexture(tex.snow) : null;
                const sandTex = tex.sand ? this.getOrCreateTexture(tex.sand) : null;

                if (grassTex) { gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, grassTex); gl.uniform1i(sp.uniformLocations.grassTexture, 2); }
                if (rockTex) { gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, rockTex); gl.uniform1i(sp.uniformLocations.rockTexture, 3); }
                if (snowTex) { gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, snowTex); gl.uniform1i(sp.uniformLocations.snowTexture, 4); }
                if (sandTex) { gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, sandTex); gl.uniform1i(sp.uniformLocations.sandTexture, 5); }
            }
            
            const hasTexture = mesh.material && mesh.material.albedoTexture && mesh.buffers.texCoord;
            let webglTexture: WebGLTexture | null = null;
            if (hasTexture) {
                webglTexture = this.getOrCreateTexture(mesh.material.albedoTexture!);
            }

            if (webglTexture) {
                gl.uniform1i(sp.uniformLocations.useTexture, 1);
                gl.uniform3fv(sp.uniformLocations.tint, mesh.material!.tint);
                gl.uniform2fv(sp.uniformLocations.tiling, mesh.material!.tiling);
                gl.uniform2fv(sp.uniformLocations.offset, mesh.material!.offset);

                // Texture Coordinate Attribute
                gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffers.texCoord!);
                gl.vertexAttribPointer(sp.attribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(sp.attribLocations.texCoord);

                // Bind texture
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, webglTexture);
                gl.uniform1i(sp.uniformLocations.albedoTexture, 0);

                // Disable color attribute if using texture
                gl.disableVertexAttribArray(sp.attribLocations.vertexColor);
            } else { // No texture
                 gl.uniform1i(sp.uniformLocations.useTexture, 0);
                 
                 // Provide tint, tiling and offset for checkerboard pattern.
                 gl.uniform3fv(sp.uniformLocations.tint, mesh.material?.tint ?? [0.8, 0.8, 0.8]);
                 gl.uniform2fv(sp.uniformLocations.tiling, mesh.material?.tiling ?? [1,1]);
                 gl.uniform2fv(sp.uniformLocations.offset, mesh.material?.offset ?? [0,0]);

                // Enable texcoord for checkerboard if available
                if (mesh.buffers.texCoord) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffers.texCoord);
                    gl.vertexAttribPointer(sp.attribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(sp.attribLocations.texCoord);
                } else {
                    gl.disableVertexAttribArray(sp.attribLocations.texCoord);
                }

                // Handle vertex colors vs checkerboard
                if (mesh.type === 'grid') { // Terrain no longer uses vertex colors
                    // This mesh uses vertex colors, which have alpha > 0
                    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffers.color);
                    gl.vertexAttribPointer(sp.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(sp.attribLocations.vertexColor);
                } else if (mesh.type !== 'terrain') {
                    // This mesh should use the checkerboard. Signal this to the shader
                    // by setting vertex color alpha to 0.
                    gl.disableVertexAttribArray(sp.attribLocations.vertexColor);
                    gl.vertexAttrib4f(sp.attribLocations.vertexColor, 0.0, 0.0, 0.0, 0.0);
                }
            }
            
            // Draw
            if (isWireframeVisible && mesh.drawMode !== 'LINES' && mesh.buffers?.wireframeIndices) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.buffers.wireframeIndices);
                gl.drawElements(gl.LINES, mesh.buffers.wireframeIndexCount ?? 0, gl.UNSIGNED_SHORT, 0);
            } else if (mesh.drawMode === 'LINES') {
                gl.drawArrays(gl.LINES, 0, mesh.vertexCount);
            } else {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.buffers.indices);
                gl.drawElements(gl.TRIANGLES, mesh.vertexCount, gl.UNSIGNED_SHORT, 0);
            }
        }
    }

    public renderParticles(camera: Camera, particles: Particle[]): void {
        const gl = this.gl;
        const numParticles = Math.min(particles.length, MAX_PARTICLES_RENDER);
        if (numParticles === 0) return;
    
        // 1. Sort particles
        const camPos = camera.position;
        particles.sort((a, b) => vec3_lib.sqrDist(b.position, camPos) - vec3_lib.sqrDist(a.position, camPos));
    
        // 2. Build VBO data on CPU
        const viewMatrix = camera.getViewMatrix();
        const cameraRight = vec3_lib.fromValues(viewMatrix[0], viewMatrix[4], viewMatrix[8]);
        const cameraUp = vec3_lib.fromValues(viewMatrix[1], viewMatrix[5], viewMatrix[9]);
        
        const stride = 9; // 3 pos, 4 color, 2 uv
        let offset = 0;
        
        for (let i = 0; i < numParticles; i++) {
            const p = particles[i];
            const lifeT = 1.0 - (p.life / p.initialLife);
            const size = p.startSize + (p.endSize - p.startSize) * lifeT;
            const color = vec4_lib.lerp(vec4_lib.create(), p.startColor, p.endColor, lifeT);
            
            const cos = Math.cos(p.rotation);
            const sin = Math.sin(p.rotation);
            const rotatedRight = vec3_lib.fromValues(cameraRight[0] * cos - cameraUp[0] * sin, cameraRight[1] * cos - cameraUp[1] * sin, cameraRight[2] * cos - cameraUp[2] * sin);
            const rotatedUp = vec3_lib.fromValues(cameraRight[0] * sin + cameraUp[0] * cos, cameraRight[1] * sin + cameraUp[1] * cos, cameraRight[2] * sin + cameraUp[2] * cos);

            const p1 = vec3_lib.subtract(vec3_lib.create(), vec3_lib.add(vec3_lib.create(), vec3_lib.scale(vec3_lib.create(), rotatedRight, -size), vec3_lib.scale(vec3_lib.create(), rotatedUp, -size)), p.position);
            const p2 = vec3_lib.subtract(vec3_lib.create(), vec3_lib.add(vec3_lib.create(), vec3_lib.scale(vec3_lib.create(), rotatedRight, size), vec3_lib.scale(vec3_lib.create(), rotatedUp, -size)), p.position);
            const p3 = vec3_lib.subtract(vec3_lib.create(), vec3_lib.add(vec3_lib.create(), vec3_lib.scale(vec3_lib.create(), rotatedRight, -size), vec3_lib.scale(vec3_lib.create(), rotatedUp, size)), p.position);
            const p4 = vec3_lib.subtract(vec3_lib.create(), vec3_lib.add(vec3_lib.create(), vec3_lib.scale(vec3_lib.create(), rotatedRight, size), vec3_lib.scale(vec3_lib.create(), rotatedUp, size)), p.position);
            
            const uvs = [[0,0], [1,0], [0,1], [1,1]];
            if (p.totalSprites > 1) {
                const u_size = 1.0 / p.spriteSheetCols;
                const v_size = 1.0 / p.spriteSheetRows;
                const u_off = (p.spriteIndex % p.spriteSheetCols) * u_size;
                const v_off = Math.floor(p.spriteIndex / p.spriteSheetCols) * v_size;
                uvs[0] = [u_off, v_off];
                uvs[1] = [u_off + u_size, v_off];
                uvs[2] = [u_off, v_off + v_size];
                uvs[3] = [u_off + u_size, v_off + v_size];
            }

            const verts = [p1, p2, p3, p2, p4, p3];
            const vert_uvs = [uvs[0], uvs[1], uvs[2], uvs[1], uvs[3], uvs[2]];

            for(let j=0; j<6; j++){
                this.particleVBOData.set(verts[j], offset);
                this.particleVBOData.set(color, offset + 3);
                this.particleVBOData.set(vert_uvs[j], offset + 7);
                offset += stride;
            }
        }
    
        // 3. Render
        gl.useProgram(this.particleShaderProgramInfo.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVBO);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.particleVBOData.subarray(0, offset));
    
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
    
        const sp = this.particleShaderProgramInfo;
        gl.vertexAttribPointer(sp.attribLocations.position, 3, gl.FLOAT, false, stride * 4, 0);
        gl.enableVertexAttribArray(sp.attribLocations.position);
        gl.vertexAttribPointer(sp.attribLocations.color, 4, gl.FLOAT, false, stride * 4, 3 * 4);
        gl.enableVertexAttribArray(sp.attribLocations.color);
        gl.vertexAttribPointer(sp.attribLocations.texCoord, 2, gl.FLOAT, false, stride * 4, 7 * 4);
        gl.enableVertexAttribArray(sp.attribLocations.texCoord);

        gl.uniformMatrix4fv(sp.uniformLocations.projectionMatrix, false, camera.getProjectionMatrix());
        gl.uniformMatrix4fv(sp.uniformLocations.viewMatrix, false, camera.getViewMatrix());
        
        const texture = this.getOrCreateTexture(particles[0].texture!);
        if (texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(sp.uniformLocations.texture, 0);
        }
        
        gl.drawArrays(gl.TRIANGLES, 0, numParticles * 6);
    
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.useProgram(this.shaderProgramInfo.program); // Switch back
    }
    

    public renderDebugLines(camera: Camera, lines: { vertices: number[]; colors: number[] }): void {
        if (lines.vertices.length === 0) return;

        const gl = this.gl;
        const sp = this.shaderProgramInfo;

        if (!this.debugLineBuffers) {
            this.debugLineBuffers = {
                position: gl.createBuffer()!,
                color: gl.createBuffer()!,
            };
        }

        gl.useProgram(sp.program);
        gl.uniform1i(sp.uniformLocations.isLiquid, 0);
        gl.uniform1i(sp.uniformLocations.isTerrain, 0);


        // Update buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.debugLineBuffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines.vertices), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(sp.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(sp.attribLocations.vertexPosition);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.debugLineBuffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines.colors), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(sp.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(sp.attribLocations.vertexColor);
        
        gl.disableVertexAttribArray(sp.attribLocations.texCoord);
        if(sp.attribLocations.vertexNormal >= 0) gl.disableVertexAttribArray(sp.attribLocations.vertexNormal);
        
        // Set uniforms
        gl.uniformMatrix4fv(sp.uniformLocations.projectionMatrix, false, camera.getProjectionMatrix());
        gl.uniformMatrix4fv(sp.uniformLocations.viewMatrix, false, camera.getViewMatrix());
        gl.uniformMatrix4fv(sp.uniformLocations.modelMatrix, false, [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); // Identity matrix
        gl.uniform1i(sp.uniformLocations.useTexture, 0);
        gl.uniform4f(sp.uniformLocations.fallbackColor, 1.0, 1.0, 1.0, 1.0); // Not used when a_color is active
        
        // Draw
        gl.drawArrays(gl.LINES, 0, lines.vertices.length / 3);
    }

    // --- GIZMO IMPLEMENTATION ---

    public renderGizmo(camera: Camera, selectedObject: Mesh, tool: TransformTool): void {
        if (tool === 'translate') {
            this.renderTranslateGizmo(camera, selectedObject);
        } else if (tool === 'rotate') {
            this.renderRotateGizmo(camera, selectedObject);
        } else if (tool === 'scale') {
            this.renderScaleGizmo(camera, selectedObject);
        }
    }

    private createTranslateGizmoGeometry() {
        const lineLength = 1.0;
        const coneHeight = 0.2;
        const coneRadius = 0.05;
        const coneSegments = 12;

        const createArrow = (axis: 'x' | 'y' | 'z', color: vec3): MeshData => {
            const vertices: number[] = [0, 0, 0];
            const indices: number[] = [];
            
            // Line
            if (axis === 'x') vertices.push(lineLength, 0, 0);
            if (axis === 'y') vertices.push(0, lineLength, 0);
            if (axis === 'z') vertices.push(0, 0, lineLength);
            indices.push(0, 1);

            // Cone
            const tipIndex = vertices.length / 3;
            if (axis === 'x') vertices.push(lineLength + coneHeight, 0, 0);
            if (axis === 'y') vertices.push(0, lineLength + coneHeight, 0);
            if (axis === 'z') vertices.push(0, 0, lineLength + coneHeight);
            
            const baseStartIndex = vertices.length / 3;
            for (let i = 0; i < coneSegments; i++) {
                const angle = (i / coneSegments) * 2 * Math.PI;
                let x, y, z;
                if (axis === 'x') { x = lineLength; y = Math.cos(angle) * coneRadius; z = Math.sin(angle) * coneRadius; }
                else if (axis === 'y') { y = lineLength; x = Math.cos(angle) * coneRadius; z = Math.sin(angle) * coneRadius; }
                else { z = lineLength; x = Math.cos(angle) * coneRadius; y = Math.sin(angle) * coneRadius; }
                vertices.push(x, y, z);
            }

            for (let i = 0; i < coneSegments; i++) {
                indices.push(tipIndex, baseStartIndex + i, baseStartIndex + ((i + 1) % coneSegments));
            }

            const colors = new Array(vertices.length / 3 * 4).fill(0).map((_, i) => color[i % 4] || 1.0);
            return { vertices, indices, colors };
        };

        const axes: ('x'|'y'|'z')[] = ['x', 'y', 'z'];
        const colors: vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

        axes.forEach((axis, i) => {
            const data = createArrow(axis, colors[i]);
            const buffers = this.createBuffers(data);
            this.translateGizmoParts[axis] = { data, buffers, color: colors[i], hoverColor: [1, 1, 0] };
        });
    }

    private createRotateGizmoGeometry() {
        const segments = 64;
        const radius = 1.0;
        
        const createRing = (axis: 'x' | 'y' | 'z', color: vec3): MeshData => {
            const vertices: number[] = [];
            const colors: number[] = [];
            
            for (let i = 0; i < segments; i++) {
                const angle1 = (i / segments) * 2 * Math.PI;
                const angle2 = ((i + 1) / segments) * 2 * Math.PI;
    
                let p1: number[], p2: number[];
                 if (axis === 'x') { // YZ plane
                    p1 = [0, Math.cos(angle1) * radius, Math.sin(angle1) * radius];
                    p2 = [0, Math.cos(angle2) * radius, Math.sin(angle2) * radius];
                } else if (axis === 'y') { // XZ plane
                    p1 = [Math.cos(angle1) * radius, 0, Math.sin(angle1) * radius];
                    p2 = [Math.cos(angle2) * radius, 0, Math.sin(angle2) * radius];
                } else { // 'z', XY plane
                    p1 = [Math.cos(angle1) * radius, Math.sin(angle1) * radius, 0];
                    p2 = [Math.cos(angle2) * radius, Math.sin(angle2) * radius, 0];
                }
                vertices.push(...p1, ...p2);
                colors.push(...color, 1.0, ...color, 1.0);
            }
            return { vertices, indices: [], colors };
        };
    
        const axes: ('x'|'y'|'z')[] = ['x', 'y', 'z'];
        const colors: vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        
        axes.forEach((axis, i) => {
            const data = createRing(axis, colors[i]);
            const buffers = this.createBuffers(data);
            this.rotateGizmoParts[axis] = { data, buffers, color: colors[i], hoverColor: [1, 1, 0] };
        });
    }

    private createScaleGizmoGeometry() {
        const lineLength = 1.0;
        const cubeSize = 0.05;

        const createHandle = (axis: 'x' | 'y' | 'z', color: vec3): { line: MeshData, cube: MeshData } => {
            const line: MeshData = { vertices: [0,0,0], indices: [], colors: [] };
            if(axis === 'x') line.vertices.push(lineLength, 0, 0);
            if(axis === 'y') line.vertices.push(0, lineLength, 0);
            if(axis === 'z') line.vertices.push(0, 0, lineLength);
            line.colors = [...color, 1, ...color, 1];

            const s = cubeSize;
            const cubeVertices = [ -s,-s,s, s,-s,s, s,s,s, -s,s,s, -s,-s,-s, -s,s,-s, s,s,-s, s,-s,-s ];
            const cubeIndices = [ 0,1,2, 0,2,3, 4,5,6, 4,6,7, 3,2,6, 3,6,5, 4,7,1, 4,1,0, 1,7,6, 1,6,2, 4,0,3, 4,3,5 ];
            const translatedVerts: number[] = [];
            for(let i=0; i<cubeVertices.length; i+=3) {
                 if(axis === 'x') translatedVerts.push(cubeVertices[i] + lineLength, cubeVertices[i+1], cubeVertices[i+2]);
                 if(axis === 'y') translatedVerts.push(cubeVertices[i], cubeVertices[i+1] + lineLength, cubeVertices[i+2]);
                 if(axis === 'z') translatedVerts.push(cubeVertices[i], cubeVertices[i+1], cubeVertices[i+2] + lineLength);
            }
            
            const cube: MeshData = { vertices: translatedVerts, indices: cubeIndices, colors: new Array(8*4).fill(1) };
            return { line, cube };
        };
        
        const axes: ('x'|'y'|'z')[] = ['x', 'y', 'z'];
        const colors: vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        axes.forEach((axis, i) => {
            const { line, cube } = createHandle(axis, colors[i]);
            this.scaleGizmoParts[`${axis}_line`] = { data: line, buffers: this.createBuffers(line), color: colors[i], hoverColor: [1,1,0], type: 'line' };
            this.scaleGizmoParts[`${axis}_cube`] = { data: cube, buffers: this.createBuffers(cube), color: colors[i], hoverColor: [1,1,0], type: 'cube' };
        });

        const s = cubeSize * 1.5;
        const centerCubeVerts = [ -s,-s,s, s,-s,s, s,s,s, -s,s,s, -s,-s,-s, -s,s,-s, s,s,-s, s,-s,-s ];
        const centerCubeIndices = [ 0,1,2, 0,2,3, 4,5,6, 4,6,7, 3,2,6, 3,6,5, 4,7,1, 4,1,0, 1,7,6, 1,6,2, 4,0,3, 4,3,5 ];
        const centerCubeData = { vertices: centerCubeVerts, indices: centerCubeIndices, colors: new Array(8*4).fill(1) };
        this.scaleGizmoParts['xyz_cube'] = { data: centerCubeData, buffers: this.createBuffers(centerCubeData), color: [0.7,0.7,0.7], hoverColor: [1,1,0], type: 'cube' };
    }


    private renderTranslateGizmo(camera: Camera, selectedObject: Mesh) {
        const gl = this.gl;
        gl.disable(gl.DEPTH_TEST);
        gl.useProgram(this.shaderProgramInfo.program);
        gl.uniform1i(this.shaderProgramInfo.uniformLocations.isLiquid, 0);

        const sp = this.shaderProgramInfo;
        const objectPos = selectedObject.transform.getWorldPosition();
        const dist = vec3_lib.distance(camera.position, objectPos);
        const scale = dist * 0.15;

        const modelMatrix = mat4_lib.create();
        mat4_lib.fromTranslation(modelMatrix, objectPos);
        mat4_lib.scale(modelMatrix, modelMatrix, [scale, scale, scale]);
        
        gl.uniformMatrix4fv(sp.uniformLocations.modelMatrix, false, modelMatrix);
        gl.uniform1i(sp.uniformLocations.useTexture, 0);
        gl.disableVertexAttribArray(sp.attribLocations.texCoord);
        if(sp.attribLocations.vertexNormal >= 0) gl.disableVertexAttribArray(sp.attribLocations.vertexNormal);


        for (const axis in this.translateGizmoParts) {
            const part = this.translateGizmoParts[axis];
            const color = axis === this.gizmoActiveAxis ? part.hoverColor : part.color;
            gl.uniform4f(sp.uniformLocations.fallbackColor, color[0], color[1], color[2], 1.0);

            gl.bindBuffer(gl.ARRAY_BUFFER, part.buffers.position);
            gl.vertexAttribPointer(sp.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(sp.attribLocations.vertexPosition);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, part.buffers.color);
            gl.vertexAttribPointer(sp.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(sp.attribLocations.vertexColor);

            gl.drawArrays(gl.LINES, 0, 2);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, part.buffers.indices);
            gl.drawElements(gl.TRIANGLES, part.data.indices.length - 2, gl.UNSIGNED_SHORT, 2 * 2);
        }

        gl.enable(gl.DEPTH_TEST);
    }

    private renderRotateGizmo(camera: Camera, selectedObject: Mesh) {
        const gl = this.gl;
        gl.disable(gl.DEPTH_TEST);
        gl.useProgram(this.shaderProgramInfo.program);
        gl.uniform1i(this.shaderProgramInfo.uniformLocations.isLiquid, 0);

        const sp = this.shaderProgramInfo;
        const objectPos = selectedObject.transform.getWorldPosition();
        const dist = vec3_lib.distance(camera.position, objectPos);
        const scale = dist * 0.15;

        const modelMatrix = mat4_lib.create();
        const objectRotation = quat_lib.create();
        quat_lib.fromEuler(objectRotation, selectedObject.transform.rotation[0] * 180 / Math.PI, selectedObject.transform.rotation[1] * 180 / Math.PI, selectedObject.transform.rotation[2] * 180 / Math.PI);
        mat4_lib.fromRotationTranslationScale(modelMatrix, objectRotation, objectPos, [scale, scale, scale]);
        
        gl.uniformMatrix4fv(sp.uniformLocations.modelMatrix, false, modelMatrix);
        gl.uniform1i(sp.uniformLocations.useTexture, 0);
        gl.disableVertexAttribArray(sp.attribLocations.texCoord);
        if(sp.attribLocations.vertexNormal >= 0) gl.disableVertexAttribArray(sp.attribLocations.vertexNormal);


        for (const axis in this.rotateGizmoParts) {
            const part = this.rotateGizmoParts[axis];
            const color = axis === this.gizmoActiveAxis ? part.hoverColor : part.color;
            gl.uniform4f(sp.uniformLocations.fallbackColor, color[0], color[1], color[2], 1.0);

            gl.bindBuffer(gl.ARRAY_BUFFER, part.buffers.position);
            gl.vertexAttribPointer(sp.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(sp.attribLocations.vertexPosition);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, part.buffers.color);
            gl.vertexAttribPointer(sp.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(sp.attribLocations.vertexColor);

            gl.drawArrays(gl.LINES, 0, part.data.vertices.length / 3);
        }

        gl.enable(gl.DEPTH_TEST);
    }
    
    private renderScaleGizmo(camera: Camera, selectedObject: Mesh) {
        const gl = this.gl;
        gl.disable(gl.DEPTH_TEST);
        gl.useProgram(this.shaderProgramInfo.program);
        gl.uniform1i(this.shaderProgramInfo.uniformLocations.isLiquid, 0);
    
        const sp = this.shaderProgramInfo;
        const objectPos = selectedObject.transform.getWorldPosition();
        const dist = vec3_lib.distance(camera.position, objectPos);
        const scale = dist * 0.15;
    
        const modelMatrix = mat4_lib.create();
        mat4_lib.fromTranslation(modelMatrix, objectPos);
        mat4_lib.scale(modelMatrix, modelMatrix, [scale, scale, scale]);
        
        gl.uniformMatrix4fv(sp.uniformLocations.modelMatrix, false, modelMatrix);
        gl.uniform1i(sp.uniformLocations.useTexture, 0);
        gl.disableVertexAttribArray(sp.attribLocations.texCoord);
        if(sp.attribLocations.vertexNormal >= 0) gl.disableVertexAttribArray(sp.attribLocations.vertexNormal);

    
        for (const partName in this.scaleGizmoParts) {
            const part = this.scaleGizmoParts[partName];
            const baseAxis = partName.split('_')[0]; // x, y, z, xyz
            const color = baseAxis === this.gizmoActiveAxis ? part.hoverColor : part.color;
    
            gl.uniform4f(sp.uniformLocations.fallbackColor, color[0], color[1], color[2], 1.0);
    
            gl.bindBuffer(gl.ARRAY_BUFFER, part.buffers.position);
            gl.vertexAttribPointer(sp.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(sp.attribLocations.vertexPosition);
    
            gl.bindBuffer(gl.ARRAY_BUFFER, part.buffers.color);
            gl.vertexAttribPointer(sp.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(sp.attribLocations.vertexColor);
    
            if (part.type === 'line') {
                gl.drawArrays(gl.LINES, 0, part.data.vertices.length / 3);
            } else if (part.type === 'cube') {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, part.buffers.indices);
                gl.drawElements(gl.TRIANGLES, part.data.indices.length, gl.UNSIGNED_SHORT, 0);
            }
        }
    
        gl.enable(gl.DEPTH_TEST);
    }
    
    public setGizmoActiveAxis(axis: string | null) {
        this.gizmoActiveAxis = axis;
    }
    
    public checkGizmoIntersection(object: Mesh, rayOrigin: vec3, rayDir: vec3, camera: Camera, tool: TransformTool): string | null {
        if (this.isGizmoDragging) return this.gizmoActiveAxis;
        
        if (tool === 'translate') {
            return this.checkTranslateGizmoIntersection(object, rayOrigin, rayDir, camera);
        } else if (tool === 'rotate') {
            return this.checkRotateGizmoIntersection(object, rayOrigin, rayDir, camera);
        } else if (tool === 'scale') {
            return this.checkScaleGizmoIntersection(object, rayOrigin, rayDir, camera);
        }
        return null;
    }

    private checkTranslateGizmoIntersection(object: Mesh, rayOrigin: vec3, rayDir: vec3, camera: Camera): 'x' | 'y' | 'z' | null {
        const objectPos = object.transform.getWorldPosition();
        const dist = vec3_lib.distance(camera.position, objectPos);
        const scale = dist * 0.15;
        const radius = 0.05 * scale; // Cylinder radius

        let closestHit: { axis: 'x' | 'y' | 'z', t: number } | null = null;
        
        const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
        axes.forEach(axis => {
            const axisDir: vec3 = axis === 'x' ? [1,0,0] : axis === 'y' ? [0,1,0] : [0,0,1];
            const pa = vec3_lib.clone(objectPos);
            const va = vec3_lib.clone(axisDir);

            const dp = vec3_lib.subtract(vec3_lib.create(), rayOrigin, pa);
            const a = vec3_lib.dot(rayDir, rayDir) - Math.pow(vec3_lib.dot(rayDir, va), 2);
            const b = vec3_lib.dot(rayDir, dp) - vec3_lib.dot(rayDir, va) * vec3_lib.dot(dp, va);
            const c = vec3_lib.dot(dp, dp) - Math.pow(vec3_lib.dot(dp, va), 2) - radius * radius;
            
            const discriminant = b*b - a*c;
            if (discriminant >= 0) {
                const t = (-b - Math.sqrt(discriminant)) / a;
                if (t > 0) {
                    const pointOnAxis = vec3_lib.dot(dp, va) + t * vec3_lib.dot(rayDir, va);
                    if (pointOnAxis >= 0 && pointOnAxis <= scale * 1.2) {
                        if (!closestHit || t < closestHit.t) closestHit = { axis, t };
                    }
                }
            }
        });
        
        this.gizmoActiveAxis = closestHit?.axis ?? null;
        return this.gizmoActiveAxis as 'x' | 'y' | 'z' | null;
    }

    private checkRotateGizmoIntersection(object: Mesh, rayOrigin: vec3, rayDir: vec3, camera: Camera): 'x' | 'y' | 'z' | null {
        const objectPos = object.transform.getWorldPosition();
        const dist = vec3_lib.distance(camera.position, objectPos);
        const gizmoRadius = dist * 0.15;
        const tolerance = gizmoRadius * 0.1;

        const objectRotation = quat_lib.create();
        quat_lib.fromEuler(objectRotation, object.transform.rotation[0] * 180 / Math.PI, object.transform.rotation[1] * 180 / Math.PI, object.transform.rotation[2] * 180 / Math.PI);

        let closestHit: { axis: 'x' | 'y' | 'z', t: number } | null = null;
        const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];

        axes.forEach(axis => {
            let planeNormal: vec3 = axis === 'x' ? [1,0,0] : axis === 'y' ? [0,1,0] : [0,0,1];
            vec3_lib.transformQuat(planeNormal, planeNormal, objectRotation);
            
            const denom = vec3_lib.dot(planeNormal, rayDir);
            if (Math.abs(denom) > 1e-6) {
                const t = vec3_lib.dot(vec3_lib.subtract(vec3_lib.create(), objectPos, rayOrigin), planeNormal) / denom;
                if (t > 0) {
                    const intersectPoint = vec3_lib.scaleAndAdd(vec3_lib.create(), rayOrigin, rayDir, t);
                    const distFromCenter = vec3_lib.distance(intersectPoint, objectPos);

                    if (Math.abs(distFromCenter - gizmoRadius) < tolerance) {
                         if (!closestHit || t < closestHit.t) closestHit = { axis, t };
                    }
                }
            }
        });

        this.gizmoActiveAxis = closestHit?.axis ?? null;
        return this.gizmoActiveAxis as 'x' | 'y' | 'z' | null;
    }

    private checkScaleGizmoIntersection(object: Mesh, rayOrigin: vec3, rayDir: vec3, camera: Camera): 'x' | 'y' | 'z' | 'xyz' | null {
        const objectPos = object.transform.getWorldPosition();
        const dist = vec3_lib.distance(camera.position, objectPos);
        const gizmoScale = dist * 0.15;
    
        let closestHit: { axis: 'x' | 'y' | 'z' | 'xyz', t: number } | null = null;
    
        const checkAABB = (min: vec3, max: vec3) => {
            let tmin = (min[0] - rayOrigin[0]) / rayDir[0];
            let tmax = (max[0] - rayOrigin[0]) / rayDir[0];
            if (tmin > tmax) [tmin, tmax] = [tmax, tmin];
    
            let tymin = (min[1] - rayOrigin[1]) / rayDir[1];
            let tymax = (max[1] - rayOrigin[1]) / rayDir[1];
            if (tymin > tymax) [tymin, tymax] = [tymax, tymin];
    
            if ((tmin > tymax) || (tymin > tmax)) return Infinity;
            if (tymin > tmin) tmin = tymin;
            if (tymax < tmax) tmax = tymax;
    
            let tzmin = (min[2] - rayOrigin[2]) / rayDir[2];
            let tzmax = (max[2] - rayOrigin[2]) / rayDir[2];
            if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];
    
            if ((tmin > tzmax) || (tzmin > tmax)) return Infinity;
            if (tzmin > tmin) tmin = tzmin;
    
            return tmin > 0 ? tmin : Infinity;
        };
    
        // Check axis cubes
        const cubeSize = 0.05 * gizmoScale;
        const lineLength = 1.0 * gizmoScale;
        const axes: ('x'|'y'|'z')[] = ['x', 'y', 'z'];
        axes.forEach(axis => {
            let center: vec3 = [objectPos[0], objectPos[1], objectPos[2]];
            if (axis === 'x') center[0] += lineLength;
            if (axis === 'y') center[1] += lineLength;
            if (axis === 'z') center[2] += lineLength;
    
            const min: vec3 = [center[0] - cubeSize, center[1] - cubeSize, center[2] - cubeSize];
            const max: vec3 = [center[0] + cubeSize, center[1] + cubeSize, center[2] + cubeSize];
            const t = checkAABB(min, max);
            if (t < Infinity && (!closestHit || t < closestHit.t)) {
                closestHit = { axis, t };
            }
        });
    
        // Check center cube
        const centerCubeSize = cubeSize * 1.5;
        const min: vec3 = [objectPos[0] - centerCubeSize, objectPos[1] - centerCubeSize, objectPos[2] - centerCubeSize];
        const max: vec3 = [objectPos[0] + centerCubeSize, objectPos[1] + centerCubeSize, objectPos[2] + centerCubeSize];
        const t = checkAABB(min, max);
        if (t < Infinity && (!closestHit || t < closestHit.t)) {
            closestHit = { axis: 'xyz', t };
        }
    
        this.gizmoActiveAxis = closestHit?.axis ?? null;
        return this.gizmoActiveAxis as any;
    }
    

    public startGizmoDrag(object: Mesh, rayOrigin: vec3, rayDir: vec3, camera: Camera, tool: TransformTool, mouseX: number, mouseY: number): boolean {
        const activeAxis = this.checkGizmoIntersection(object, rayOrigin, rayDir, camera, tool);
        if (!activeAxis) return false;
        
        this.isGizmoDragging = true;
        const objectPos = object.transform.getWorldPosition();
        
        if (tool === 'translate' && (activeAxis === 'x' || activeAxis === 'y' || activeAxis === 'z')) {
            const planePoint = objectPos;
            let planeNormal: vec3;
            
            // To prevent teleporting, we select a plane that is most perpendicular to the camera's view direction.
            // This provides the most stable ray-plane intersection.
            const camFwd = camera.getFront();

            if (activeAxis === 'x') {
                const planeNormalY: vec3 = [0, 1, 0]; // XZ plane
                const planeNormalZ: vec3 = [0, 0, 1]; // XY plane
                planeNormal = Math.abs(vec3_lib.dot(camFwd, planeNormalY)) > Math.abs(vec3_lib.dot(camFwd, planeNormalZ)) ? planeNormalY : planeNormalZ;
            } else if (activeAxis === 'y') {
                const planeNormalX: vec3 = [1, 0, 0]; // YZ plane
                const planeNormalZ: vec3 = [0, 0, 1]; // XY plane
                planeNormal = Math.abs(vec3_lib.dot(camFwd, planeNormalX)) > Math.abs(vec3_lib.dot(camFwd, planeNormalZ)) ? planeNormalX : planeNormalZ;
            } else { // 'z'
                const planeNormalX: vec3 = [1, 0, 0]; // YZ plane
                const planeNormalY: vec3 = [0, 1, 0]; // XZ plane
                planeNormal = Math.abs(vec3_lib.dot(camFwd, planeNormalX)) > Math.abs(vec3_lib.dot(camFwd, planeNormalY)) ? planeNormalX : planeNormalY;
            }

            this.translateGizmoDragState = {
                axis: activeAxis,
                object: object,
                startPosition: vec3_lib.clone(objectPos),
                planeNormal,
                planePoint,
            };
        } else if (tool === 'rotate' && (activeAxis === 'x' || activeAxis === 'y' || activeAxis === 'z')) {
             const objectRotation = quat_lib.create();
             quat_lib.fromEuler(objectRotation, object.transform.rotation[0] * 180 / Math.PI, object.transform.rotation[1] * 180 / Math.PI, object.transform.rotation[2] * 180 / Math.PI);

             let planeNormal: vec3 = activeAxis === 'x' ? [1,0,0] : activeAxis === 'y' ? [0,1,0] : [0,0,1];
             vec3_lib.transformQuat(planeNormal, planeNormal, objectRotation);
             
             const planePoint = objectPos;

             const denom = vec3_lib.dot(planeNormal, rayDir);
             const t = vec3_lib.dot(vec3_lib.subtract(vec3_lib.create(), planePoint, rayOrigin), planeNormal) / denom;
             const intersectPoint = vec3_lib.scaleAndAdd(vec3_lib.create(), rayOrigin, rayDir, t);
             const startDragVec = vec3_lib.subtract(vec3_lib.create(), intersectPoint, planePoint);
             vec3_lib.normalize(startDragVec, startDragVec);

             this.rotateGizmoDragState = {
                axis: activeAxis,
                object: object,
                startDragVec,
                planeNormal,
                planePoint,
                startRotation: vec3_lib.clone(object.transform.rotation)
             };
        } else if (tool === 'scale' && (activeAxis === 'x' || activeAxis === 'y' || activeAxis === 'z' || activeAxis === 'xyz')) {
             this.scaleGizmoDragState = {
                axis: activeAxis,
                object: object,
                startScale: vec3_lib.clone(object.transform.scale),
                startMouse: { x: mouseX, y: mouseY }
             };
        }

        return true;
    }

    public updateGizmoDrag(rayOrigin: vec3, rayDir: vec3, mouseX: number, mouseY: number): { position?: vec3, rotation?: { axis: 'x'|'y'|'z', angle: number }, scale?: vec3 } | null {
        if (!this.isGizmoDragging) return null;

        if (this.translateGizmoDragState) {
            const { planeNormal, planePoint, startPosition, axis } = this.translateGizmoDragState;
            const denom = vec3_lib.dot(planeNormal, rayDir);
            if (Math.abs(denom) > 1e-6) {
                const t = vec3_lib.dot(vec3_lib.subtract(vec3_lib.create(), planePoint, rayOrigin), planeNormal) / denom;
                const intersectPoint = vec3_lib.scaleAndAdd(vec3_lib.create(), rayOrigin, rayDir, t);
                const offset = vec3_lib.subtract(vec3_lib.create(), intersectPoint, planePoint);
                
                const axisDir: vec3 = axis === 'x' ? [1,0,0] : axis === 'y' ? [0,1,0] : [0,0,1];
                const projection = vec3_lib.dot(offset, axisDir);
                
                const newPosition = vec3_lib.scaleAndAdd(vec3_lib.create(), startPosition, axisDir, projection);
                return { position: newPosition };
            }
        } else if (this.rotateGizmoDragState) {
            const { planeNormal, planePoint, startDragVec, axis } = this.rotateGizmoDragState;
            
            const denom = vec3_lib.dot(planeNormal, rayDir);
            if(Math.abs(denom) < 1e-6) return null;

            const t = vec3_lib.dot(vec3_lib.subtract(vec3_lib.create(), planePoint, rayOrigin), planeNormal) / denom;
            const intersectPoint = vec3_lib.scaleAndAdd(vec3_lib.create(), rayOrigin, rayDir, t);

            const currentDragVec = vec3_lib.subtract(vec3_lib.create(), intersectPoint, planePoint);
            vec3_lib.normalize(currentDragVec, currentDragVec);

            let angle = Math.acos(Math.max(-1, Math.min(1, vec3_lib.dot(startDragVec, currentDragVec))));
            const cross = vec3_lib.cross(vec3_lib.create(), startDragVec, currentDragVec);
            if (vec3_lib.dot(planeNormal, cross) < 0) {
                angle = -angle;
            }

            this.rotateGizmoDragState.startDragVec = currentDragVec;
            return { rotation: { axis, angle } };
        } else if (this.scaleGizmoDragState) {
             const { startScale, startMouse, axis } = this.scaleGizmoDragState;
             const dx = mouseX - startMouse.x;
             const scaleFactor = Math.max(0.001, 1 + (dx * 0.01));
             const newScale = vec3_lib.clone(startScale);

             if (axis === 'x') newScale[0] = startScale[0] * scaleFactor;
             else if (axis === 'y') newScale[1] = startScale[1] * scaleFactor;
             else if (axis === 'z') newScale[2] = startScale[2] * scaleFactor;
             else if (axis === 'xyz') vec3_lib.scale(newScale, startScale, scaleFactor);
             
             return { scale: newScale };
        }

        return null;
    }

    public endGizmoDrag() {
        this.isGizmoDragging = false;
        this.translateGizmoDragState = null;
        this.rotateGizmoDragState = null;
        this.scaleGizmoDragState = null;
    }
    
    // --- CAMERA PREVIEW AND GIZMOS ---

    public renderPreview(scene: Scene, cameraObject: Mesh, isPlaying: boolean, isGridVisible: boolean, isWireframeVisible: boolean, totalTime: number, waterUniforms?: WaterGlobalUniforms) {
        const gl = this.gl;
        const canvasWidth = gl.canvas.width;
        const canvasHeight = gl.canvas.height;
        
        const previewWidth = Math.min(320, canvasWidth * 0.25);
        const previewHeight = previewWidth / (16/9);
        const previewX = canvasWidth - previewWidth - 10;
        const previewY = 10;
        
        gl.enable(gl.SCISSOR_TEST);
        gl.viewport(previewX, previewY, previewWidth, previewHeight);
        gl.scissor(previewX, previewY, previewWidth, previewHeight);
        
        gl.clearColor(0.05, 0.05, 0.05, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        const tempCamera = new Camera(this.gl.canvas as HTMLCanvasElement);
        const camProps = cameraObject.cinematicCameraComponent || cameraObject.cameraComponent;
        if (camProps) {
            tempCamera.setFromTransform(cameraObject.transform, camProps);
        }
        
        this.render(scene, tempCamera, true, true, false, totalTime, [], waterUniforms);

        gl.disable(gl.SCISSOR_TEST);
        gl.viewport(0, 0, canvasWidth, canvasHeight);
    }

    public renderCameraGizmo(editorCamera: Camera, sceneCameraObject: Mesh, color: vec3) {
        if (!this.cameraGizmoBuffers) {
            const vertices = [ // 8 corners of a cube
                -1, -1, -1,  1, -1, -1,  1,  1, -1, -1,  1, -1,
                -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
            ];
            const indices = [
                0, 1, 1, 2, 2, 3, 3, 0, // back face
                4, 5, 5, 6, 6, 7, 7, 4, // front face
                0, 4, 1, 5, 2, 6, 3, 7, // connecting lines
            ];
            const colors = new Array(8*4).fill(1);
            this.cameraGizmoBuffers = this.createBuffers({vertices, indices, colors});
        }
        
        const gl = this.gl;
        gl.disable(gl.DEPTH_TEST);
        gl.useProgram(this.shaderProgramInfo.program);
        gl.uniform1i(this.shaderProgramInfo.uniformLocations.isLiquid, 0);
        
        const sp = this.shaderProgramInfo;
        const props = sceneCameraObject.cinematicCameraComponent || sceneCameraObject.cameraComponent;
        if (!props) return;
        
        const invProj = mat4_lib.invert(mat4_lib.create(), mat4_lib.perspective(mat4_lib.create(), props.fov * (Math.PI/180), 16/9, props.nearClip, props.farClip));
        
        let modelMatrix = mat4_lib.clone(sceneCameraObject.transform.worldMatrix);
        mat4_lib.multiply(modelMatrix, modelMatrix, invProj);
        
        gl.uniformMatrix4fv(sp.uniformLocations.projectionMatrix, false, editorCamera.getProjectionMatrix());
        gl.uniformMatrix4fv(sp.uniformLocations.viewMatrix, false, editorCamera.getViewMatrix());
        gl.uniformMatrix4fv(sp.uniformLocations.modelMatrix, false, modelMatrix);

        gl.uniform1i(sp.uniformLocations.useTexture, 0);
        gl.disableVertexAttribArray(sp.attribLocations.texCoord);
        if(sp.attribLocations.vertexNormal >= 0) gl.disableVertexAttribArray(sp.attribLocations.vertexNormal);
        gl.uniform4f(sp.uniformLocations.fallbackColor, color[0], color[1], color[2], 0.7);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.cameraGizmoBuffers.position);
        gl.vertexAttribPointer(sp.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(sp.attribLocations.vertexPosition);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.cameraGizmoBuffers.indices);
        gl.drawElements(gl.LINES, 24, gl.UNSIGNED_SHORT, 0);

        gl.enable(gl.DEPTH_TEST);
    }
}