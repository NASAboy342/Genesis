import { GameObjectBase } from "./gameObjectBase";

export class Rocket extends GameObjectBase {
    width: number = 20;
    height: number = 50;
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        this.drawRocket();
        scene.matter.add.gameObject(this, {
            shape: 'rectangle',
            restitution: 0.5,
        }, true);
    }

    public drawRocket(): void {
        const color = 0xff0000; // Red color for the rocket
        const alpha = 1;

        // Draw the body of the rocket
        this.drawRectangle(-this.width / 2, -this.height / 2, this.width, this.height, color, alpha);

        // Draw the nose cone of the rocket
        this.fillStyle(0x000000, alpha); // Black color for the nose cone
        this.fillTriangle(0, -this.height / 2, -this.width / 2, -this.height / 2 + this.height / 4, this.width / 2, -this.height / 2 + this.height / 4);
    }

    override update(...args: any[]): void {
        super.update(...args);
        this.drawRocket();
    }
}