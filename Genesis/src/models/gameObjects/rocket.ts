import { Color } from "../color";
import { GameObjectBase } from "./gameObjectBase";

export class Rocket extends GameObjectBase {
    
    width: number = 20;
    height: number = 50;

    readonly rocketLeftEdge: number;
    readonly rocketRightEdge: number;
    readonly rocketUpHalf: number;
    readonly rocketTop: number;
    readonly rocketBottom: number;

    physicBody: Phaser.Physics.Matter.Sprite;
    thrustForce: number = 0.003;
    isThrusting: boolean = false;
    isThrustingRight: boolean = false;
    isThrustingLeft: boolean = false;
    sensor: RocketSensor;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.generateTexture('rocket');

        this.rocketLeftEdge = -this.width / 2;
        this.rocketRightEdge = this.width / 2;
        this.rocketUpHalf = -this.height / 4;
        this.rocketTop = -this.height / 2;
        this.rocketBottom = this.height / 2;

        this.sensor = new RocketSensor();

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
            this.drawThrust();
        }
        if(this.isThrustingLeft){
            this.drawThrustRight();
        }
        if(this.isThrustingRight){
            this.drawThrustLeft();
        }

        this.sensor.drawFronProximitySensors(this);
        this.sensor.drawFronLeftProximitySensors(this);
        this.sensor.drawFronRightProximitySensors(this);

        this.sensor.drawLeftProximitySensors(this);
        this.sensor.drawRightProximitySensors(this);

        this.sensor.drawRearProximitySensors(this);
        this.sensor.drawRearLeftProximitySensors(this);
        this.sensor.drawRearRightProximitySensors(this);
    }
    public drawThrust(): void {
        this.fillStyle(0xffa500, 1);
        const thrustLength = this.width;
        const rocketMidX = 0;
        const rocketBottum = this.height/2;
        this.fillTriangle(rocketMidX, rocketBottum, this.rocketLeftEdge, rocketBottum+thrustLength, this.rocketRightEdge, rocketBottum+thrustLength);
    }
    public drawThrustLeft(): void{
        this.fillStyle(Color.GetHexFromRGB(255,255,255), 1);
        const thrustLength = this.width/2;
        const thrustRedius = (this.width/4);
        this.fillTriangle(this.rocketLeftEdge, this.rocketUpHalf, this.rocketLeftEdge-thrustLength, this.rocketUpHalf+thrustRedius, this.rocketLeftEdge-thrustLength, this.rocketUpHalf-thrustRedius)
    }
    public drawThrustRight(): void{
        this.fillStyle(Color.GetHexFromRGB(255,255,255), 1);
        const thrustLength = this.width/2;
        const thrustRedius = (this.width/4);
        this.fillTriangle(this.rocketRightEdge, this.rocketUpHalf, this.rocketRightEdge+thrustLength, this.rocketUpHalf+thrustRedius, this.rocketRightEdge+thrustLength, this.rocketUpHalf-thrustRedius)
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
    readonly proximitySensorsColor: number;
    readonly defaultProximitySensorsValue: number = 100;

    constructor() {
        this.proximitySensorsColor = Color.GetHexFromRGB(255, 255, 255);
    }

    fronLeftProximitySensors: number = this.defaultProximitySensorsValue;
    fronProximitySensors: number = this.defaultProximitySensorsValue;
    fronRightProximitySensors: number = this.defaultProximitySensorsValue;

    leftProximitySensors: number = this.defaultProximitySensorsValue;
    rightProximitySensors: number = this.defaultProximitySensorsValue;

    rearLeftProximitySensors: number = this.defaultProximitySensorsValue;
    rearProximitySensors: number = this.defaultProximitySensorsValue;
    rearRightProximitySensors: number = this.defaultProximitySensorsValue;

    gyroscope: number = 0;

    ySpeedometer: number = 0;
    xSpeedometer: number = 0;

    excalorator: number = 0;

    drawFronProximitySensors(rocket: Rocket){
        rocket.drawLineByAngle(0, rocket.rocketTop, this.fronProximitySensors, -90, this.proximitySensorsColor, 0.5);
    }
    drawFronLeftProximitySensors(rocket: Rocket){
        rocket.drawLineByAngle(rocket.rocketLeftEdge, rocket.rocketTop, this.leftProximitySensors, -(90+45), this.proximitySensorsColor, 0.5);
    }
    drawFronRightProximitySensors(rocket: Rocket){
        rocket.drawLineByAngle(rocket.rocketRightEdge, rocket.rocketTop, this.rightProximitySensors, -45, this.proximitySensorsColor, 0.5);
    }

    drawLeftProximitySensors(rocket: Rocket){
        rocket.drawLineByAngle(rocket.rocketLeftEdge, 0, this.leftProximitySensors, -180, this.proximitySensorsColor, 0.5);
    }
    drawRightProximitySensors(rocket: Rocket){
        rocket.drawLineByAngle(rocket.rocketRightEdge, 0, this.rightProximitySensors, 0, this.proximitySensorsColor, 0.5);
    }

    drawRearProximitySensors(rocket: Rocket){
        rocket.drawLineByAngle(0, rocket.rocketBottom, this.rearProximitySensors, 90, this.proximitySensorsColor, 0.5);
    }
    drawRearLeftProximitySensors(rocket: Rocket){
        rocket.drawLineByAngle(rocket.rocketLeftEdge, rocket.rocketBottom, this.rearLeftProximitySensors, 90+54, this.proximitySensorsColor, 0.5);
    }
    drawRearRightProximitySensors(rocket: Rocket){
        rocket.drawLineByAngle(rocket.rocketRightEdge, rocket.rocketBottom, this.rearRightProximitySensors, 45, this.proximitySensorsColor, 0.5);
    }
}