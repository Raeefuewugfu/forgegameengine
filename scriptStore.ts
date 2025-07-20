import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialScriptContent = `// Welcome to ForgeScript!
// This is a component-based scripting language for Forge Engine.

// Define properties for this script component.
// These will be editable in the Inspector.
var speed: float = 5.0
var jumpForce: float = 300.0

// onStart is called once when the scene starts playing.
func onStart() {
    log("Player Controller script has started!")
}

// onUpdate is called every frame.
// 'delta' is the time in seconds since the last frame.
func onUpdate(delta: float) {
    // Basic movement
    var moveDirection = Vector3(0, 0, 0)
    if (Input.isKeyDown("W")) {
        moveDirection.z = -1
    }
    if (Input.isKeyDown("S")) {
        moveDirection.z = 1
    }
    if (Input.isKeyDown("A")) {
        moveDirection.x = -1
    }
    if (Input.isKeyDown("D")) {
        moveDirection.x = 1
    }

    if (moveDirection.length() > 0) {
        // To move an object, get its physics component
        var physics = self.getComponent("Physics")
        if (physics) {
            // Apply a force to move the object
            var force = moveDirection.normalized() * speed * delta
            // Note: physics.applyForce is not implemented yet.
            // This is a conceptual example.
        }
    }

    // Jumping
    if (Input.isKeyPressed("Space")) {
        var physics = self.getComponent("Physics")
        if (physics) {
            var impulse = Vector3(0, 1, 0) * jumpForce
            // Note: physics.applyImpulse is not implemented yet.
        }
    }
}

// onCollision is called when this object's collider hits another.
func onCollision(other: Entity, contactPoint: Vector3) {
    log("Collided with " + other.name)
}
`;

export interface ForgeScript {
    id: string;
    name: string;
    content: string;
}

interface ScriptState {
    scripts: ForgeScript[];
    getScript: (id: string) => ForgeScript | undefined;
    createScript: (name?: string) => string; // returns new ID
    updateScript: (id: string, name: string, content: string) => void;
    deleteScript: (id: string) => void;
    renameScript: (id: string, newName: string) => void;
}

export const useScriptStore = create<ScriptState>()(
    persist(
        (set, get) => ({
            scripts: [
                { id: 'PlayerController', name: 'PlayerController.fs', content: initialScriptContent }
            ],
            getScript: (id) => get().scripts.find(s => s.id === id),
            createScript: (name) => {
                const newId = `FS_${Date.now()}`;
                const baseName = name ? name.replace(/\s/g, '') : 'NewScript';
                const existingNames = get().scripts.map(s => s.name);
                let newScriptName = `${baseName}.fs`;
                let counter = 1;
                while (existingNames.includes(newScriptName)) {
                    newScriptName = `${baseName}_${counter}.fs`;
                    counter++;
                }

                const newScript: ForgeScript = {
                    id: newId,
                    name: newScriptName,
                    content: `// ${newScriptName}\n\nfunc onStart() {\n\tlog("${newScriptName} started!")\n}\n\nfunc onUpdate(delta: float) {\n\t\n}\n`,
                };
                set(state => ({ scripts: [...state.scripts, newScript] }));
                return newId;
            },
            updateScript: (id, name, content) => {
                set(state => ({
                    scripts: state.scripts.map(s => s.id === id ? { ...s, name, content } : s)
                }));
            },
            renameScript: (id, newName) => {
                 set(state => ({
                    scripts: state.scripts.map(s => s.id === id ? { ...s, name: newName } : s)
                }));
            },
            deleteScript: (id) => {
                 set(state => ({
                    scripts: state.scripts.filter(s => s.id !== id)
                }));
            },
        }),
        {
            name: 'forge-engine-scripts-storage',
        }
    )
);