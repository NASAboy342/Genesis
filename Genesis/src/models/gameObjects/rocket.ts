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
    sensor: RocketSensor = new RocketSensor();

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

        const rocketx = -this.width / 2;
        const rockety = -this.height / 2;

        this.drawRectangle(rocketx, rockety, this.width, this.height, color, alpha);

        this.fillStyle(0x000000, alpha);
        this.fillTriangle(0, rockety, rocketx, rockety + this.height / 4, this.width / 2, rockety + this.height / 4);

        if(this.isThrusting){
            this.drawThrust(rocketx,rockety);
        }
        if(this.isThrustingLeft){
            this.drawThrustRight(rocketx,rockety);
        }
        if(this.isThrustingRight){
            this.drawThrustLeft(rocketx,rockety);
        }
    }
    public drawThrust(rocketx: number,rockety: number): void {
        this.fillStyle(0xffa500, 1);
        const thrustLength = this.width;
        const rocketMidX = rocketx + (this.width/2);
        const rocketBottum = rockety + this.height;
        const rocketLeftEch = rocketx;
        const rocketRightEch = rocketx + this.width;
        this.fillTriangle(rocketMidX, rocketBottum, rocketLeftEch, rocketBottum+thrustLength, rocketRightEch, rocketBottum+thrustLength);
    }
    public drawThrustLeft(rocketx: number,rockety: number): void{
        this.fillStyle(Color.GetHexFromRGB(255,255,255), 1);
        const rocketLeftEch = rocketx;
        const rocketUpHalf = rockety + (this.height/4);
        const thrustLength = this.width/2;
        const thrustRedius = (this.width/4);
        this.fillTriangle(rocketLeftEch, rocketUpHalf, rocketLeftEch-thrustLength, rocketUpHalf+thrustRedius, rocketLeftEch-thrustLength, rocketUpHalf-thrustRedius)
    }
    public drawThrustRight(rocketx: number,rockety: number): void{
        this.fillStyle(Color.GetHexFromRGB(255,255,255), 1);
        const rocketRightEch = rocketx + this.width;
        const rocketUpHalf = rockety + (this.height/4);
        const thrustLength = this.width/2;
        const thrustRedius = (this.width/4);
        this.fillTriangle(rocketRightEch, rocketUpHalf, rocketRightEch+thrustLength, rocketUpHalf+thrustRedius, rocketRightEch+thrustLength, rocketUpHalf-thrustRedius)
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

export class RocketSensor{
    readonly defaultProximitySensorsValue: number = 100;

    fronLeftProximitySensors: number = this.defaultProximitySensorsValue;
    fronProximitySensors: number = this.defaultProximitySensorsValue;
    fronRightProximitySensors: number = this.defaultProximitySensorsValue;

    leftProximitySensors: number = this.defaultProximitySensorsValue;
    rightProximitySensors: number = this.defaultProximitySensorsValue;

    rearLeftProximitySensors: number = this.defaultProximitySensorsValue;
    rearProximitySensors: number = this.defaultProximitySensorsValue;
    rearRightProximitySensors: number = this.defaultProximitySensorsValue;
}