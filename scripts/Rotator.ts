
import { BaseScript } from "./BaseScript";

export class Rotator extends BaseScript {
    public rotationSpeed: number = 50; // Degrees per second

    onUpdate(deltaTime: number): void {
        const rotationAmount = this.rotationSpeed * deltaTime * (Math.PI / 180);
        this.gameObject.transform.rotation[1] += rotationAmount; // Rotate around Y axis
        this.gameObject.transform.isDirty = true;
    }
}
