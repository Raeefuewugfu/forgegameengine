import { vec3, mat4 } from '../types';
import { vec3 as vec3_lib, mat4 as mat4_lib, quat as quat_lib } from 'gl-matrix';

export class Transform {
    public position: vec3;
    public rotation: vec3; // Euler angles in radians
    public scale: vec3;
    
    public localMatrix: mat4;
    public worldMatrix: mat4;

    public parent: Transform | null = null;
    public children: Transform[] = [];
    public parentId: string | null = null;
    public meshId: string = '';

    public isDirty: boolean = true;

    constructor(options: { position?: vec3, rotation?: vec3, scale?: vec3 } = {}) {
        this.position = vec3_lib.clone(options.position || [0, 0, 0]);
        this.rotation = vec3_lib.clone(options.rotation || [0, 0, 0]);
        this.scale = vec3_lib.clone(options.scale || [1, 1, 1]);
        this.localMatrix = mat4_lib.create();
        this.worldMatrix = mat4_lib.create();
    }
    
    private updateLocalMatrix(): void {
        const q = quat_lib.create();
        quat_lib.fromEuler(q, this.rotation[0] * 180 / Math.PI, this.rotation[1] * 180 / Math.PI, this.rotation[2] * 180 / Math.PI);
        mat4_lib.fromRotationTranslationScale(this.localMatrix, q, this.position, this.scale);
        this.isDirty = true;
    }
    
    public updateWorldMatrix(parentWorldMatrix?: mat4): void {
        this.updateLocalMatrix();
        if (parentWorldMatrix) {
            mat4_lib.multiply(this.worldMatrix, parentWorldMatrix, this.localMatrix);
        } else {
            mat4_lib.copy(this.worldMatrix, this.localMatrix);
        }

        for (const child of this.children) {
            child.updateWorldMatrix(this.worldMatrix);
        }
        this.isDirty = false;
    }
    
    public getModelMatrix(): mat4 {
        // In the new system, worldMatrix is the model matrix.
        return this.worldMatrix;
    }
    
    public getWorldPosition(): vec3 {
        const position = vec3_lib.create();
        mat4_lib.getTranslation(position, this.worldMatrix);
        return position;
    }

    public setParent(newParent: Transform | null) {
        if (this.parent) {
            this.parent.children = this.parent.children.filter(child => child !== this);
        }
        this.parent = newParent;
        this.parentId = newParent ? newParent.meshId : null;
        if (newParent) {
            newParent.children.push(this);
        }
        this.isDirty = true;
    }

    public clone(): Transform {
        const newTransform = new Transform();
        newTransform.position = vec3_lib.clone(this.position);
        newTransform.rotation = vec3_lib.clone(this.rotation);
        newTransform.scale = vec3_lib.clone(this.scale);
        return newTransform;
    }
}