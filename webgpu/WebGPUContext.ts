export class WebGPUContext {
  public device: GPUDevice;
  public context: GPUCanvasContext;
  public format: GPUTextureFormat;

  private constructor(device: GPUDevice, context: GPUCanvasContext, format: GPUTextureFormat) {
      this.device = device;
      this.context = context;
      this.format = format;
  }

  static async initialize(canvas: HTMLCanvasElement): Promise<WebGPUContext> {
    if (!navigator.gpu) {
        throw new Error("WebGPU is not supported on this browser.");
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No suitable GPU adapter found.");
    }
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu");
    if (!context) {
        throw new Error("Could not get WebGPU context from canvas.");
    }
    
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ 
        device, 
        format,
        alphaMode: "premultiplied",
    });

    return new WebGPUContext(device, context, format);
  }
}
