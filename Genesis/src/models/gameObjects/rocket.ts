import { GameObjectBase } from "./gameObjectBase";

export class Rocket extends GameObjectBase {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        scene.matter.add.gameObject(this, {
            shape: 'rectangle',
            restitution: 0.1, // Bounciness
        } )
        this.drawRocket();
    }

    public drawRocket(): void {
        const width = 20;
        const height = 50;
        const color = 0xff0000; // Red color for the rocket
        const alpha = 1;

        // Draw the body of the rocket
        this.drawRectangle(-width / 2, -height / 2, width, height, color, alpha);

        // Draw the nose cone of the rocket
        this.fillStyle(0x000000, alpha); // Black color for the nose cone
        this.fillTriangle(0, -height / 2, -width / 2, -height / 2 + height / 4, width / 2, -height / 2 + height / 4);
    }

    override update(...args: any[]): void {
        super.update(...args);
        this.drawRocket();
    }
}