import { Color } from "../color";
import { GameObjectBase } from "./gameObjectBase";

export class Rocket extends GameObjectBase {
    
    width: number = 20;
    height: number = 50;
    physicBody: Phaser.Physics.Matter.Sprite;
    thrustForce: number = 0.003;
    isThrusting: boolean = false;
    isThrustingRight: boolean = false;
    isThrustingLeft: boolean = false;

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
        this.clear();
        const color = 0xff0000;
        const alpha = 1;

        this.drawRectangle(-this.width / 2, -this.height / 2, this.width, this.height, color, alpha);

        this.fillStyle(0x000000, alpha);
        this.fillTriangle(0, -this.height / 2, -this.width / 2, -this.height / 2 + this.height / 4, this.width / 2, -this.height / 2 + this.height / 4);

        if(this.isThrusting){
            this.drawThrust();
        }
        if(this.isThrustingLeft){
            this.drawThrustRight();
        }
        if(this.isThrustingRight){
            this.drawThrustLeft();
        }
    }
    public drawThrust(): void {
        this.fillStyle(0xffa500, 1); // Orange color for the thrust
        this.fillTriangle(0, this.height / 2, -this.width / 4, this.height / 2 + this.height / 4, this.width / 4, this.height / 2 + this.height / 4);
    }
    public drawThrustLeft(): void{
        
    }
    public drawThrustRight(): void{

    }

    override update(...args: any[]): void {
        this.x = this.physicBody.x;
        this.y = this.physicBody.y;
        this.rotation = this.physicBody.rotation;
        super.update(...args);
        this.drawRocket();
        this.isThrusting = false;
        this.isThrustingLeft = false;
        this.isThrustingRight = false;
    }

    //#region Rocket Controls
    handleThrust() {
        this.physicBody.thrustLeft(this.thrustForce);
        this.isThrusting = true; // Set thrusting state to true
    }
    stearRight() {
        this.physicBody.setAngularVelocity(this.physicBody.getAngularVelocity()+this.thrustForce); // Adjust the angular velocity for right steering
        this.isThrustingRight = true;
    }
    stearLeft() {
        this.physicBody.setAngularVelocity(this.physicBody.getAngularVelocity()-this.thrustForce); // Adjust the angular velocity for left steering
        this.isThrustingLeft = true;
    }
    //#endregion Rocket Controls

    //#region Rocket sensors
    
    //#endregion Rocket sensors
}