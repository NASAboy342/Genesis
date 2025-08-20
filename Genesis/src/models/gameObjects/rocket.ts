import { Vector } from "matter";
import { Color } from "../color";
import { GameObjectBase } from "./gameObjectBase";
import { CustomLine } from "../gyometry/customLine";
import { ProximitySensor } from "./proximitySensor";
import { MatterCategory } from "../matterCategory";
import { WayPoint } from "./wayPoint";
import { deserializeNeuralNetwork, NeuralNetwork } from "../ai/neuralNetwork";

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

    neuralNetwork: NeuralNetwork;
    neuralOutputs: number[] = [];


    constructor(scene: Phaser.Scene, x: number, y: number, matterCategory: MatterCategory, neuralNetworkAsJson: string = '') {
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

        this.neuralNetwork = neuralNetworkAsJson === '' ? new NeuralNetwork([13, 9, 9, 9, 6, 3]) : deserializeNeuralNetwork(neuralNetworkAsJson);
        this.neuralNetwork.mutate(0.1);
    }
    //#region Update
    override update(interactiveSerfaces: Phaser.Geom.Line[], wayPoint: WayPoint, ...args: any[]): void {
        this.sensing(interactiveSerfaces, wayPoint);
        this.feedSensorsValuesIntoNeuralNetwork();
        this.excuteNeuralNetworkOutputs();
        this.syncWithPhysicalBody();
        super.update(...args);
        this.drawRocket();
        this.resetThruster();
    }
    
    //#endregion Update

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
    
    private resetThruster() {
        this.isThrusting = false;
        this.isThrustingLeft = false;
        this.isThrustingRight = false;
    }

    private syncWithPhysicalBody() {
        this.x = this.physicBody.x;
        this.y = this.physicBody.y;
        this.rotation = this.physicBody.rotation;
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
    private sensing(interactiveSerfaces: Phaser.Geom.Line[], waypoint: WayPoint) {
        this.sensor.fronLeftProximitySensors.update(interactiveSerfaces);
        this.sensor.fronProximitySensors.update(interactiveSerfaces);
        this.sensor.fronRightProximitySensors.update(interactiveSerfaces);

        this.sensor.leftProximitySensors.update(interactiveSerfaces);
        this.sensor.rightProximitySensors.update(interactiveSerfaces);

        this.sensor.rearLeftProximitySensors.update(interactiveSerfaces);
        this.sensor.rearProximitySensors.update(interactiveSerfaces);
        this.sensor.rearRightProximitySensors.update(interactiveSerfaces);

        this.sensor.gyroscope = Phaser.Math.RadToDeg(this.physicBody.rotation);
        this.sensor.xSpeedometer = this.physicBody.getVelocity().x;
        this.sensor.ySpeedometer = this.physicBody.getVelocity().y;

        this.sensor.waypointDistance = Phaser.Math.Distance.Between(this.x, this.y, waypoint.x, waypoint.y);
        this.sensor.waypointAngle = Phaser.Math.Angle.Wrap(Phaser.Math.Angle.Between(this.x, this.y, waypoint.x, waypoint.y) + Phaser.Math.DegToRad(-90) - this.rotation);
    }
    //#endregion Rocket sensors
    feedSensorsValuesIntoNeuralNetwork() {
        let inputs = [
            this.sensor.fronLeftProximitySensors.currentValue,
            this.sensor.fronProximitySensors.currentValue,
            this.sensor.fronRightProximitySensors.currentValue,
            this.sensor.leftProximitySensors.currentValue,
            this.sensor.rightProximitySensors.currentValue,
            this.sensor.rearLeftProximitySensors.currentValue,
            this.sensor.rearProximitySensors.currentValue,
            this.sensor.rearRightProximitySensors.currentValue,
            this.sensor.gyroscope,
            this.sensor.xSpeedometer,
            this.sensor.ySpeedometer,
            this.sensor.waypointDistance,
            this.sensor.waypointAngle
        ]
        this.neuralOutputs = this.neuralNetwork.feedForward(inputs);
    }
    excuteNeuralNetworkOutputs() {
        if(this.neuralOutputs[0] > 0.5){
            this.handleThrust();
        }
        if(this.neuralOutputs[1] > 0.5){
            this.stearRight();
        }
        if(this.neuralOutputs[2] > 0.5){
            this.stearLeft();
        }
    }
}

export class RocketSensor{
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
    waypointDistance: number = 0;
    waypointAngle: number = 0;

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