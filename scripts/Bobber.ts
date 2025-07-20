
import { BaseScript } from "./BaseScript";

export class Bobber extends BaseScript {
    public speed: number = 2;
    public height: number = 0.2;
    
    private initialY: number = 0;
    private time: number = 0;

    onStart(): void {
        this.initialY = this.gameObject.transform.position[1];
        this.time = 0;
    }

    onUpdate(deltaTime: number): void {
        this.time += deltaTime;
        const newY = this.initialY + Math.sin(this.time * this.speed) * this.height;
        this.gameObject.transform.position[1] = newY;
        this.gameObject.transform.isDirty = true;
    }
}
