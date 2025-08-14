import { GameObjectBase } from "./gameObjectBase";

export class GridBackground extends GameObjectBase {
    constructor(scene: Phaser.Scene, width: number, height: number, cellSize: number) {
        super(scene, 0, 0);
        this.drawGrid(width, height, cellSize);
    }

    public drawGrid(width: number, height: number, cellSize: number): void {
        let verticalLines = Math.ceil(width / cellSize);
        let horizontalLines = Math.ceil(height / cellSize);

        for (let i = 0; i <= verticalLines; i++) {
            this.drawLine(i * cellSize, 0, i * cellSize, height, 0xcccccc, 0.5);
        }

        for (let j = 0; j <= horizontalLines; j++) {
            this.drawLine(0, j * cellSize, width, j * cellSize, 0xcccccc, 0.5);
        }
    }
    
}