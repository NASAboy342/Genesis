import { GameObjectBase } from "./gameObjectBase";

export class WayPoint extends GameObjectBase{
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        this.drawCircle(0, 0, 5, 0xFF0000, 1);
    }
}