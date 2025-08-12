import { GameObjectBase } from "./gameObjectBase";

export class Ground extends GameObjectBase{
    height: number = 50;
    width: number = 0;
    constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
        super(scene, x, y);
        this.width = width;
        this.drawGround()
        scene.matter.add.gameObject(this, {
            shape: 'rectangle',
            restitution: 0.5,
            isStatic: true, // Make the ground static
        }, true);
    }

    public drawGround(): void {
        this.drawRectangle(-this.width/2, -this.height/2, this.width, this.height, 0x8B4513, 1); // Brown color for the ground
    }

    override update(...args: any[]): void {
        super.update(...args);
        this.drawGround();
    }
}