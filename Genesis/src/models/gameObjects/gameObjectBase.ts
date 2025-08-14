export class GameObjectBase extends Phaser.GameObjects.Graphics {

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, {x, y});
        scene.add.existing(this);
    }

    drawRectangle(x: number, y: number, width: number, height: number, color: number = 0xffffff, alpha: number = 1): void {
        this.fillStyle(color, alpha);
        this.fillRect(x, y, width, height);
    }

    drawCircle(x: number = 0, y: number = 0, radius: number, color: number = 0xffffff, alpha: number = 1): void {
        this.fillStyle(color, alpha);
        this.fillCircle(x, y, radius);
    }

    clearGraphics(): void {
        this.clear();
    }
    drawLine(x1: number, y1: number, x2: number, y2: number, color: number, alpha: number = 1) {
        this.lineStyle(1, color, alpha);
        this.beginPath();
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
        this.strokePath();
        this.closePath();
        this.fillStyle(color, alpha);
        this.fill();
        this.closePath();
    }

    override update(...args: any[]): void {
        super.update(...args);
    }
    override destroy(fromScene?: boolean): void {
        this.clearGraphics();
        super.destroy(fromScene);
    }
}