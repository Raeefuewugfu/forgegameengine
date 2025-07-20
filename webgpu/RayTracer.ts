import { Camera } from '../Camera';
import { mat4 as mat4_lib, vec3 as vec3_lib } from 'gl-matrix';

const raytraceShaderCode = `
struct CameraUniforms {
    inv_proj_view: mat4x4<f32>,
    position: vec3<f32>,
    frame: u32,
    light_dir: vec3<f32>,
    tri_count: u32,
};

struct BVHNode {
    min: vec3<f32>,
    left_first: u32,
    max: vec3<f32>,
    tri_count: u32,
};

struct Triangle {
    p0: vec3<f32>,
    p1: vec3<f32>,
    p2: vec3<f32>,
    normal: vec3<f32>,
    mat_idx: u32,
};

struct Material {
    color: vec4<f32>,
    emissive: vec4<f32>,
    props: vec4<f32>, // x: metallic, y: roughness
};

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var<storage, read> bvh: array<BVHNode>;
@group(0) @binding(2) var<storage, read> triangles: array<Triangle>;
@group(0) @binding(3) var<storage, read> materials: array<Material>;
@group(0) @binding(4) var output_texture: texture_storage_2d<rgba8unorm, write>;

struct Ray {
    origin: vec3<f32>,
    dir: vec3<f32>,
};

struct HitInfo {
    t: f32,
    p: vec3<f32>,
    normal: vec3<f32>,
    mat_idx: u32,
};

// Möller–Trumbore intersection algorithm
fn ray_tri_intersect(ray: Ray, tri: Triangle) -> f32 {
    let edge1 = tri.p1 - tri.p0;
    let edge2 = tri.p2 - tri.p0;
    let h = cross(ray.dir, edge2);
    let a = dot(edge1, h);

    if (a > -0.00001 && a < 0.00001) {
        return -1.0; // Ray is parallel to the triangle plane
    }

    let f = 1.0 / a;
    let s = ray.origin - tri.p0;
    let u = f * dot(s, h);

    if (u < 0.0 || u > 1.0) {
        return -1.0;
    }

    let q = cross(s, edge1);
    let v = f * dot(ray.dir, q);

    if (v < 0.0 || u + v > 1.0) {
        return -1.0;
    }

    let t = f * dot(edge2, q);
    if (t > 0.00001) {
        return t;
    }

    return -1.0;
}

fn intersect_bvh(ray: Ray) -> HitInfo {
    var hit: HitInfo;
    hit.t = 1e9; // A large number for "no hit yet"

    var stack: array<u32, 32>;
    var stack_ptr = 0u;
    stack[stack_ptr] = 0u; // Start with root node
    stack_ptr = stack_ptr + 1u;

    while (stack_ptr > 0u) {
        stack_ptr = stack_ptr - 1u;
        let node_idx = stack[stack_ptr];
        let node = bvh[node_idx];

        // Ray-AABB intersection test for current node
        let inv_dir = 1.0 / ray.dir;
        let tmin = (node.min - ray.origin) * inv_dir;
        let tmax = (node.max - ray.origin) * inv_dir;
        let t_enter = max(max(min(tmin.x, tmax.x), min(tmin.y, tmax.y)), min(tmin.z, tmax.z));
        let t_exit = min(min(max(tmin.x, tmax.x), max(tmin.y, tmax.y)), max(tmin.z, tmax.z));

        if (t_enter < t_exit && t_exit > 0.0 && t_enter < hit.t) {
            if (node.tri_count > 0u) { // Leaf node
                for (var i = 0u; i < node.tri_count; i = i + 1u) {
                    let tri = triangles[node.left_first + i];
                    let t = ray_tri_intersect(ray, tri);
                    if (t > 0.0 && t < hit.t) {
                        hit.t = t;
                        hit.normal = tri.normal;
                        hit.mat_idx = tri.mat_idx;
                        hit.p = ray.origin + ray.dir * t;
                    }
                }
            } else { // Internal node
                let left_child_idx = node.left_first;
                let right_child_idx = left_child_idx + 1u;
                if (stack_ptr < 30u) { // Check if there's space for two more
                    stack[stack_ptr] = left_child_idx;
                    stack_ptr = stack_ptr + 1u;
                    stack[stack_ptr] = right_child_idx;
                    stack_ptr = stack_ptr + 1u;
                }
            }
        }
    }
    return hit;
}


fn get_sky_color(dir: vec3<f32>) -> vec3<f32> {
    let t = 0.5 * (dir.y + 1.0);
    return (1.0 - t) * vec3<f32>(0.9, 0.9, 0.9) + t * vec3<f32>(0.5, 0.7, 1.0);
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = vec2<f32>(textureDimensions(output_texture));
    if (global_id.x >= u32(dims.x) || global_id.y >= u32(dims.y)) {
        return;
    }

    let uv = (vec2<f32>(global_id.xy) + vec2<f32>(0.5, 0.5)) / dims;
    let clip_pos = vec4<f32>(uv.x * 2.0 - 1.0, (1.0 - uv.y) * 2.0 - 1.0, 1.0, 1.0);
    
    var world_pos = camera.inv_proj_view * clip_pos;
    world_pos = world_pos / world_pos.w;

    var ray: Ray;
    ray.origin = camera.position;
    ray.dir = normalize(world_pos.xyz - camera.position);
    
    var final_color = vec3<f32>(0.0, 0.0, 0.0);
    
    let hit = intersect_bvh(ray);

    if (hit.t < 1e9) {
        let material = materials[hit.mat_idx];
        let base_color = material.color.rgb;
        let metallic = material.props.x;

        let light_dir = normalize(camera.light_dir);
        let diffuse = max(0.0, dot(hit.normal, light_dir)) * base_color;

        // Shadow ray
        var shadow_ray: Ray;
        shadow_ray.origin = hit.p + hit.normal * 0.001;
        shadow_ray.dir = light_dir;
        let shadow_hit = intersect_bvh(shadow_ray);
        var shadow_factor = 1.0;
        if (shadow_hit.t < 1e9) {
            shadow_factor = 0.2;
        }

        let albedo = mix(base_color, vec3<f32>(0.0, 0.0, 0.0), metallic);
        var color = albedo * diffuse * shadow_factor;
        
        // Reflections
        if (metallic > 0.5) {
            var reflect_ray: Ray;
            reflect_ray.origin = hit.p + hit.normal * 0.001;
            reflect_ray.dir = reflect(ray.dir, hit.normal);
            let reflect_hit = intersect_bvh(reflect_ray);
            var reflect_color = get_sky_color(reflect_ray.dir);
            if(reflect_hit.t < 1e9){
                reflect_color = materials[reflect_hit.mat_idx].color.rgb;
            }
            color = mix(color, reflect_color, metallic);
        }

        final_color = color;

    } else {
        final_color = get_sky_color(ray.dir);
    }

    textureStore(output_texture, global_id.xy, vec4<f32>(final_color, 1.0));
}
`;

export class RayTracer {
    private device: GPUDevice;
    private camera: Camera;
    private width: number;
    private height: number;
    
    private pipeline: GPUComputePipeline;
    private bindGroup: GPUBindGroup;
    private cameraBuffer: GPUBuffer;
    private outputTexture: GPUTexture;
    private frame: number = 0;

    constructor(device: GPUDevice, camera: Camera, width: number, height: number) {
        this.device = device;
        this.camera = camera;
        this.width = width;
        this.height = height;
    }

    async initialize(bvhBuffer: GPUBuffer, vertexBuffer: GPUBuffer, materialBuffer: GPUBuffer): Promise<void> {
        this.outputTexture = this.device.createTexture({
            size: [this.width, this.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });

        // Uniform buffer for camera data
        this.cameraBuffer = this.device.createBuffer({
            size: 128, // 1 mat4x4 (64) + 1 vec3 position (12) + 1 u32 frame(4) + 1 vec3 light (12) + 1 u32 triCount(4) + padding
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        const bindGroupLayout = this.device.createBindGroupLayout({
             entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
                { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
                { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
                { binding: 4, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8unorm' } },
             ]
        });

        this.bindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.cameraBuffer } },
                { binding: 1, resource: { buffer: bvhBuffer } },
                { binding: 2, resource: { buffer: vertexBuffer } },
                { binding: 3, resource: { buffer: materialBuffer } },
                { binding: 4, resource: this.outputTexture.createView() }
            ]
        });

        const shaderModule = this.device.createShaderModule({ code: raytraceShaderCode });
        this.pipeline = await this.device.createComputePipelineAsync({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
            compute: {
                module: shaderModule,
                entryPoint: 'main',
            },
        });
    }

    private updateCameraBuffer(triangleCount: number) {
        const proj = this.camera.getProjectionMatrix();
        const view = this.camera.getViewMatrix();
        const projView = mat4_lib.multiply(mat4_lib.create(), proj, view);
        const invProjView = mat4_lib.invert(mat4_lib.create(), projView);

        const lightDir = vec3_lib.normalize(vec3_lib.create(), [-0.5, -1, -0.2]);

        const uniformData = new ArrayBuffer(128);
        new Float32Array(uniformData, 0, 16).set(invProjView as Float32Array);
        new Float32Array(uniformData, 64, 3).set(this.camera.position);
        new Uint32Array(uniformData, 76, 1).set([this.frame++]);
        new Float32Array(uniformData, 80, 3).set(lightDir);
        new Uint32Array(uniformData, 92, 1).set([triangleCount]);
        
        this.device.queue.writeBuffer(this.cameraBuffer, 0, uniformData);
    }

    trace(device: GPUDevice, triangleCount: number) {
        if (!this.pipeline) return;

        this.updateCameraBuffer(triangleCount);

        const commandEncoder = device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(this.width / 8), Math.ceil(this.height / 8), 1);
        passEncoder.end();
        
        device.queue.submit([commandEncoder.finish()]);
    }
    
    getOutputTexture(): GPUTexture {
        return this.outputTexture;
    }
}