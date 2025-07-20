




import { Camera } from './Camera';
import { Renderer, WaterGlobalUniforms } from './Renderer';
import { Scene, Mesh } from './Scene';
import { MeshFactory } from './MeshFactory';
import { TerrainFactory } from './TerrainFactory';
import { Transform } from './Transform';
import { EditorObject, PhysicsProperties, MaterialProperties, AudioComponent, TerrainOptions, ComponentKey, LightComponent, ScriptComponent, AnimatorComponent, ParticleEmitterComponent, NavAgentComponent, UIElementComponent, LODGroupComponent, TagComponent, HealthComponent, ForgeScriptProperties, EngineSettings, BehaviorTreeComponent, SceneData, CameraComponent, CinematicCameraComponent, DataAssetComponent, LiquidComponent, vec2, vec3, mat4, vec4 } from '../types';
import { quat } from 'gl-matrix';
import { Physics } from './physics';
import { RtxManager } from './RtxManager';
import { AudioSystem } from './systems/AudioSystem';
import { ScriptingSystem } from './systems/ScriptingSystem';
import { vec3 as vec3_lib, mat4 as mat4_lib, quat as quat_lib, vec4 as vec4_lib } from 'gl-matrix';
import { AssetManager } from './AssetManager';
import { TransformTool } from '../store/editorStore';


type Logger = (message: string, type?: 'log' | 'warn' | 'error') => void;
type Refresher = () => void;
export type CreateableObject = 
    'empty' | 'cube' | 'liquid' | 'skyBox' |
    'directionalLight' | 'pointLight' | 'spotLight' | 'rectLight' | 'skyLight' |
    'particleSystem' | 'skyAtmosphere' | 'volumetricClouds' | 'expHeightFog' | 
    'camera' | 'cinematicCamera' | 
    'audioSource' |
    'postProcessVolume' | 'blockingVolume' | 'triggerVolume' | 'lightmassImportanceVolume' | 'navMeshBoundsVolume';


interface Ripple {
    position: vec2;
    startTime: number;
    strength: number;
}
const MAX_RIPPLES = 100;
const RIPPLE_LIFETIME = 3.0; // in seconds

export interface Particle {
    position: vec3;
    velocity: vec3;
    life: number;
    initialLife: number;
    startSize: number;
    endSize: number;
    startColor: vec4;
    endColor: vec4;
    rotation: number;
    startRotationSpeed: number;
    endRotationSpeed: number;
    texture: string | null;
    spriteSheetCols: number;
    spriteSheetRows: number;
    spriteIndex: number;
    totalSprites: number;
}
const MAX_PARTICLES = 5000;

export class Core {
    private canvas: HTMLCanvasElement;
    private renderer: Renderer;
    public camera: Camera;
    public scene: Scene;
    public assetManager: AssetManager;
    private physics: Physics;
    public audioSystem: AudioSystem;
    private scriptingSystem: ScriptingSystem;
    private rtxManager: RtxManager | null = null;
    public isRtxMode: boolean = false;

    private isPhysicsReady: boolean = false;
    private lastFrameTime: number = 0;
    private totalTime: number = 0;
    private isRunning: boolean = false;
    private animationFrameId: number = 0;
    private logger: Logger;
    private refresher: Refresher;

    public isPlaying: boolean = false;
    public isGridVisible: boolean = true;
    public isPhysicsDebugVisible: boolean = false;
    public isWireframeVisible: boolean = false;
    
    // Gizmo state
    private selectedObjectForGizmo: Mesh | null = null;
    private transformTool: TransformTool = 'select';
    public previewCameraId: string | null = null;

    // Ripple State
    private activeRipples: Ripple[] = [];
    
    // Particle State
    private particles: Particle[] = [];
    private emitterTime: Map<string, number> = new Map();


    constructor(canvas: HTMLCanvasElement, logger: Logger, refresher: Refresher) {
        this.canvas = canvas;
        this.logger = logger;
        this.refresher = refresher;
        this.assetManager = new AssetManager();

        const gl = this.canvas.getContext('webgl');
        if (!gl) {
            this.logger('WebGL not supported', 'error');
            throw new Error('WebGL not supported');
        }

        this.renderer = new Renderer(gl, this.logger, this.assetManager);
        this.scene = new Scene(this.renderer);
        this.camera = new Camera(this.canvas);
        this.audioSystem = new AudioSystem(this.logger);
        this.scriptingSystem = new ScriptingSystem(this.scene);
        
        const onPhysicsReady = () => {
            this.isPhysicsReady = true;
            this.physics.createPhysicsBodies(); // Create bodies for objects created before physics was ready
        };

        const rippleCallback = (position: vec2, strength: number) => {
            if (this.activeRipples.length < MAX_RIPPLES) {
                this.activeRipples.push({ position, strength, startTime: this.totalTime });
            }
        };

        this.physics = new Physics(this.scene, this.renderer, this.audioSystem, this.logger, onPhysicsReady, rippleCallback);
        
        this.createNewScene();
    }
    
    // --- SCENE & OBJECT MANAGEMENT (API for editorStore) ---

    public createNewScene(): void {
        this.stop(); // Stop any running simulation
        this.isPlaying = false;
        
        if (this.isPhysicsReady) this.physics.clearWorld();
        this.scene.clear();
        this.particles = [];
        this.emitterTime.clear();
        
        // Grid
        this.scene.createObject({ name: 'Editor Grid', meshData: MeshFactory.createGrid(100, 100), renderable: true, isSelectable: false, drawMode: 'LINES', type: 'grid' });
        
        // Ground
        this.scene.createObject({ name: 'Ground', type: 'ground', transform: new Transform({ position: [0, -0.05, 0] }), meshData: MeshFactory.createPlane(100, 100, 1, 1), renderable: false, physics: { isStatic: true, mass: 0, friction: 0.5, restitution: 0.5, shape: 'box', linearDamping: 0, angularDamping: 0 } });
        
        // Light
        this.createObject('directionalLight');

        // Cube
        const cubeId = this.createObject('cube');
        const cube = this.scene.getMeshById(cubeId);
        if(cube) cube.transform.position[1] = 1;

        if (this.isPhysicsReady) this.physics.createPhysicsBodies();
        
        this.camera.reset();
        this.refresher();
        this.start();
    }

    public saveScene(): SceneData { return this.scene.serialize(); }
    public loadScene(data: SceneData): void {
        if (this.isPhysicsReady) this.physics.clearWorld();
        this.scene.deserialize(data);
        if (this.isPhysicsReady) this.physics.createPhysicsBodies();
        this.particles = [];
        this.emitterTime.clear();
        this.refresher();
    }

    public getSceneObjects(): EditorObject[] {
        return this.scene.getMeshes().map(mesh => ({
            id: mesh.id, name: mesh.name, type: mesh.type,
            lightType: mesh.light?.type,
            parentId: mesh.transform.parentId,
            childrenIds: mesh.transform.children.map(c => c.meshId),
            terrainData: mesh.terrainData
        }));
    }

    public createObject(type: CreateableObject, parentId?: string | null): string {
        let newId = '';
        const options: any = { name: 'New Object', parentId };
        
        switch (type) {
            case 'empty': options.name = 'Empty Actor'; options.type = 'empty'; options.renderable = false; break;
            case 'cube': options.name = 'Cube'; options.type = 'mesh'; options.meshData = MeshFactory.createCube(); options.physics = { isStatic: false, mass: 1, friction: 0.5, restitution: 0.2, shape: 'box', linearDamping: 0, angularDamping: 0 }; options.material = { albedoTexture: null, tint: [0.8, 0.8, 0.8], tiling: [1, 1], offset: [0, 0], emissive: [0,0,0], metallic: 0, roughness: 0.5 }; break;
            case 'liquid': options.name = 'Liquid Surface'; options.type = 'liquid'; options.meshData = MeshFactory.createPlane(20, 20, 50, 50); options.transform = new Transform({ position: [0, 0.5, 0] }); options.liquid = { waveCount: 4, waves: [ { direction: [0.707, 0.707], frequency: 0.2, amplitude: 0.2, speed: 1.5, steepness: 0.5 }, { direction: [1, 0], frequency: 0.4, amplitude: 0.1, speed: 2.0, steepness: 0.3 }, { direction: [0.5, -0.5], frequency: 0.8, amplitude: 0.05, speed: 1.0, steepness: 0.2 }, { direction: [0, -1], frequency: 1.6, amplitude: 0.025, speed: 3.0, steepness: 0.1 } ], baseColor: [0.1, 0.3, 0.5], deepColor: [0.05, 0.1, 0.2], depthDistance: 10, specularColor: [1, 1, 1], shininess: 150, sssColor: [0.1, 0.4, 0.5], sssPower: 10, foamColor: [0.9, 0.9, 0.9], foamCrestMin: 0.6, foamCrestMax: 0.9, rainEnabled: false, rainRate: 10, rainSplashSize: 0.5, causticsTexture: null, causticsTiling: 10, causticsSpeed: 0.1, causticsBrightness: 0.5 }; break;
            case 'directionalLight': options.name = 'Directional Light'; options.type = 'light'; options.transform = new Transform({ rotation: [-Math.PI / 4, Math.PI / 4, 0] }); options.light = { type: 'directional', color: [1, 1, 1], intensity: 1.0, range: 0, angle: 0 }; options.renderable = false; break;
            case 'pointLight': options.name = 'Point Light'; options.type = 'light'; options.light = { type: 'point', color: [1, 1, 0.8], intensity: 2.0, range: 10, angle: 0 }; options.renderable = false; break;
            case 'spotLight': options.name = 'Spot Light'; options.type = 'light'; options.light = { type: 'spot', color: [1, 1, 1], intensity: 5.0, range: 20, angle: 30 }; options.renderable = false; break;
            case 'camera': options.name = 'Camera Actor'; options.type = 'camera'; options.cameraComponent = { fov: 60, nearClip: 0.1, farClip: 1000, projection: 'perspective', isMainCamera: false }; options.renderable = false; break;
            case 'cinematicCamera': options.name = 'Cinematic Camera'; options.type = 'cinematicCamera'; options.cinematicCameraComponent = { fov: 35, nearClip: 0.1, farClip: 1000, projection: 'perspective', isMainCamera: false, focalLength: 50, aperture: 2.8, focusDistance: 10 }; options.renderable = false; break;
            case 'particleSystem': 
                options.name = 'Smoke Emitter'; 
                options.type = 'particleEmitter'; 
                options.renderable = false;
                options.particleEmitter = {
                    rate: 50,
                    enabled: true,
                    lifetime: [2, 4],
                    gravity: [0, 0.5, 0],
                    speed: [0.5, 1.0],
                    spread: 30,
                    texture: 'https://picsum.photos/seed/smoke_texture/512',
                    spriteSheetCols: 8,
                    spriteSheetRows: 8,
                    startSize: [0.1, 0.3],
                    endSize: [1.0, 2.0],
                    startColor: [1, 1, 1, 0.5],
                    endColor: [1, 1, 1, 0],
                    startRotationSpeed: [-15, 15],
                    endRotationSpeed: [-30, 30],
                };
                break;
            default: options.name = 'Empty Actor'; options.type = 'empty'; options.renderable = false; break;
        }

        newId = this.scene.createObject(options);
        const newMesh = this.scene.getMeshById(newId);
        if (newMesh && newMesh.physics) {
            this.physics.createRigidBodyForMesh(newMesh);
        }
        return newId;
    }

    public createTerrain(options: TerrainOptions): string {
        // Remove default ground plane if it exists
        const ground = this.scene.getMeshes().find(m => m.name === 'Ground');
        if (ground) {
            this.deleteObjects([ground.id]);
        }
    
        const terrainData = TerrainFactory.createTerrain(options);
        const terrainId = this.scene.createObject({
            name: `Terrain_${options.seed}`,
            type: 'terrain',
            meshData: terrainData,
            terrainData: { width: options.width, depth: options.depth },
            physics: { isStatic: true, mass: 0, friction: 0.8, restitution: 0.1, shape: 'terrain', linearDamping: 0, angularDamping: 0 },
            material: {
                albedoTexture: null,
                tint: [1, 1, 1],
                tiling: [1, 1],
                offset: [0, 0],
                emissive: [0, 0, 0],
                metallic: 0.1,
                roughness: 0.9,
                terrainTextures: {
                    grass: options.materials.grassTexture,
                    rock: options.materials.rockTexture,
                    snow: options.materials.snowTexture,
                    sand: options.materials.sandTexture,
                },
            }
        });
        const newMesh = this.scene.getMeshById(terrainId);
        if (newMesh) this.physics.createRigidBodyForMesh(newMesh);
        
        // Create water plane
        // First, remove any existing water surface to avoid duplicates
        const existingWater = this.scene.getMeshes().find(m => m.type === 'liquid');
        if (existingWater) {
            this.deleteObjects([existingWater.id]);
        }
    
        const liquidId = this.createObject('liquid');
        const liquidMesh = this.scene.getMeshById(liquidId);
        if (liquidMesh) {
            liquidMesh.name = "Water Surface";
            liquidMesh.transform.position[1] = options.waterLevel;
            const liquidSize = Math.max(options.width, options.depth);
            const basePlaneSize = 20; // Default size of liquid plane mesh
            liquidMesh.transform.scale = [liquidSize / basePlaneSize * 1.5, 1, liquidSize / basePlaneSize * 1.5];
            liquidMesh.transform.isDirty = true;
            this.scene.updateWorldTransforms();
        }
        
        return terrainId;
    }

    public deleteObjects(ids: string[]): void {
        ids.forEach(id => {
            const mesh = this.scene.getMeshById(id);
            if (mesh) {
                this.physics.removeBody(mesh);
                this.scene.removeObject(id);
            }
        });
    }

    public duplicateObjects(ids: string[]): string[] {
        const newIds = this.scene.duplicateObjects(ids);
        newIds.forEach(id => {
            const mesh = this.scene.getMeshById(id);
            if (mesh && mesh.physics) this.physics.createRigidBodyForMesh(mesh);
        });
        return newIds;
    }
    
    public groupObjects(ids: string[]): string {
        const newParentId = this.scene.createObject({ name: 'Group', type: 'empty', renderable: false });
        this.reparentObjects(ids, newParentId);
        return newParentId;
    }

    public reparentObjects(draggedIds: string[], newParentId: string | null): void {
        this.scene.reparentObjects(draggedIds, newParentId);
        draggedIds.forEach(id => {
            const mesh = this.scene.getMeshById(id);
            if (mesh && mesh.physicsBody) this.physics.recreateRigidBody(mesh);
        });
    }
    public renameObject(id: string, newName: string): void { this.scene.renameObject(id, newName); }
    public focusOn(id: string): void {
        const mesh = this.scene.getMeshById(id);
        if (mesh) this.camera.focus(mesh.transform.getWorldPosition());
    }

    // --- COMPONENT MANAGEMENT ---
    
    public addComponent(id: string, type: ComponentKey): void {
        const mesh = this.scene.getMeshById(id);
        if (!mesh || mesh[type]) return;
        switch(type) {
            case 'physics': mesh.physics = { isStatic: false, mass: 1, friction: 0.5, restitution: 0.2, shape: 'box', linearDamping: 0, angularDamping: 0, buoyancy: 1.5 }; this.physics.createRigidBodyForMesh(mesh); break;
            case 'material': mesh.material = { albedoTexture: null, tint: [0.8, 0.8, 0.8], tiling: [1, 1], offset: [0, 0], emissive: [0,0,0], metallic: 0, roughness: 0.5 }; break;
            case 'audio': mesh.audio = { soundName: 'default_thud', volume: 1.0, loop: false }; break;
            case 'light': mesh.light = { type: 'point', color: [1,1,1], intensity: 1, range: 10, angle: 30 }; break;
            case 'forgeScript': mesh.forgeScript = { scriptId: null }; break;
            case 'tag': mesh.tag = { tags: [] }; break;
            case 'health': mesh.health = { currentHealth: 100, maxHealth: 100 }; break;
            case 'dataAsset': mesh.dataAsset = { assetIds: [] }; break;
            case 'liquid': mesh.liquid = { waveCount: 4, waves: [ { direction: [0.707, 0.707], frequency: 0.2, amplitude: 0.2, speed: 1.5, steepness: 0.5 }, { direction: [1, 0], frequency: 0.4, amplitude: 0.1, speed: 2.0, steepness: 0.3 }, { direction: [0.5, -0.5], frequency: 0.8, amplitude: 0.05, speed: 1.0, steepness: 0.2 }, { direction: [0, -1], frequency: 1.6, amplitude: 0.025, speed: 3.0, steepness: 0.1 } ], baseColor: [0.1, 0.3, 0.5], deepColor: [0.05, 0.1, 0.2], depthDistance: 10, specularColor: [1, 1, 1], shininess: 150, sssColor: [0.1, 0.4, 0.5], sssPower: 10, foamColor: [0.9, 0.9, 0.9], foamCrestMin: 0.6, foamCrestMax: 0.9, rainEnabled: false, rainRate: 10, rainSplashSize: 0.5, causticsTexture: null, causticsTiling: 10, causticsSpeed: 0.1, causticsBrightness: 0.5 }; break;
        }
    }
    public removeComponent(id: string, type: ComponentKey): void {
        const mesh = this.scene.getMeshById(id);
        if (!mesh) return;
        if (type === 'physics') this.physics.removeBody(mesh);
        delete (mesh as any)[type];
    }

    public updateTransform(id: string, newTransform: { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }) {
        const mesh = this.scene.getMeshById(id);
        if (mesh) {
            mesh.transform.position = newTransform.position as vec3;
            mesh.transform.rotation = newTransform.rotation.map(deg => deg * Math.PI / 180) as vec3;
            mesh.transform.scale = newTransform.scale as vec3;
            mesh.transform.isDirty = true;
            this.scene.updateWorldTransforms();
            if (mesh.physicsBody) this.physics.resetBody(mesh);
        }
    }
    
    public updateMaterialProperties(id: string, props: Partial<MaterialProperties>) { const mesh = this.scene.getMeshById(id); if (mesh?.material) mesh.material = { ...mesh.material, ...props }; }
    public updatePhysicsProperties(id: string, props: Partial<PhysicsProperties>) { const mesh = this.scene.getMeshById(id); if (mesh?.physics) { const oldShape = mesh.physics.shape; mesh.physics = { ...mesh.physics, ...props }; if(props.shape && props.shape !== oldShape) { this.physics.recreateRigidBody(mesh); } else { this.physics.updatePhysicsProperties(mesh); } } }
    public updateAudioProperties(id: string, props: Partial<AudioComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.audio) mesh.audio = { ...mesh.audio, ...props }; this.audioSystem.updateSourceProperties(mesh!); }
    public updateLightProperties(id: string, props: Partial<LightComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.light) mesh.light = { ...mesh.light, ...props }; }
    public updateLiquidProperties(id: string, props: Partial<LiquidComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.liquid) mesh.liquid = { ...mesh.liquid, ...props }; }
    public updateScriptProperties(id: string, props: Partial<ScriptComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.script) mesh.script = { ...mesh.script, properties: { ...mesh.script.properties, ...props.properties } }; }
    public updateForgeScriptProperties(id: string, props: Partial<ForgeScriptProperties>) { const mesh = this.scene.getMeshById(id); if (mesh?.forgeScript) mesh.forgeScript = { ...mesh.forgeScript, ...props }; }
    public updateAnimatorProperties(id: string, props: Partial<AnimatorComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.animator) mesh.animator = { ...mesh.animator, ...props }; }
    public updateParticleEmitterProperties(id: string, props: Partial<ParticleEmitterComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.particleEmitter) mesh.particleEmitter = { ...mesh.particleEmitter, ...props }; }
    public updateNavAgentProperties(id: string, props: Partial<NavAgentComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.navAgent) mesh.navAgent = { ...mesh.navAgent, ...props }; }
    public updateUIElementProperties(id: string, props: Partial<UIElementComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.uiElement) mesh.uiElement = { ...mesh.uiElement, ...props }; }
    public updateLODGroupProperties(id: string, props: Partial<LODGroupComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.lodGroup) mesh.lodGroup = { ...mesh.lodGroup, ...props }; }
    public updateTagProperties(id: string, props: Partial<TagComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.tag) mesh.tag = { ...mesh.tag, ...props }; }
    public updateHealthProperties(id: string, props: Partial<HealthComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.health) mesh.health = { ...mesh.health, ...props }; }
    public updateBehaviorTreeProperties(id: string, props: Partial<BehaviorTreeComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.behaviorTree) mesh.behaviorTree = { ...mesh.behaviorTree, ...props }; }
    public updateDataAssetProperties(id: string, props: Partial<DataAssetComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.dataAsset) mesh.dataAsset = { ...mesh.dataAsset, ...props }; }
    public updateCameraProperties(id: string, props: Partial<CameraComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.cameraComponent) mesh.cameraComponent = { ...mesh.cameraComponent, ...props }; }
    public updateCinematicCameraProperties(id: string, props: Partial<CinematicCameraComponent>) { const mesh = this.scene.getMeshById(id); if (mesh?.cinematicCameraComponent) mesh.cinematicCameraComponent = { ...mesh.cinematicCameraComponent, ...props }; }

    // --- SCRIPTING ---
    public getAvailableScripts(): string[] { return this.scriptingSystem.getAvailableScripts(); }
    public getScriptProperties(name: string) { return this.scriptingSystem.getScriptProperties(name); }

    // --- SETTINGS ---
    public updateEngineSettings(settings: EngineSettings) {
        if(this.physics.isReady()) this.physics.setGravity(settings.physics.gravity);
        this.audioSystem.setMasterVolume(settings.audio.masterVolume);
    }

    // --- LIFECYCLE & PLAYBACK ---
    public play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.scene.saveInitialTransforms();
            this.scriptingSystem.start();
            this.audioSystem.resumeContext();
        }
    }
    public pause() {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.scriptingSystem.stop();
            this.scene.restoreInitialTransforms();
            this.physics.resetStates();
            this.audioSystem.stopAll();
            this.particles = [];
            this.emitterTime.clear();
        }
    }
    
    // --- RTX ---
    public async toggleRtxMode(): Promise<void> {
        this.pause();
        if (this.isRtxMode) {
            this.isRtxMode = false;
            this.rtxManager?.destroy();
            this.rtxManager = null;
            this.logger('RTX Mode Disabled');
        } else {
            this.isRtxMode = true;
            this.logger('Enabling RTX Mode...');
            try {
                this.rtxManager = new RtxManager(this.canvas, this.camera, this.scene, this.logger);
                await this.rtxManager.initialize();
                this.logger('RTX Mode Enabled');
            } catch(e) {
                this.logger(`RTX initialization failed: ${(e as Error).message}`, 'error');
                this.isRtxMode = false;
                this.rtxManager = null;
            }
        }
    }

    private updateParticles(deltaTime: number): void {
        // 1. Update existing particles
        this.particles = this.particles.filter(p => {
            p.life -= deltaTime;
            if (p.life <= 0) return false;
    
            vec3_lib.scaleAndAdd(p.position, p.position, p.velocity, deltaTime);
            
            const lifeT = 1.0 - (p.life / p.initialLife);
            const rotationSpeed = p.startRotationSpeed + (p.endRotationSpeed - p.startRotationSpeed) * lifeT;
            p.rotation += rotationSpeed * deltaTime * (Math.PI / 180);
    
            if (p.totalSprites > 1) {
                p.spriteIndex = Math.floor(lifeT * p.totalSprites);
            }
    
            return true;
        });
    
        // 2. Spawn new particles
        const emitters = this.scene.getMeshes().filter(m => m.particleEmitter);
        for (const emitter of emitters) {
            const props = emitter.particleEmitter;
            if (!props || !props.enabled) continue;
    
            const timeSinceLastSpawn = (this.emitterTime.get(emitter.id) || 0) + deltaTime;
            const spawnInterval = 1.0 / props.rate;
            let particlesToSpawn = Math.floor(timeSinceLastSpawn / spawnInterval);
            if (particlesToSpawn > 0) {
                 this.emitterTime.set(emitter.id, timeSinceLastSpawn - (particlesToSpawn * spawnInterval));
            }
    
            const emitterPos = emitter.transform.getWorldPosition();
    
            for (let i = 0; i < particlesToSpawn; i++) {
                if (this.particles.length >= MAX_PARTICLES) break;
    
                const lifetime = props.lifetime[0] + Math.random() * (props.lifetime[1] - props.lifetime[0]);
                const speed = props.speed[0] + Math.random() * (props.speed[1] - props.speed[0]);
                
                const spreadRad = props.spread * (Math.PI / 180);
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos(1 - Math.random() * (1 - Math.cos(spreadRad / 2)));
                let dir = vec3_lib.fromValues(
                    Math.sin(phi) * Math.cos(theta),
                    Math.cos(phi),
                    Math.sin(phi) * Math.sin(theta)
                );
                
                // Get emitter rotation and apply it to the direction
                const emitterRotation = mat4_lib.getRotation(quat_lib.create(), emitter.transform.worldMatrix);
                vec3_lib.transformQuat(dir, dir, emitterRotation);

                const particle: Particle = {
                    position: vec3_lib.clone(emitterPos),
                    velocity: vec3_lib.add(vec3_lib.create(), vec3_lib.scale(vec3_lib.create(), dir, speed), vec3_lib.scale(vec3_lib.create(), props.gravity, deltaTime)),
                    life: lifetime,
                    initialLife: lifetime,
                    startSize: props.startSize[0] + Math.random() * (props.startSize[1] - props.startSize[0]),
                    endSize: props.endSize[0] + Math.random() * (props.endSize[1] - props.endSize[0]),
                    startColor: props.startColor,
                    endColor: props.endColor,
                    rotation: Math.random() * 360,
                    startRotationSpeed: props.startRotationSpeed[0] + Math.random() * (props.startRotationSpeed[1] - props.startRotationSpeed[0]),
                    endRotationSpeed: props.endRotationSpeed[0] + Math.random() * (props.endRotationSpeed[1] - props.endRotationSpeed[0]),
                    texture: props.texture,
                    spriteSheetCols: props.spriteSheetCols,
                    spriteSheetRows: props.spriteSheetRows,
                    spriteIndex: 0,
                    totalSprites: props.spriteSheetCols * props.spriteSheetRows,
                };
    
                this.particles.push(particle);
            }
        }
    }


    // --- RENDERING & MAIN LOOP ---
    private renderLoop(time: number): void {
        if (!this.isRunning) return;
        
        const deltaTime = (time - this.lastFrameTime) / 1000;
        this.lastFrameTime = time;
        this.totalTime += deltaTime;
        
        this.activeRipples = this.activeRipples.filter(r => (this.totalTime - r.startTime) < RIPPLE_LIFETIME);

        if (this.isPlaying) {
            if (this.isPhysicsReady) this.physics.step(deltaTime, this.totalTime);
            this.scriptingSystem.update(deltaTime);
            this.updateParticles(deltaTime);
            this.scene.getMeshes().forEach(mesh => {
                if (mesh.physics && !mesh.physics.isStatic) this.physics.updateMeshTransform(mesh);
                if (mesh.audio) this.audioSystem.updateSourcePosition(mesh);
            });
            this.scene.updateWorldTransforms();
        }
        this.audioSystem.updateListener(this.camera.position);

        if (this.isRtxMode && this.rtxManager) {
            this.rtxManager.render();
        } else {
            // Find active liquid for global uniforms
            const liquid = this.scene.getMeshes().find(m => m.liquid)?.liquid;
            let waterGlobalUniforms: WaterGlobalUniforms | undefined = undefined;
            if (liquid) {
                const waterHeight = this.scene.getMeshes().find(m => m.liquid)?.transform.position[1] ?? 0;
                waterGlobalUniforms = {
                    ...liquid,
                    isUnderwater: this.camera.position[1] < waterHeight,
                    waterHeight: waterHeight,
                };
            }

            const renderCameraObject = this.previewCameraId ? this.scene.getMeshById(this.previewCameraId) : null;
            let activeCamera = this.camera;
            if (renderCameraObject) {
                const tempCam = new Camera(this.canvas);
                const camProps = renderCameraObject.cinematicCameraComponent || renderCameraObject.cameraComponent;
                if (camProps) {
                    tempCam.setFromTransform(renderCameraObject.transform, camProps);
                    activeCamera = tempCam;
                }
            }

            this.renderer.render(this.scene, activeCamera, this.isPlaying, this.isGridVisible, this.isWireframeVisible, this.totalTime, this.activeRipples, waterGlobalUniforms);
            if (this.particles.length > 0) this.renderer.renderParticles(this.camera, this.particles);
            if (this.isPhysicsDebugVisible) this.renderer.renderDebugLines(this.camera, this.physics.debugDraw());
            if (this.selectedObjectForGizmo) this.renderer.renderGizmo(this.camera, this.selectedObjectForGizmo, this.transformTool);
            
            // Render all camera gizmos and previews
            this.scene.getMeshes().filter(m => m.type === 'camera' || m.type === 'cinematicCamera').forEach(camObj => {
                 this.renderer.renderCameraGizmo(this.camera, camObj, this.previewCameraId === camObj.id ? [0.1, 1, 0.1] : [1, 1, 1]);
                 if (this.previewCameraId === camObj.id && camObj.id !== this.selectedObjectForGizmo?.id) { // Don't render preview of itself
                     this.renderer.renderPreview(this.scene, camObj, this.isPlaying, this.isGridVisible, this.isWireframeVisible, this.totalTime, waterGlobalUniforms);
                 }
            });
        }
        this.animationFrameId = requestAnimationFrame(this.renderLoop.bind(this));
    }
    
    // --- CORE API ---
    public start(): void { if (!this.isRunning) { this.isRunning = true; this.lastFrameTime = performance.now(); this.animationFrameId = requestAnimationFrame(this.renderLoop.bind(this)); } }
    public stop(): void { if (this.isRunning) { this.isRunning = false; cancelAnimationFrame(this.animationFrameId); } }
    public getObjectById(id: string): Mesh | undefined { return this.scene.getMeshById(id); }
    public setTransformTool(tool: TransformTool): void { this.transformTool = tool; this.renderer.setGizmoActiveAxis(null); }
    public setSelectedObject(id: string | null): void { this.selectedObjectForGizmo = id ? this.scene.getMeshById(id) || null : null; this.renderer.setGizmoActiveAxis(null); }
    public setGridVisibility(visible: boolean) { this.isGridVisible = visible; }
    public setPhysicsDebugVisibility(visible: boolean) { this.isPhysicsDebugVisible = visible; this.physics.setDebugMode(visible); }
    public setWireframeVisibility(visible: boolean) { this.isWireframeVisible = visible; }

    // --- GIZMO & SELECTION ---
    private getRayFromMouse(x: number, y: number): { origin: vec3, dir: vec3 } { const rect = this.canvas.getBoundingClientRect(); const normalizedX = (x - rect.left) / rect.width * 2 - 1; const normalizedY = -((y - rect.top) / rect.height * 2 - 1); const invProj = mat4_lib.create(); mat4_lib.invert(invProj, this.camera.getProjectionMatrix()); const invView = mat4_lib.create(); mat4_lib.invert(invView, this.camera.getViewMatrix()); const clipCoords = vec4_lib.fromValues(normalizedX, normalizedY, -1.0, 1.0); let eyeCoords = vec4_lib.create(); vec4_lib.transformMat4(eyeCoords, clipCoords, invProj); eyeCoords[2] = -1.0; eyeCoords[3] = 0.0; let worldCoords = vec4_lib.create(); vec4_lib.transformMat4(worldCoords, eyeCoords, invView); const rayDir = vec3_lib.fromValues(worldCoords[0], worldCoords[1], worldCoords[2]); vec3_lib.normalize(rayDir, rayDir); return { origin: this.camera.position, dir: rayDir }; }
    private getMeshBounds(mesh: Mesh): { min: vec3, max: vec3 } | null { if (!mesh.meshData || mesh.meshData.vertices.length === 0) return null; const min: vec3 = [Infinity, Infinity, Infinity]; const max: vec3 = [-Infinity, -Infinity, -Infinity]; const vertices = mesh.meshData.vertices; for (let i = 0; i < vertices.length; i += 3) { min[0] = Math.min(min[0], vertices[i]); min[1] = Math.min(min[1], vertices[i+1]); min[2] = Math.min(min[2], vertices[i+2]); max[0] = Math.max(max[0], vertices[i]); max[1] = Math.max(max[1], vertices[i+1]); max[2] = Math.max(max[2], vertices[i+2]); } const corners = [ [min[0], min[1], min[2]], [max[0], min[1], min[2]], [min[0], max[1], min[2]], [min[0], min[1], max[2]], [max[0], max[1], min[2]], [max[0], min[1], max[2]], [min[0], max[1], max[2]], [max[0], max[1], max[2]], ]; const worldMin: vec3 = [Infinity, Infinity, Infinity]; const worldMax: vec3 = [-Infinity, -Infinity, -Infinity]; const modelMatrix = mesh.transform.getModelMatrix(); for (const corner of corners) { const transformedCorner = vec3_lib.create(); vec3_lib.transformMat4(transformedCorner, corner as vec3, modelMatrix); vec3_lib.min(worldMin, worldMin, transformedCorner); vec3_lib.max(worldMax, worldMax, transformedCorner); } return { min: worldMin, max: worldMax }; }
    private rayAABBIntersection(origin: vec3, dir: vec3, min: vec3, max: vec3): number { const invDir: vec3 = [1 / dir[0], 1 / dir[1], 1 / dir[2]]; let tmin = (min[0] - origin[0]) * invDir[0]; let tmax = (max[0] - origin[0]) * invDir[0]; if (tmin > tmax) [tmin, tmax] = [tmax, tmin]; let tymin = (min[1] - origin[1]) * invDir[1]; let tymax = (max[1] - origin[1]) * invDir[1]; if (tymin > tymax) [tymin, tymax] = [tymax, tymin]; if ((tmin > tymax) || (tymin > tmax)) return Infinity; if (tymin > tmin) tmin = tymin; if (tymax < tmax) tmax = tymax; let tzmin = (min[2] - origin[2]) * invDir[2]; let tzmax = (max[2] - origin[2]) * invDir[2]; if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin]; if ((tmin > tzmax) || (tzmin > tmax)) return Infinity; if (tzmin > tmin) tmin = tzmin; return tmin > 0 ? tmin : Infinity; }
    public selectObjectAt(x: number, y: number): string | null { const { origin, dir } = this.getRayFromMouse(x, y); let closestHit: { id: string, t: number } | null = null; for (const mesh of this.scene.getMeshes()) { if (!mesh.isSelectable || mesh.type === 'grid') continue; const bounds = this.getMeshBounds(mesh); if (!bounds) continue; const t = this.rayAABBIntersection(origin, dir, bounds.min, bounds.max); if (t !== Infinity && (!closestHit || t < closestHit.t)) { closestHit = { id: mesh.id, t: t }; } } return closestHit?.id ?? null; }
    public onGizmoMouseDown(x: number, y: number): boolean { if (!this.selectedObjectForGizmo) return false; const { origin, dir } = this.getRayFromMouse(x, y); return this.renderer.startGizmoDrag(this.selectedObjectForGizmo, origin, dir, this.camera, this.transformTool, x, y); }
    public onGizmoMouseMove(x: number, y: number) { const { origin, dir } = this.getRayFromMouse(x, y); const result = this.renderer.updateGizmoDrag(origin, dir, x, y); if (result && this.selectedObjectForGizmo) { if (result.position) { this.selectedObjectForGizmo.transform.position = result.position; } if (result.rotation) { const axis = result.rotation.axis; const angle = result.rotation.angle; if(axis === 'x') this.selectedObjectForGizmo.transform.rotation[0] += angle; if(axis === 'y') this.selectedObjectForGizmo.transform.rotation[1] += angle; if(axis === 'z') this.selectedObjectForGizmo.transform.rotation[2] += angle; } if (result.scale) { this.selectedObjectForGizmo.transform.scale = result.scale; } this.selectedObjectForGizmo.transform.isDirty = true; this.scene.updateWorldTransforms(); if(this.selectedObjectForGizmo.physicsBody) this.physics.resetBody(this.selectedObjectForGizmo); this.refresher(); } else if (!this.renderer.isGizmoDragging) { if (this.selectedObjectForGizmo) { this.renderer.checkGizmoIntersection(this.selectedObjectForGizmo, origin, dir, this.camera, this.transformTool); } } }
    public onGizmoMouseUp() { this.renderer.endGizmoDrag(); }
    
    // --- DEBUG STATS API ---
    public getSceneStats() {
        const componentCounts: Record<string, number> = {};
        const meshes = this.scene.getMeshes();
        for (const mesh of meshes) {
            if (mesh.physics) componentCounts['Physics'] = (componentCounts['Physics'] || 0) + 1;
            if (mesh.material) componentCounts['Material'] = (componentCounts['Material'] || 0) + 1;
            if (mesh.audio) componentCounts['Audio'] = (componentCounts['Audio'] || 0) + 1;
            if (mesh.light) componentCounts['Light'] = (componentCounts['Light'] || 0) + 1;
            if (mesh.script) componentCounts['Script'] = (componentCounts['Script'] || 0) + 1;
            if (mesh.forgeScript) componentCounts['ForgeScript'] = (componentCounts['ForgeScript'] || 0) + 1;
            if (mesh.liquid) componentCounts['Liquid'] = (componentCounts['Liquid'] || 0) + 1;
        }
        return {
            entityCount: meshes.length,
            componentCounts,
            activeParticles: this.particles.length,
        };
    }

    public getRendererStats() {
        const meshes = this.scene.getMeshes().filter(m => m.renderable);
        let triangleCount = 0;
        for (const mesh of meshes) {
            triangleCount += (mesh.meshData?.indices?.length || 0) / 3;
        }
        return {
            drawCalls: meshes.length + (this.particles.length > 0 ? 1 : 0), // Approximation
            triangleCount: Math.floor(triangleCount),
        };
    }

    public getPhysicsStats() {
        if (!this.physics.isReady()) return { activeBodies: 0, gravity: [0,0,0] as vec3 };
        const gravity = this.physics.getGravity();
        const activeBodies = this.scene.getMeshes().filter(m => m.physicsBody && m.physicsBody.isActive()).length;
        return {
            activeBodies,
            gravity,
        };
    }

    public getMemoryStats() {
        const meshes = this.scene.getMeshes();
        let geometryMemory = 0;
        for (const mesh of meshes) {
            geometryMemory += (mesh.meshData?.vertices?.length || 0) * 4; // float32
            geometryMemory += (mesh.meshData?.indices?.length || 0) * 2; // uint16
        }
        const textureCount = this.assetManager.getCacheSize();
        // A rough approximation of 512x512 RGBA textures
        const textureMemory = textureCount * 512 * 512 * 4; 
        return {
            textureMemory,
            geometryMemory
        };
    }
}