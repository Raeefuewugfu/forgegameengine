import { vec3, mat4, CameraComponent } from '../types';
import { Transform } from './Transform';
import { vec3 as vec3_lib, mat4 as mat4_lib, quat as quat_lib } from 'gl-matrix';

const DEFAULT_POSITION: vec3 = [5, 5, 10];
const DEFAULT_TARGET: vec3 = [0, 0, 0];
const DEFAULT_FOV = 45;

export class Camera {
    private canvas: HTMLCanvasElement;
    public position: vec3;
    public target: vec3;
    
    private front: vec3;
    private up: vec3;
    private right: vec3;
    private worldUp: vec3;
    
    public fov: number = DEFAULT_FOV;

    // Speeds for camera movement
    private readonly orbitSpeed = 0.3;
    private readonly panSpeed = 0.01;
    private readonly zoomSpeed = 0.005;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.worldUp = vec3_lib.fromValues(0, 1, 0);

        this.position = vec3_lib.clone(DEFAULT_POSITION);
        this.target = vec3_lib.clone(DEFAULT_TARGET);

        this.front = vec3_lib.create();
        this.up = vec3_lib.create();
        this.right = vec3_lib.create();
        
        this.updateCameraVectors();
    }
    
    public reset(): void {
        this.position = vec3_lib.clone(DEFAULT_POSITION);
        this.target = vec3_lib.clone(DEFAULT_TARGET);
        this.fov = DEFAULT_FOV;
        this.updateCameraVectors();
    }

    public getViewMatrix(): mat4 {
        const viewMatrix = mat4_lib.create();
        mat4_lib.lookAt(viewMatrix, this.position, this.target, this.worldUp);
        return viewMatrix;
    }

    public getProjectionMatrix(): mat4 {
        const projectionMatrix = mat4_lib.create();
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        mat4_lib.perspective(projectionMatrix, this.fov * Math.PI / 180, aspect, 0.1, 1000.0);
        return projectionMatrix;
    }

    public updateAspectRatio(renderScale: number = 1.0): void {
        const newWidth = this.canvas.clientWidth * renderScale;
        const newHeight = this.canvas.clientHeight * renderScale;
        if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
        }
    }

    public orbit(dx: number, dy: number): void {
        const deltaYaw = -dx * this.orbitSpeed;
        const deltaPitch = -dy * this.orbitSpeed;
    
        const offset = vec3_lib.create();
        vec3_lib.subtract(offset, this.position, this.target);

        // Yaw rotation around the world up axis
        const yawQuat = mat4_lib.create();
        mat4_lib.fromYRotation(yawQuat, deltaYaw * Math.PI / 180);
        vec3_lib.transformMat4(offset, offset, yawQuat);
    
        // Pitch rotation around the camera's right axis
        // Prevent gimbal lock at poles
        const currentPitch = Math.asin(this.front[1]);
        const maxPitch = Math.PI / 2 - 0.01;
        const newPitch = currentPitch - (deltaPitch * Math.PI / 180);
        
        if(newPitch < maxPitch && newPitch > -maxPitch) {
            const pitchQuat = mat4_lib.create();
            mat4_lib.fromRotation(pitchQuat, deltaPitch * Math.PI / 180, this.right);
            vec3_lib.transformMat4(offset, offset, pitchQuat);
        }

        vec3_lib.add(this.position, this.target, offset);
        this.updateCameraVectors();
    }

    public pan(dx: number, dy: number): void {
        const panX = vec3_lib.create();
        const panY = vec3_lib.create();

        vec3_lib.scale(panX, this.right, -dx * this.panSpeed * vec3_lib.distance(this.position, this.target));
        vec3_lib.scale(panY, this.up, dy * this.panSpeed * vec3_lib.distance(this.position, this.target));

        vec3_lib.add(this.position, this.position, panX);
        vec3_lib.add(this.position, this.position, panY);
        vec3_lib.add(this.target, this.target, panX);
        vec3_lib.add(this.target, this.target, panY);

        this.updateCameraVectors();
    }
    
    public zoom(delta: number): void {
        const move = vec3_lib.create();
        const distance = vec3_lib.distance(this.position, this.target);
        // Ensure we don't zoom past the target
        const zoomAmount = Math.min(delta * this.zoomSpeed * distance, distance - 0.1);

        vec3_lib.scale(move, this.front, zoomAmount);
        vec3_lib.add(this.position, this.position, move);
        
        this.updateCameraVectors();
    }

    public focus(targetPosition: vec3): void {
        const currentDistance = vec3_lib.distance(this.position, this.target);
        this.target = vec3_lib.clone(targetPosition);

        const offset = vec3_lib.create();
        // Maintain current orientation and distance
        vec3_lib.scale(offset, this.front, -currentDistance);
        vec3_lib.add(this.position, this.target, offset);

        this.updateCameraVectors();
    }

    public getFront(): vec3 {
        return this.front;
    }
    
    public setFromTransform(transform: Transform, props: CameraComponent) {
        this.fov = props.fov;
        this.position = transform.getWorldPosition();
        
        const rotationQuat = mat4_lib.getRotation(quat_lib.create(), transform.worldMatrix);
        const forwardVec: vec3 = [0, 0, -1];
        vec3_lib.transformQuat(forwardVec, forwardVec, rotationQuat);
        vec3_lib.add(this.target, this.position, forwardVec);

        this.updateCameraVectors();
    }

    public updateCameraVectors(): void {
        vec3_lib.subtract(this.front, this.target, this.position);
        vec3_lib.normalize(this.front, this.front);
        
        vec3_lib.cross(this.right, this.front, this.worldUp);
        vec3_lib.normalize(this.right, this.right);
        
        vec3_lib.cross(this.up, this.right, this.front);
        vec3_lib.normalize(this.up, this.up);
    }
}
