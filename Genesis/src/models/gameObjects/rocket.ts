import { Vector } from "matter";
import { Color } from "../color";
import { GameObjectBase } from "./gameObjectBase";
import { CustomLine } from "../gyometry/customLine";
import { ProximitySensor } from "./proximitySensor";
import { MatterCategory } from "../matterCategory";

export class Rocket extends GameObjectBase {
    
    width: number = 20;
    height: number = 50;
    physicBodyCategory: number;

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


    constructor(scene: Phaser.Scene, x: number, y: number, matterCategory: MatterCategory) {
        super(scene, x, y);

        this.generateTexture('rocket');

        this.rocketLeftEdge = -this.width / 2;
        this.rocketRightEdge = this.width / 2;
        this.rocketUpHalf = -this.height / 4;
        this.rocketTop = -this.height / 2;
        this.rocketBottom = this.height / 2;

        this.sensor = new RocketSensor(this);

        this.drawRocket();

        this.physicBody = scene.matter.add.sprite(x, y, 'rocket', '', {
            shape: {
                type: 'rectangle',
                width: this.width,
                height: this.height,
            },
            restitution: 0.5,
            collisionFilter: {
                category: matterCategory.rocket,
                mask: matterCategory.static,
            }
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
    }
    drawThrust(): void {
        this.fillStyle(0xffa500, 1);
        const thrustLength = this.height /2 + this.width;
        const rocketMidX = 0;
        this.fillTriangle(rocketMidX, this.rocketBottom, this.rocketLeftEdge, this.rocketBottom+thrustLength, this.rocketRightEdge, this.rocketBottom+thrustLength);
    }
    drawThrustLeft(): void{
        this.fillStyle(Color.GetHexFromRGB(255,255,255), 1);
        const thrustLength = this.width/2;
        const thrustRedius = (this.width/4);
        this.fillTriangle(this.rocketLeftEdge, this.rocketUpHalf, this.rocketLeftEdge-thrustLength, this.rocketUpHalf+thrustRedius, this.rocketLeftEdge-thrustLength, this.rocketUpHalf-thrustRedius);
    }
    drawThrustRight(): void{
        this.fillStyle(Color.GetHexFromRGB(255,255,255), 1);
        const thrustLength = this.width/2;
        const thrustRedius = (this.width/4);
        this.fillTriangle(this.rocketRightEdge, this.rocketUpHalf, this.rocketRightEdge+thrustLength, this.rocketUpHalf+thrustRedius, this.rocketRightEdge+thrustLength, this.rocketUpHalf-thrustRedius);
    }

    override update(interactiveSerfaces: Phaser.Geom.Line[], ...args: any[]): void {
        this.x = this.physicBody.x;
        this.y = this.physicBody.y;
        this.rotation = this.physicBody.rotation;

        this.sensor.fronLeftProximitySensors.update(interactiveSerfaces);
        this.sensor.fronProximitySensors.update(interactiveSerfaces);
        this.sensor.fronRightProximitySensors.update(interactiveSerfaces);

        this.sensor.leftProximitySensors.update(interactiveSerfaces);
        this.sensor.rightProximitySensors.update(interactiveSerfaces);

        this.sensor.rearLeftProximitySensors.update(interactiveSerfaces);
        this.sensor.rearProximitySensors.update(interactiveSerfaces);
        this.sensor.rearRightProximitySensors.update(interactiveSerfaces);

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
    readonly defaultProximitySensorsValue: number = 200;

    fronLeftProximitySensors: ProximitySensor;
    fronProximitySensors: ProximitySensor;
    fronRightProximitySensors: ProximitySensor;

    leftProximitySensors: ProximitySensor;
    rightProximitySensors: ProximitySensor;

    rearLeftProximitySensors: ProximitySensor;
    rearProximitySensors: ProximitySensor;
    rearRightProximitySensors: ProximitySensor;

    gyroscope: number = 0;

    ySpeedometer: number = 0;
    xSpeedometer: number = 0;

    excalorator: number = 0;

    constructor(rocket: Rocket) {
        
        this.fronLeftProximitySensors = new ProximitySensor(rocket.scene, rocket, (-rocket.width/2)+1,(-rocket.height/2)+1, -(90+45), this.defaultProximitySensorsValue);
        this.fronProximitySensors = new ProximitySensor(rocket.scene, rocket, 0, (-rocket.height/2)+1, -90, this.defaultProximitySensorsValue);
        this.fronRightProximitySensors = new ProximitySensor(rocket.scene, rocket, (rocket.width/2)-1, (-rocket.height/2)+1, -45, this.defaultProximitySensorsValue);

        this.leftProximitySensors = new ProximitySensor(rocket.scene, rocket, (-rocket.width/2)+1, 0, -180, this.defaultProximitySensorsValue);
        this.rightProximitySensors = new ProximitySensor(rocket.scene, rocket, (rocket.width/2)-1, 0, 0, this.defaultProximitySensorsValue);

        this.rearLeftProximitySensors = new ProximitySensor(rocket.scene, rocket, (-rocket.width/2)+1, (rocket.height/2)-1, 90+45, this.defaultProximitySensorsValue);
        this.rearProximitySensors = new ProximitySensor(rocket.scene, rocket, 0, (rocket.height/2)-1, 90, this.defaultProximitySensorsValue);
        this.rearRightProximitySensors = new ProximitySensor(rocket.scene, rocket ,(rocket.width/2)-1, (rocket.height/2)-1, 45, this.defaultProximitySensorsValue);
    }

    
}