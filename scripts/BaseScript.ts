
import { Mesh } from "../Scene";

export abstract class BaseScript {
    public gameObject: Mesh;

    constructor(gameObject: Mesh) {
        this.gameObject = gameObject;
    }

    /**
     * Called once when the play button is hit, after all objects are initialized.
     */
    onStart(): void {}

    /**
     * Called every frame while in play mode.
     * @param deltaTime The time in seconds since the last frame.
     */
    onUpdate(deltaTime: number): void {}
}
