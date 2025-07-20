import { Camera } from './Camera';
import { Scene } from './Scene';
import { WebGPUContext } from './webgpu/WebGPUContext';
import { BVH } from './webgpu/BVH';
import { RayTracer } from './webgpu/RayTracer';
import { CompositePass } from './webgpu/CompositePass';

type Logger = (message: string, type?: 'log' | 'warn' | 'error') => void;

export class RtxManager {
    private canvas: HTMLCanvasElement;
    private camera: Camera;
    private scene: Scene;
    private logger: Logger;
    
    private context: WebGPUContext | null = null;
    private bvh: BVH | null = null;
    private rayTracer: RayTracer | null = null;
    private compositePass: CompositePass | null = null;

    constructor(canvas: HTMLCanvasElement, camera: Camera, scene: Scene, logger: Logger) {
        this.canvas = canvas;
        this.camera = camera;
        this.scene = scene;
        this.logger = logger;
    }

    async initialize(): Promise<void> {
        this.context = await WebGPUContext.initialize(this.canvas);
        
        // Build BVH from scene geometry
        this.bvh = new BVH(this.scene.getMeshes(), this.context.device, this.logger);
        
        const { sceneVertexBuffer, sceneMaterialBuffer, bvhBuffer } = this.bvh.getBuffers();

        // Init RayTracer
        this.rayTracer = new RayTracer(
            this.context.device, 
            this.camera,
            this.canvas.width, 
            this.canvas.height
        );
        await this.rayTracer.initialize(bvhBuffer, sceneVertexBuffer, sceneMaterialBuffer);

        // Init CompositePass
        this.compositePass = new CompositePass(
            this.context.device, 
            this.context.context, 
            this.rayTracer.getOutputTexture()
        );
        await this.compositePass.initialize();
    }

    render(): void {
        if (!this.context || !this.rayTracer || !this.compositePass || !this.bvh) {
            return;
        }

        const triangleCount = this.bvh.getTriangleCount();

        // 1. Run the compute pass to trace rays
        this.rayTracer.trace(this.context.device, triangleCount);

        // 2. Run the render pass to composite the result to the screen
        this.compositePass.render(this.context.device, this.context.context);
    }

    destroy(): void {
        this.logger("Destroying RTX Manager and WebGPU resources.");
        this.bvh?.destroy();
        // The device doesn't have a destroy method in the spec,
        // but letting go of references helps with GC.
        this.context = null;
        this.bvh = null;
        this.rayTracer = null;
        this.compositePass = null;
    }
}