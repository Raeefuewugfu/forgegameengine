
export class AssetManager {
    private imageCache: Map<string, HTMLImageElement> = new Map();

    public async loadTexture(path: string): Promise<HTMLImageElement> {
        if (this.imageCache.has(path)) {
            return Promise.resolve(this.imageCache.get(path)!);
        }

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous"; // Important for WebGL textures from external URLs
            image.onload = () => {
                this.imageCache.set(path, image);
                resolve(image);
            };
            image.onerror = () => {
                // The event object itself is often not descriptive for security reasons.
                reject(`Failed to load image. This could be a CORS issue or an invalid URL: ${path}`);
            };
            image.src = path;
        });
    }

    public getTexture(path: string): HTMLImageElement | undefined {
        return this.imageCache.get(path);
    }

    public getCacheSize(): number {
        return this.imageCache.size;
    }
}
