
import { Buffers, MeshData, PhysicsProperties, MaterialProperties, AudioComponent, LightComponent, ScriptComponent, AnimatorComponent, ParticleEmitterComponent, NavAgentComponent, UIElementComponent, LODGroupComponent, TagComponent, HealthComponent, ForgeScriptProperties, BehaviorTreeComponent, SerializedObject, SceneData, CameraComponent, CinematicCameraComponent, DataAssetComponent, LiquidComponent } from '../types';
import { Renderer } from './Renderer';
import { Transform } from './Transform';
import { MeshFactory } from './MeshFactory';


export interface Mesh {
    id: string;
    name: string;
    buffers: Buffers | null;
    meshData: MeshData;
    transform: Transform;
    vertexCount: number;
    renderable: boolean;
    isSelectable: boolean;
    drawMode: 'TRIANGLES' | 'LINES';
    type: 'camera' | 'mesh' | 'grid' | 'ground' | 'empty' | 'terrain' | 'light' | 'particleEmitter' | 'cinematicCamera' | 'liquid';
    terrainData?: {
        width: number;
        depth: number;
    }
    
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


    physicsBody?: any; // Ammo.btRigidBody
}

interface CreateObjectOptions {
    id?: string;
    name: string;
    transform?: Transform;
    meshData?: MeshData;
    renderable?: boolean;
    type?: 'camera' | 'mesh' | 'grid' | 'ground' | 'empty' | 'terrain' | 'light' | 'particleEmitter' | 'cinematicCamera' | 'liquid';
    isSelectable?: boolean;
    drawMode?: 'TRIANGLES' | 'LINES';
    parentId?: string | null;
    terrainData?: {
        width: number;
        depth: number;
    }

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
}

export class Scene {
    private meshes: Map<string, Mesh> = new Map();
    private rootObjects: Mesh[] = [];
    private renderer: Renderer;

    constructor(renderer: Renderer) {
        this.renderer = renderer;
    }

    createObject(options: CreateObjectOptions): string {
        const {
            id = `${options.name.replace(/\s/g, '-')}-${Math.random().toString(36).substr(2, 9)}`,
            transform = new Transform(),
            meshData = { vertices: [], colors: [], indices: [] },
            renderable = true,
            type = 'mesh',
            isSelectable = true,
            drawMode = 'TRIANGLES',
            parentId = null,
            ...components
        } = options;
        
        let buffers: Buffers | null = null;
        if (renderable && meshData.vertices.length > 0) {
            buffers = this.renderer.createBuffers(meshData);
        }

        const vertexCount = drawMode === 'LINES' ? meshData.vertices.length / 3 : meshData.indices.length;

        transform.meshId = id;
        
        const mesh: Mesh = {
            id, name: options.name, buffers, meshData, transform, vertexCount, renderable,
            isSelectable, drawMode, type, ...components
        };

        this.meshes.set(id, mesh);

        if (parentId) {
            const parent = this.meshes.get(parentId);
            if (parent) {
                mesh.transform.setParent(parent.transform);
            } else {
                this.rootObjects.push(mesh);
            }
        } else {
            this.rootObjects.push(mesh);
        }
        
        this.updateWorldTransforms();
        return id;
    }
    
    renameObject(id: string, newName: string) {
        const obj = this.meshes.get(id);
        if (obj) {
            obj.name = newName;
        }
    }

    removeObject(id: string) {
        const obj = this.meshes.get(id);
        if (!obj) return;

        // Recursively remove all children
        const children = [...obj.transform.children];
        for (const childTransform of children) {
            this.removeObject(childTransform.meshId);
        }

        // Remove from parent's children list
        if (obj.transform.parent) {
            obj.transform.parent.children = obj.transform.parent.children.filter(
                t => t.meshId !== id
            );
        }
        
        // Remove from root if it's a root object
        this.rootObjects = this.rootObjects.filter(o => o.id !== id);
        
        // Finally, remove from the main map
        this.meshes.delete(id);
    }
    
    clear() {
        // Create a copy of the IDs to iterate over, as removeObject modifies the collection
        const allIds = Array.from(this.meshes.keys());
        allIds.forEach(id => this.removeObject(id));
        this.meshes.clear();
        this.rootObjects = [];
    }

    duplicateObjects(ids: string[]): string[] {
        const objectsToDuplicate = ids
            .map(id => this.getMeshById(id))
            .filter(Boolean) as Mesh[];
            
        // Filter out children if their parent is also selected to avoid duplicating them twice
        const topLevelObjectsToDuplicate = objectsToDuplicate.filter(obj => {
            let parent = obj.transform.parent;
            while(parent) {
                if(ids.includes(parent.meshId)) {
                    return false; // This object is a child of another selected object
                }
                parent = parent.parent;
            }
            return true;
        });

        const allNewIds: string[] = [];
        
        const _duplicateRecursively = (original: Mesh, newParentId: string | null): string => {
            const newId = this.createObject({
                name: `${original.name} (Copy)`,
                transform: original.transform.clone(),
                meshData: original.meshData,
                renderable: original.renderable,
                type: original.type,
                isSelectable: original.isSelectable,
                drawMode: original.drawMode,
                parentId: newParentId,
                terrainData: original.terrainData,
                // Copy all components
                physics: original.physics ? {...original.physics} : undefined,
                material: original.material ? {...original.material} : undefined,
                audio: original.audio ? {...original.audio} : undefined,
                light: original.light ? {...original.light} : undefined,
                script: original.script ? {...original.script} : undefined,
                forgeScript: original.forgeScript ? {...original.forgeScript} : undefined,
                animator: original.animator ? {...original.animator} : undefined,
                particleEmitter: original.particleEmitter ? {...original.particleEmitter} : undefined,
                navAgent: original.navAgent ? {...original.navAgent} : undefined,
                uiElement: original.uiElement ? {...original.uiElement} : undefined,
                lodGroup: original.lodGroup ? {...original.lodGroup} : undefined,
                tag: original.tag ? { tags: [...original.tag.tags] } : undefined,
                health: original.health ? { ...original.health } : undefined,
                behaviorTree: original.behaviorTree ? { ...original.behaviorTree } : undefined,
                cameraComponent: original.cameraComponent ? { ...original.cameraComponent } : undefined,
                cinematicCameraComponent: original.cinematicCameraComponent ? { ...original.cinematicCameraComponent } : undefined,
                dataAsset: original.dataAsset ? { assetIds: [...original.dataAsset.assetIds] } : undefined,
                liquid: original.liquid ? JSON.parse(JSON.stringify(original.liquid)) : undefined,
            });
            allNewIds.push(newId);
            
            for (const childTransform of original.transform.children) {
                const childObject = this.getMeshById(childTransform.meshId);
                if(childObject) {
                    _duplicateRecursively(childObject, newId);
                }
            }
            return newId;
        };
        
        const newTopLevelIds: string[] = [];
        for (const original of topLevelObjectsToDuplicate) {
            const newId = _duplicateRecursively(original, original.transform.parentId);
            const newObj = this.getMeshById(newId);
            if (newObj && topLevelObjectsToDuplicate.some(o => o.id === original.id)) {
                 newTopLevelIds.push(newId);
            }
        }
        
        this.updateWorldTransforms();
        return newTopLevelIds;
    }
    
    reparentObjects(ids: string[], newParentId: string | null) {
        const newParent = newParentId ? this.meshes.get(newParentId) : null;

        for (const id of ids) {
            const obj = this.meshes.get(id);
            if (!obj) continue;
            
            // Prevent parenting to a descendant
            let p = newParent;
            while(p) {
                if (p.id === id) {
                    console.warn("Cannot parent an object to its own descendant.");
                    return;
                }
                p = p.transform.parent ? this.meshes.get(p.transform.parent.meshId) : null;
            }

            // Remove from old parent (or root)
            if (!obj.transform.parent) {
                this.rootObjects = this.rootObjects.filter(o => o.id !== id);
            }

            obj.transform.setParent(newParent ? newParent.transform : null);

            // Add to new parent (or root)
            if (!newParent) {
                this.rootObjects.push(obj);
            }
        }
        this.updateWorldTransforms();
    }

    updateWorldTransforms() {
        for (const obj of this.rootObjects) {
            obj.transform.updateWorldMatrix();
        }
    }
    
    saveInitialTransforms() {
        this.getMeshes().forEach(mesh => {
            const state = {
                position: mesh.transform.position,
                rotation: mesh.transform.rotation,
                scale: mesh.transform.scale,
                parentId: mesh.transform.parentId,
            };
            (mesh as any)._initialState = state;
        });
    }
    
    restoreInitialTransforms() {
        this.getMeshes().forEach(mesh => {
            const state = (mesh as any)._initialState;
            if (state) {
                mesh.transform.position = state.position;
                mesh.transform.rotation = state.rotation;
                mesh.transform.scale = state.scale;
                this.reparentObjects([mesh.id], state.parentId);
            }
        });
        this.updateWorldTransforms();
    }
    
    public getMeshes(): Mesh[] {
        return Array.from(this.meshes.values());
    }

    public getMeshById(id: string): Mesh | undefined {
        return this.meshes.get(id);
    }
    
    // --- SCENE SERIALIZATION ---
    serialize(): SceneData {
        const objects: SerializedObject[] = [];
        for (const mesh of this.getMeshes()) {
            // Don't save the editor grid
            if (mesh.type === 'grid') continue;

            const serialized: SerializedObject = {
                id: mesh.id,
                name: mesh.name,
                type: mesh.type,
                transform: {
                    position: mesh.transform.position,
                    rotation: mesh.transform.rotation,
                    scale: mesh.transform.scale,
                    parentId: mesh.transform.parentId,
                },
                physics: mesh.physics,
                material: mesh.material,
                audio: mesh.audio,
                light: mesh.light,
                script: mesh.script,
                forgeScript: mesh.forgeScript,
                animator: mesh.animator,
                particleEmitter: mesh.particleEmitter,
                navAgent: mesh.navAgent,
                uiElement: mesh.uiElement,
                lodGroup: mesh.lodGroup,
                tag: mesh.tag,
                health: mesh.health,
                behaviorTree: mesh.behaviorTree,
                cameraComponent: mesh.cameraComponent,
                cinematicCameraComponent: mesh.cinematicCameraComponent,
                dataAsset: mesh.dataAsset,
                liquid: mesh.liquid,
            };
            
            if (mesh.type === 'terrain' || mesh.type === 'liquid') {
                serialized.meshData = mesh.meshData;
                serialized.terrainData = mesh.terrainData;
            }

            objects.push(serialized);
        }
        return { version: "1.0", objects };
    }

    deserialize(data: SceneData): void {
        this.clear();
        
        // First pass: create all objects without parenting
        for (const sObj of data.objects) {
            const transform = new Transform({
                position: sObj.transform.position,
                rotation: sObj.transform.rotation,
                scale: sObj.transform.scale,
            });
            
            let meshData;
            if (sObj.type === 'terrain' || sObj.type === 'liquid') {
                meshData = sObj.meshData;
            } else if (sObj.type === 'mesh') {
                meshData = MeshFactory.createCube();
            } else {
                 meshData = undefined;
            }

            this.createObject({
                ...sObj,
                transform,
                meshData,
                renderable: sObj.type === 'mesh' || sObj.type === 'terrain' || sObj.type === 'liquid',
            });
        }
        
        // Second pass: set parents
        for (const sObj of data.objects) {
            if (sObj.transform.parentId) {
                this.reparentObjects([sObj.id], sObj.transform.parentId);
            }
        }
        
        this.updateWorldTransforms();
    }
}