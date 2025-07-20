






export interface LiquidWave {
    direction: vec2;
    frequency: number;
    amplitude: number;
    speed: number;
    steepness: number;
}

export interface LiquidComponent {
    waveCount: number;
    waves: [LiquidWave, LiquidWave, LiquidWave, LiquidWave];
    // Color & Depth
    baseColor: vec3;
    deepColor: vec3;
    depthDistance: number;
    // Lighting
    specularColor: vec3;
    shininess: number;
    // Subsurface Scattering
    sssColor: vec3;
    sssPower: number;
    // Foam
    foamColor: vec3;
    foamCrestMin: number;
    foamCrestMax: number;
    // Rain
    rainEnabled: boolean;
    rainRate: number; // drops per second
    rainSplashSize: number;
    // Caustics
    causticsTexture: string | null;
    causticsTiling: number;
    causticsSpeed: number;
    causticsBrightness: number;
}


export interface SerializedTransform {
    position: vec3;
    rotation: vec3; // Euler angles in radians
    scale: vec3;
    parentId: string | null;
}

export interface CameraComponent {
    fov: number; // in degrees
    nearClip: number;
    farClip: number;
    projection: 'perspective' | 'orthographic';
    isMainCamera: boolean;
}

export interface CinematicCameraComponent extends CameraComponent {
    focalLength: number;
    aperture: number; // f-stop
    focusDistance: number;
}

export interface SerializedObject {
    id: string;
    name: string;
    type: 'camera' | 'mesh' | 'grid' | 'ground' | 'empty' | 'terrain' | 'light' | 'particleEmitter' | 'cinematicCamera' | 'liquid';
    transform: SerializedTransform;
    
    // Components
    physics?: PhysicsProperties;
    material?: MaterialProperties;
    audio?: AudioComponent;
    light?: LightComponent;
    script?: ScriptComponent;
    forgeScript?: ForgeScriptProperties;
    animator?: AnimatorComponent;
    particleEmitter?: ParticleEmitterComponent;
    navAgent?: NavAgentComponent;
    uiElement?: UIElementComponent;
    lodGroup?: LODGroupComponent;
    tag?: TagComponent;
    health?: HealthComponent;
    behaviorTree?: BehaviorTreeComponent;
    cameraComponent?: CameraComponent;
    cinematicCameraComponent?: CinematicCameraComponent;
    dataAsset?: DataAssetComponent;
    liquid?: LiquidComponent;
    
    // Specific data
    meshData?: MeshData; // For procedural objects like terrain
    terrainData?: {
        width: number;
        depth: number;
    }
}

export interface SceneData {
    version: string;
    objects: SerializedObject[];
}


declare global {
    // WebGPU dummy types to allow compilation without @webgpu/types
    type GPUDevice = any;
    type GPUCanvasContext = {
        configure(options: {
            device: GPUDevice;
            format: GPUTextureFormat;
            alphaMode?: 'opaque' | 'premultiplied';
        }): void;
        getCurrentTexture(): GPUTexture;
    };
    type GPUTextureFormat = any;
    type GPUBuffer = any;
    type GPUTexture = any;
    type GPUComputePipeline = any;
    type GPURenderPipeline = any;
    type GPUBindGroup = any;
    type GPUShaderStage = any;
    type GPURenderPassDescriptor = any;
    var GPUBufferUsage: { [key: string]: number };
    var GPUTextureUsage: { [key: string]: number };
    var GPUShaderStage: { [key: string]: number };
    interface Navigator {
        gpu: any;
    }
    interface HTMLCanvasElement {
        getContext(contextId: 'webgpu'): GPUCanvasContext | null;
    }
}

export type vec2 = [number, number] | Float32Array;
export type vec3 = [number, number, number] | Float32Array;
export type vec4 = [number, number, number, number] | Float32Array;
export type mat4 = [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number
] | Float32Array;

export interface ForgeScriptProperties {
    scriptId: string | null;
}

export type ComponentKey = 'material' | 'physics' | 'audio' | 'light' | 'script' | 'animator' | 'particleEmitter' | 'navAgent' | 'uiElement' | 'lodGroup' | 'tag' | 'health' | 'forgeScript' | 'behaviorTree' | 'camera' | 'cinematicCamera' | 'dataAsset' | 'liquid';

export interface ShaderProgramInfo {
    program: WebGLProgram;
    attribLocations: {
        vertexPosition: number;
        vertexColor: number;
        texCoord: number;
        vertexNormal: number;
    };
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation | null;
        viewMatrix: WebGLUniformLocation | null;
        modelMatrix: WebGLUniformLocation | null;
        useTexture: WebGLUniformLocation | null;
        albedoTexture: WebGLUniformLocation | null;
        tint: WebGLUniformLocation | null;
        emissive: WebGLUniformLocation | null;
        fallbackColor: WebGLUniformLocation | null;
        tiling: WebGLUniformLocation | null;
        offset: WebGLUniformLocation | null;
        time: WebGLUniformLocation | null;
        cameraPos: WebGLUniformLocation | null;
        
        // Lighting
        lightPos: WebGLUniformLocation | null;
        lightColor: WebGLUniformLocation | null;

        // Liquid uniforms
        isLiquid: WebGLUniformLocation | null;
        liquidBaseColor: WebGLUniformLocation | null;
        liquidDeepColor: WebGLUniformLocation | null;
        liquidDepthDistance: WebGLUniformLocation | null;
        liquidSpecularColor: WebGLUniformLocation | null;
        liquidShininess: WebGLUniformLocation | null;
        liquidSssColor: WebGLUniformLocation | null;
        liquidSssPower: WebGLUniformLocation | null;
        foamColor: WebGLUniformLocation | null;
        foamCrestMin: WebGLUniformLocation | null;
        foamCrestMax: WebGLUniformLocation | null;
        waves: {
            direction: WebGLUniformLocation | null;
            frequency: WebGLUniformLocation | null;
            amplitude: WebGLUniformLocation | null;
            speed: WebGLUniformLocation | null;
            steepness: WebGLUniformLocation | null;
        }[];
        ripples: WebGLUniformLocation | null;
        rippleCount: WebGLUniformLocation | null;

        // Terrain Uniforms
        isTerrain: WebGLUniformLocation | null;
        grassTexture: WebGLUniformLocation | null;
        rockTexture: WebGLUniformLocation | null;
        snowTexture: WebGLUniformLocation | null;
        sandTexture: WebGLUniformLocation | null;

        // Underwater / Caustics uniforms (global for all shaders)
        isUnderwater: WebGLUniformLocation | null;
        waterHeight: WebGLUniformLocation | null;
        causticsTexture: WebGLUniformLocation | null;
        causticsTiling: WebGLUniformLocation | null;
        causticsSpeed: WebGLUniformLocation | null;
        causticsBrightness: WebGLUniformLocation | null;
    };
}

export interface Buffers {
    position: WebGLBuffer;
    color: WebGLBuffer;
    indices: WebGLBuffer;
    texCoord: WebGLBuffer | null;
    normal: WebGLBuffer | null;
    wireframeIndices?: WebGLBuffer | null;
    wireframeIndexCount?: number;
}

export interface MeshData {
    vertices: number[];
    colors: number[];
    indices: number[];
    texCoords?: number[];
    normals?: number[];
}

export interface MaterialProperties {
    albedoTexture: string | null;
    tint: vec3;
    tiling: vec2;
    offset: vec2;
    emissive: vec3;
    metallic: number;
    roughness: number;
    terrainTextures?: {
        grass: string | null;
        rock: string | null;
        snow: string | null;
        sand: string | null;
    }
}

export interface PhysicsProperties {
    isStatic: boolean;
    mass: number;
    friction: number;
    restitution: number;
    linearDamping: number;
    angularDamping: number;
    shape: 'box' | 'sphere' | 'terrain' | 'capsule' | 'cylinder' | 'convexHull';
    buoyancy?: number;
}

export interface AudioComponent {
    soundName: string;
    volume: number;
    loop: boolean;
}

export interface LightComponent {
    type: 'directional' | 'point' | 'spot';
    color: vec3;
    intensity: number;
    range: number;
    angle: number;
}

export interface ScriptComponent {
    scriptName: string;
    properties: Record<string, any>;
}

export interface AnimatorComponent {
    animationClip: string;
    speed: number;
    loop: boolean;
}

export interface ParticleEmitterComponent {
    // Emission
    rate: number; // particles per second
    enabled: boolean;
    // Particle Lifetime
    lifetime: vec2; // min, max
    // Physics
    gravity: vec3;
    speed: vec2; // min, max initial speed
    spread: number; // emission cone angle in degrees
    // Appearance
    texture: string | null;
    spriteSheetCols: number;
    spriteSheetRows: number;
    startSize: vec2; // min, max start size
    endSize: vec2; // min, max end size
    startColor: vec4;
    endColor: vec4;
    startRotationSpeed: vec2; // min, max degrees/sec
    endRotationSpeed: vec2; // min, max degrees/sec
}


export interface NavAgentComponent {
    speed: number;
    acceleration: number;
    stoppingDistance: number;
}

export interface UIElementComponent {
    type: 'panel' | 'button' | 'text';
    text?: string;
    anchor: vec2;
}

export interface LODGroupComponent {
    lods: { meshId: string; distance: number; }[];
}

export interface TagComponent {
    tags: string[];
}

export interface HealthComponent {
    currentHealth: number;
    maxHealth: number;
}

export interface BehaviorTreeComponent {
    sourceAsset: string;
}

export interface DataAssetComponent {
    assetIds: string[];
}


export interface EditorObject {
    id: string;
    name: string;
    type: 'camera' | 'mesh' | 'grid' | 'ground' | 'empty' | 'terrain' | 'light' | 'particleEmitter' | 'cinematicCamera' | 'liquid';
    lightType?: 'directional' | 'point' | 'spot';
    parentId: string | null;
    childrenIds: string[];
    terrainData?: {
        width: number;
        depth: number;
    }
}

export interface TerrainOptions {
    seed: string;
    width: number;
    depth: number;
    heightScale: number;
    waterLevel: number;
    // FBM settings
    noiseScale: number;
    octaves: number;
    lacunarity: number;
    persistence: number;
    // Material settings
    colors: {
        water: string; // hex color
    };
    materials: {
        grassTexture: string | null;
        rockTexture: string | null;
        snowTexture: string | null;
        sandTexture: string | null;
    }
}


// --- DATA MANAGEMENT ---

export interface ForgeDataRow {
  ID: string; // Unique identifier for the row
  [key: string]: string | number | boolean;
}

export interface ForgeTable {
  id: string;
  name: string;
  rows: ForgeDataRow[];
}

export interface ForgeAsset {
  id: string;
  name: string;
  assetType: string; // For data assets, this will be the struct ID
  data: Record<string, any>;
}

export type ForgeStructFieldType = 'string' | 'number' | 'boolean' | 'vec2' | 'vec3' | 'color' | 'texture' | 'sound';

export interface ForgeStructField {
    id: string;
    name: string;
    type: ForgeStructFieldType;
    defaultValue: any;
}

export interface ForgeStruct {
    id: string;
    name: string;
    icon: string; // lucide-react icon name
    fields: ForgeStructField[];
}


// --- SETTINGS ---

export type InputDevice = 'Keyboard' | 'Mouse' | 'Gamepad';

export interface InputBinding {
    id: string;
    key: string; // e.g., 'W', 'Space', 'Mouse X', 'Gamepad Left Stick Y'
    scale: number;
    device: InputDevice;
    modifiers: ('Shift' | 'Ctrl' | 'Alt')[];
}

export interface InputActionMapping {
    id: string;
    name: string;
    bindings: InputBinding[];
}

export interface InputAxisMapping {
    id:string;
    name: string;
    bindings: InputBinding[];
}

// Enum-like types for settings dropdowns
export type ShadowQuality = 'low' | 'medium' | 'high';
export type GlobalIlluminationMode = 'off' | 'static' | 'dynamic';
export type AntiAliasingMode = 'none' | 'fxaa' | 'taa' | 'msaa';
export type ToneMappingMode = 'none' | 'aces' | 'filmic';
export type DpiScalingMode = 'auto' | 'fixed';
export type ScriptingLanguage = 'forgeScript' | 'gscript' | 'lua';

export interface BuildSettings {
    targets: {
        windows: boolean;
        web: boolean;
        android: boolean;
    };
    windowsSettings: {
        includeDebugSymbols: boolean;
        architecture: 'x64' | 'ARM';
    };
    webSettings: {
        compression: 'brotli' | 'gzip';
        maxTextureSize: 2048 | 4096;
    };
    androidSettings: {};
}

export interface PublishingSettings {
    targetPlatform: 'web' | 'windows' | 'macos';
    domainType: 'forge' | 'custom';
    domain: string;
    metadata: {
        title: string;
        description: string;
    };
    version: string;
    access: 'public' | 'password';
    password?: string;
}


// Settings Types
export interface EngineSettings {
    rendering: {
        renderScale: number;
        showFps: boolean;
        globalIllumination: GlobalIlluminationMode;
        shadowQuality: ShadowQuality;
        vsync: boolean;
        maxFrameRate: number;
        postProcessing: {
            bloom: {
                enabled: boolean;
                intensity: number;
                threshold: number;
            };
            ssao: {
                enabled: boolean;
                radius: number;
                power: number;
            };
            toneMapping: ToneMappingMode;
            motionBlur: boolean;
        };
        antiAliasing: AntiAliasingMode;
        lodBias: number;
    };
    physics: {
        gravity: vec3;
        fixedTimestep: number;
        solverIterations: number;
        enableCCD: boolean;
    };
    audio: {
        masterVolume: number;
        sfxVolume: number;
        musicVolume: number;
    };
    input: {
        actionMappings: InputActionMapping[];
        axisMappings: InputAxisMapping[];
    };
    ui: {
        defaultTheme: 'light' | 'dark';
        dpiScaling: DpiScalingMode;
        fixedDpi: number;
    };
    scripting: {
        language: ScriptingLanguage;
        compileOnSave: boolean;
        enableDebugger: boolean;
    };
    build: BuildSettings;
    publishing: PublishingSettings;
}

export interface EditorPreferences {
    theme: {
        mode: 'light' | 'dark';
        accentColor: string;
    };
    editorTools: {
        autoSaveInterval: number; // in minutes
        backupVersions: number;
        showIconSidebar: boolean;
    };
    performance: {
        uiUpdateThrottle: number; // in ms
        disableRealtimePreviews: boolean;
    };
    // Add other editor preference categories here
}