import { GameObjectBase } from "./gameObjectBase";

export class Ground extends GameObjectBase{
    height: number = 50;
    width: number = 0;
    constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
        super(scene, x, y);
        this.width = width;
        this.drawGround();
        scene.matter.add.gameObject(this, {
            restitution: 0.5,
            isStatic: true,
        },true);
    }

    public drawGround(): void {
        this.drawRectangle(-this.width/2, -this.height/2, this.width, this.height, 0x8B4513, 1); // Brown color for the ground
    }

    override update(...args: any[]): void {
        super.update(...args);
    }

    getSerfaces(): Phaser.Geom.Line[] {
      let serfaces: Phaser.Geom.Line[] = [
        new Phaser.Geom.Line(-this.width / 2, -this.height / 2, this.width / 2, -this.height / 2), // top edge
        new Phaser.Geom.Line(this.width / 2, -this.height / 2, this.width / 2, this.height / 2), // right edge
        new Phaser.Geom.Line(this.width / 2, this.height / 2, -this.width / 2, this.height / 2), // bottom edge
        new Phaser.Geom.Line(-this.width / 2, this.height / 2, -this.width / 2, -this.height / 2) // left edge
      ];

      let cos = Math.cos(this.rotation);
      let sin = Math.sin(this.rotation);

      // Rotate the lines based on the ground's rotation
      return serfaces.map(line => new Phaser.Geom.Line(
        this.x + (line.x1 * cos + line.y1 * sin),
        this.y + (-line.x1 * sin + line.y1 * cos),
        this.x + (line.x2 * cos + line.y2 * sin),
        this.y + (-line.x2 * sin + line.y2 * cos)
      ));

    }
}