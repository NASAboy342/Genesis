import { GameObjectBase } from "./gameObjectBase";

export class Rocket extends GameObjectBase {
    
    width: number = 20;
    height: number = 50;
    physicBody: Phaser.Physics.Matter.Sprite;
    thrustForce: number = 0.003;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        this.generateTexture('rocket');
        this.drawRocket();

        this.physicBody = scene.matter.add.sprite(x, y, 'rocket', '', {
            shape: {
                type: 'rectangle',
                width: this.width,
                height: this.height,
            },
            restitution: 0.5,
        });
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
        this.x = this.physicBody.x;
        this.y = this.physicBody.y;
        this.rotation = this.physicBody.rotation;
        super.update(...args);
        //this.drawRocket();
    }
    handleThrust() {
        this.physicBody.thrustLeft(this.thrustForce);;
    }
    stearRight() {
        this.physicBody.setAngularVelocity(this.physicBody.getAngularVelocity()+this.thrustForce); // Adjust the angular velocity for right steering
    }
    stearLeft() {
        this.physicBody.setAngularVelocity(this.physicBody.getAngularVelocity()-this.thrustForce); // Adjust the angular velocity for left steering
    }
}