import { Vector } from "matter";
import { Color } from "../color";
import { GameObjectBase } from "./gameObjectBase";
import { CustomLine } from "../gyometry/customLine";
import { ProximitySensor } from "./proximitySensor";
import { MatterCategory } from "../matterCategory";
import { WayPoint } from "./wayPoint";
import { deserializeNeuralNetwork, NeuralNetwork } from "../ai/neuralNetwork";
import { Clock } from "../clock";
import { PerformanceScore } from "../performentScore";

export class Rocket extends GameObjectBase {
    
    width: number = 20;
    height: number = 50;
    previousSpeed: number = 0;
    previousPosition: Phaser.Math.Vector2;
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

    score: number = 0;

    clock: Clock;

    id: number = 0;

    isBroken: boolean = false;
    acceleration: number = 0;
    accelerationThreshold: number = 40;

    lastLoopCheckTimeInSec: number = 0;
    loopCheckIntervalInSec: number = 5;
    markLoopPosition: Phaser.Math.Vector2;
    loopCounter: number = 0;
    LostScore: number = 0;



    constructor(id: number, scene: Phaser.Scene, x: number, y: number, matterCategory: MatterCategory, neuralNetworkAsJson: string = '', mutationRate: number = 0.5) {
        super(scene, x, y);
        this.id = id;
        this.previousPosition = new Phaser.Math.Vector2(x, y);
        this.markLoopPosition = new Phaser.Math.Vector2(x, y);
        this.clock = new Clock();;
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
        this.neuralNetwork.mutate(mutationRate);
    }
    //#region Update
    override update(interactiveSerfaces: Phaser.Geom.Line[], wayPoint: WayPoint, ...args: any[]): void {
        this.clock.aging();
        this.sensing(interactiveSerfaces, wayPoint);
        if(!this.isBroken){
            this.scorePerformace();
            this.checkIfRocketIsBroken();
            this.feedSensorsValuesIntoNeuralNetwork();
            this.excuteNeuralNetworkOutputs();
        }
        this.syncWithPhysicalBody();
        super.update(...args);
        this.drawRocket();
        this.resetThruster();
    }
    //#endregion Update
    checkIfRocketIsBroken() {
        if(!this.isBroken) {
            let isCrashTooHard = this.acceleration > this.accelerationThreshold;
            this.isBroken = isCrashTooHard;
        }
    }
    scorePerformace() {
        this.scoreWhenRocketIsUpright();
        this.scoreWhenRocketIsGettingCloserToWayPoint();
        this.scoreWhenNothingIsTouchingOrCloseToTheFront();
        this.scoreWhenNothingIsTouchingOrCloseToTheSides();
        this.scoreWhenRocketIsStillInTheAirWhileNotCloseToTheWayPoint();
        this.scoreWhenRocketNotSpinningTooFast();
        this.minusScoreWhenRocketCrashed();
        this.scoreWhenRocketApproachingCloseToWayPointSmoothly();
        this.minusScoreWhenRocketGoingInLoops();
        this.minusScoreWhenRocketFireBothSideThrusterAtTheSameTime();
        this.scoreWhenRocketFireOnlyOneSideThrusterAtTheSameTime();
    }
    scoreWhenRocketFireOnlyOneSideThrusterAtTheSameTime() {
        if((this.isThrustingLeft && !this.isThrustingRight) || (!this.isThrustingLeft && this.isThrustingRight)) {
            this.addScore(PerformanceScore.FireOnlyOneSideThrusterAtTheSameTime);
        }
    }
    minusScoreWhenRocketFireBothSideThrusterAtTheSameTime() {
        if(this.isThrustingLeft && this.isThrustingRight) {
            this.addScore(PerformanceScore.FireBothSideThrusterAtTheSameTime);
        }
    }
    minusScoreWhenRocketGoingInLoops() {
        if(this.clock.ageInSec - this.lastLoopCheckTimeInSec > this.loopCheckIntervalInSec) {
            this.lastLoopCheckTimeInSec = this.clock.ageInSec;
            this.markLoopPosition = new Phaser.Math.Vector2(this.x, this.y);
        }else{
            if(this.isCloseBy(this.x, this.markLoopPosition.x, 3) && this.isCloseBy(this.y, this.markLoopPosition.y, 3)) {
            this.addScore(PerformanceScore.RocketIsGoingInLoop);
            this.loopCounter++;
            }
            if(this.loopCounter > 300) {
                this.isBroken = true;
            }
        }
        
    }
    isCloseBy(axes1: number, axes2: number, threshold: number) {
        return Math.abs(axes1 - axes2) < threshold;
    }
    scoreWhenRocketApproachingCloseToWayPointSmoothly() {
        let isCloseToWayPoint = this.sensor.waypointDistance < 200;
        let isAtSlowSpeed = this.getCurrentSpeed() < 50;
        if(isCloseToWayPoint && isAtSlowSpeed) {
            this.addScore(PerformanceScore.GettingCloserToWayPointSmoothly);
        }
        if(isCloseToWayPoint && !isAtSlowSpeed) {
            this.addScore(PerformanceScore.GettingCloserToWayPointNotSmoothly);
        }
    }
    minusScoreWhenRocketCrashed() {
        let currentSpeed = this.getCurrentSpeed();
        let deltaVelocity = Math.abs(currentSpeed - this.previousSpeed);
        this.previousSpeed = currentSpeed;
        let deltaTimeInMilliSec = this.clock.deltaTimeInMilliSec;
        this.acceleration = deltaVelocity/(deltaTimeInMilliSec);
        let isCrashToTheLeft = this.sensor.leftProximitySensors.currentValue < this.sensor.defaultProximitySensorsValue/10;
        let isCrashToTheRight = this.sensor.rightProximitySensors.currentValue < this.sensor.defaultProximitySensorsValue/10;
        if(this.acceleration > this.accelerationThreshold){
            this.addScore(PerformanceScore.Crash);
        }
        if(isCrashToTheLeft) {
            this.addScore(PerformanceScore.Crash);
            this.isBroken = true;
        }
        if(isCrashToTheRight) {
            this.addScore(PerformanceScore.Crash);
            this.isBroken = true;
        }
    }
    getCurrentSpeed() {
        let traveledDistance = Math.abs(Phaser.Math.Distance.Between(this.x, this.y, this.previousPosition.x, this.previousPosition.y));
        return traveledDistance / (this.clock.deltaTimeInMilliSec/1000);
    }
    scoreWhenRocketNotSpinningTooFast() {
        this.physicBody.getAngularSpeed() < 0.09 ? this.addScore(PerformanceScore.NotSpinningTooFast) : this.addScore(PerformanceScore.SpinningTooFast);
    }
    scoreWhenRocketIsStillInTheAirWhileNotCloseToTheWayPoint() {
        if(this.sensor.rearProximitySensors.currentValue > (this.sensor.defaultProximitySensorsValue/4) && this.sensor.waypointDistance > 20) {
            this.addScore(PerformanceScore.WhenRocketIsStillInTheAirWhileNotCloseToTheWayPoint);
        }
    }
    scoreWhenNothingIsTouchingOrCloseToTheSides() {
        let isLeftCloseOrTouching = this.sensor.leftProximitySensors.currentValue < (this.sensor.defaultProximitySensorsValue/4);
        let isRightCloseOrTouching = this.sensor.rightProximitySensors.currentValue < (this.sensor.defaultProximitySensorsValue/4);
        if(!isLeftCloseOrTouching) {
            this.addScore(PerformanceScore.NotAboutToCrash);
        }
        if(isLeftCloseOrTouching) {
            this.addScore(PerformanceScore.AboutToCrash);
        }
        if(!isRightCloseOrTouching) {
            this.addScore(PerformanceScore.NotAboutToCrash);
        }
        if(isRightCloseOrTouching) {
            this.addScore(PerformanceScore.AboutToCrash);
        }
    }
    scoreWhenNothingIsTouchingOrCloseToTheFront() {
        let isCloseOrTouching = this.sensor.fronProximitySensors.currentValue < (this.sensor.defaultProximitySensorsValue/4);
        if(!isCloseOrTouching) {
            this.addScore(PerformanceScore.NotAboutToCrash);
        }
        if(isCloseOrTouching) {
            this.addScore(PerformanceScore.AboutToCrash);
        }
    }
    scoreWhenRocketIsGettingCloserToWayPoint() {
        if (this.sensor.getDeltaDistanceFromWayPoint() > 0){
            this.addScore(PerformanceScore.GettingCloserToWayPoint);
        }
        if (this.sensor.getDeltaDistanceFromWayPoint() < 0){
            this.addScore(PerformanceScore.GettingAwayFromWayPoint);
        }
    }
    scoreWhenRocketIsUpright() {
        if (Phaser.Math.RadToDeg(this.rotation) < 90 || Phaser.Math.RadToDeg(this.rotation) > -90) {
            this.addScore(PerformanceScore.Upright);
        }
    }

    addScore(value: number) {
        this.score += value;
        this.LostScore += value < 0 ? Math.abs(value) : 0;
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
        if(this.isBroken) {
            this.lineStyle(2, 0x000000, 1);
            this.strokeRect(-this.width / 2 - 2, -this.height / 2 - 2, this.width + 4, this.height + 4);
            this.lineStyle(2, 0xFFFFFF, 1);
            this.strokeRect(-this.width / 2 - 1, -this.height / 2 - 1, this.width + 2, this.height + 2);
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
        this.previousPosition.x = this.x;
        this.previousPosition.y = this.y;
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

        this.sensor.updateDistanceWayPoint(Phaser.Math.Distance.Between(this.x, this.y, waypoint.x, waypoint.y));
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
    override destroy(fromScene?: boolean): void {
        this.sensor.fronLeftProximitySensors.destroy();
        this.sensor.fronProximitySensors.destroy();
        this.sensor.fronRightProximitySensors.destroy();

        this.sensor.leftProximitySensors.destroy();
        this.sensor.rightProximitySensors.destroy();

        this.sensor.rearLeftProximitySensors.destroy();
        this.sensor.rearProximitySensors.destroy();
        this.sensor.rearRightProximitySensors.destroy();

        this.physicBody.destroy(fromScene);

        super.destroy(fromScene);
    }
    markAsBest() {
        this.lineStyle(2, 0xFFFF00, 1);
        this.strokeRect(-this.width / 2 - 2, -this.height / 2 - 2, this.width + 4, this.height + 4);
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
    previousWaypointDistance: number = 0;
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

    getDeltaDistanceFromWayPoint() {
        return this.previousWaypointDistance - this.waypointDistance;
    }

    updateDistanceWayPoint(current: number) {
        this.previousWaypointDistance = this.waypointDistance;
        this.waypointDistance = current;
    }
}