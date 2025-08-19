import { CustomLine } from "../gyometry/customLine";
import { GameObjectBase } from "./gameObjectBase";

export class ProximitySensor extends GameObjectBase {
    x: number;
    y: number;
    aimingAngle: number;
    defaultProximitySensorsValue: number;
    currentValue: number;
    gameobjectThatWouldAttachOn: GameObjectBase;
    proximitySensorsColor: number;
    relativeX: number;
    relativeY: number;
    constructor(scene: Phaser.Scene, gameobjectTheWouldAttachOn: GameObjectBase, x: number, y: number, aimingAngle: number, defaultProximitySensorsValue: number = 200){
        super(scene, x, y);
        this.x = gameobjectTheWouldAttachOn.x + x;
        this.y = gameobjectTheWouldAttachOn.y + y;
        this.relativeX = x;
        this.relativeY = y;
        this.aimingAngle = aimingAngle;
        this.defaultProximitySensorsValue = defaultProximitySensorsValue;
        this.gameobjectThatWouldAttachOn = gameobjectTheWouldAttachOn;
        this.currentValue = defaultProximitySensorsValue;
        this.proximitySensorsColor = 0x00FF00;
    }

    drawProximitySensors(){
        this.clear();
        this.drawLineByAngle(0, 0, this.currentValue, this.aimingAngle, this.proximitySensorsColor, 0.5);
    }

    sensProximitySensors(interactiveSerfaces: Phaser.Geom.Line[]) {
        let proximityLine = CustomLine.CreateLineByAngle(this.x, this.y, Phaser.Math.RadToDeg(this.gameobjectThatWouldAttachOn.rotation) + this.aimingAngle, this.defaultProximitySensorsValue);
        this.currentValue = this.defaultProximitySensorsValue;
        interactiveSerfaces.forEach((surface) => {
            let intersectedPoint = new Phaser.Math.Vector2();
            if(Phaser.Geom.Intersects.LineToLine(proximityLine, surface, intersectedPoint)) {
                let newValue = Phaser.Math.Distance.Between(this.x, this.y, intersectedPoint.x, intersectedPoint.y);
                if(newValue < this.currentValue) {
                    this.currentValue = newValue;
                }
            }
        });
    }

    override update(interactiveSerfaces: Phaser.Geom.Line[], ...args: any[]): void {
        this.syncPositionWithGameObject();
        this.sensProximitySensors(interactiveSerfaces);
        super.update(...args);
        this.drawProximitySensors();
    }
    syncPositionWithGameObject() {
        let cos = Math.cos(this.gameobjectThatWouldAttachOn.rotation);
        let sin = Math.sin(this.gameobjectThatWouldAttachOn.rotation);

        this.x = this.gameobjectThatWouldAttachOn.x + (cos * this.relativeX - sin * this.relativeY);
        this.y = this.gameobjectThatWouldAttachOn.y + (sin * this.relativeX + cos * this.relativeY);

        this.rotation = this.gameobjectThatWouldAttachOn.rotation;
    }
}