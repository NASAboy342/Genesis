import { GameObjects } from "phaser";
import { Color } from "./color";

export class Photon extends GameObjects.Graphics{
    radius: number = 2;
    color: Color;
    speed: number = 4;
    angle: number;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene);
        this.x = x;
        this.y = y;
        this.getRandomAngle();
        this.setColor();
        this.draw();
        this.addToDisplayList();
    }
    getRandomAngle() {
        this.angle = Phaser.Math.Angle.RandomDegrees();
    }
    setColor() {
        this.color = new Color();
        this.color.r = 255;
        this.color.g = 255;
        this.color.b = 0;
        this.color.a = 1;
    }
    draw() {
        //draw a circle at the x and y position with the radius and color
        this.fillStyle(this.color.GetHex(), this.color.a);
        this.fillCircle(0, 0, this.radius);
    }
    update(...args: any[]): void {

        this.move();
        this.scene.physics.world.wrap(this);
        //super.update(...args);
        this.reDraw();
    }
    move() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
    reDraw() {
        this.clear();
        this.draw();
    }

}