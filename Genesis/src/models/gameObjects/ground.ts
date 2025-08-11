import { GameObjectBase } from "./gameObjectBase";

export class Ground extends GameObjectBase{
    constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
        super(scene, x, y);
        scene.matter.add.gameObject(this, {
            shape: 'rectangle',
            isStatic: true,
            restitution: 0.1, // Bounciness
        } )
        this.drawGround(width)
    }

    public drawGround(width: number): void {
        let height = 50; // Fixed height for the ground
        this.drawRectangle(0, 0, width, height, 0x8B4513, 1); // Brown color for the ground
    }
}