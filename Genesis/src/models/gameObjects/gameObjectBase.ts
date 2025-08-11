export class GameObjectBase extends Phaser.GameObjects.Graphics {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, { x, y });
        this.setPosition(x, y);
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

    override destroy(fromScene?: boolean): void {
        this.clearGraphics();
        super.destroy(fromScene);
    }
}