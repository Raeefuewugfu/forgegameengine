
import { Mesh, Scene } from '../Scene';
import { BaseScript } from '../scripts/BaseScript';
import { Rotator } from '../scripts/Rotator';
import { Bobber } from '../scripts/Bobber';

type ScriptConstructor = new (gameObject: Mesh) => BaseScript;

export class ScriptingSystem {
    private scene: Scene;
    private activeScripts: BaseScript[] = [];
    private scriptRegistry: Map<string, ScriptConstructor> = new Map();

    constructor(scene: Scene) {
        this.scene = scene;
        this.registerScripts();
    }

    private registerScripts() {
        this.scriptRegistry.set('Rotator', Rotator);
        this.scriptRegistry.set('Bobber', Bobber);
    }

    public getAvailableScripts(): string[] {
        return Array.from(this.scriptRegistry.keys());
    }

    start() {
        this.stop(); // Clear any existing scripts first
        const meshes = this.scene.getMeshes();
        for (const mesh of meshes) {
            if (mesh.script?.scriptName) {
                const ScriptClass = this.scriptRegistry.get(mesh.script.scriptName);
                if (ScriptClass) {
                    const scriptInstance = new ScriptClass(mesh);
                    
                    // Apply stored properties from the editor to the script instance
                    for (const key in mesh.script.properties) {
                        if (Object.prototype.hasOwnProperty.call(scriptInstance, key)) {
                            (scriptInstance as any)[key] = mesh.script.properties[key];
                        }
                    }

                    this.activeScripts.push(scriptInstance);
                }
            }
        }

        // Call onStart only after all scripts have been instantiated
        for (const scriptInstance of this.activeScripts) {
            scriptInstance.onStart();
        }
    }

    stop() {
        this.activeScripts = [];
    }

    update(deltaTime: number) {
        for (const script of this.activeScripts) {
            script.onUpdate(deltaTime);
        }
    }
    
    // Helper to inspect script properties for the editor UI
    getScriptProperties(scriptName: string): Record<string, 'number' | 'string' | 'boolean'> {
        const ScriptClass = this.scriptRegistry.get(scriptName);
        if (!ScriptClass) return {};

        // Create a dummy instance to inspect its default properties
        const dummyMesh = { transform: {} } as Mesh;
        const instance = new ScriptClass(dummyMesh);
        const properties: Record<string, 'number' | 'string' | 'boolean'> = {};

        // Find public properties on the class instance
        for (const key in instance) {
            if (Object.prototype.hasOwnProperty.call(instance, key) && typeof (instance as any)[key] !== 'function' && key !== 'gameObject') {
                const valueType = typeof (instance as any)[key];
                if (valueType === 'number' || valueType === 'string' || valueType === 'boolean') {
                    properties[key] = valueType;
                }
            }
        }
        return properties;
    }
}
