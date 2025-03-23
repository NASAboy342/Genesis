import { GameObjects } from "phaser";
import { InternalClock } from "./internalClock";
import { ColorUtils } from "@/utils/colorUtils";
import { NeuralNetwork } from "./ai/neuralNetwork";

export class Cell extends GameObjects.Graphics {
    public radius: number = 10;
    public color: number;
    public isAlive: boolean = true;
    public speed: number = 1;
    public clock: InternalClock;
    public neuronNetwork: NeuralNetwork;
    public id: number;

    constructor(scene: Phaser.Scene, viewWidth: number, viewHeight: number, id: number) {
        super(scene);
        this.angle = Phaser.Math.DegToRad(0);
        this.color = ColorUtils.rgbToHex(Phaser.Math.Between(100, 255), Phaser.Math.Between(100, 255), Phaser.Math.Between(100, 255));
        this.radius = Phaser.Math.Between(2, 10);
        this.fillStyle(this.color)
        this.fillCircle(this.x, this.y, this.radius);
        this.addToDisplayList();
        this.x = viewWidth / 2;
        this.y = viewHeight / 2;
        this.clock = new InternalClock();
        this.neuronNetwork = new NeuralNetwork([8, 4, 1]);
        this.id = id;
    }

    //move randomly
    public move(): void {
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
    }
    private Senc(neiborCells: Cell[] = []): CellSensory {
        let sensory = new CellSensory();
        if(neiborCells.length > 0) {
            let closestCell = neiborCells
            .filter(cell => cell.id !== this.id && Phaser.Math.Distance.Between(this.x, this.y, cell.x, cell.y) < this.radius * 3)
            .sort((a,b) => Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y) - Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y) )[0];
            if(!closestCell) {
                return sensory;
            }
            sensory.angle = Phaser.Math.Angle.Between(this.x, this.y, closestCell.x, closestCell.y);
            sensory.distance = Phaser.Math.Distance.Between(this.x, this.y, closestCell.x, closestCell.y);
            let color = ColorUtils.hexToRgb(closestCell.color);
            sensory.colorR = color.r;
            sensory.colorG = color.g;
            sensory.colorB = color.b;
            sensory.radius = closestCell.radius;
            sensory.isAlive = closestCell.isAlive;
            sensory.speed = closestCell.speed;
        }
        return sensory;
    }

    override update(...args: any[]): void {
        let sensory = this.Senc(...args[0]);
        let neuronOutPut = this.neuronNetwork.feedForward([sensory.angle, sensory.distance, sensory.colorR, sensory.colorG, sensory.colorB, sensory.radius, sensory.isAlive ? 1 : 0, sensory.speed]);
        this.angle += neuronOutPut[0] * 5;
        this.move();
        super.update(...args);
    }
    
}

class CellSensory{
    public angle: number = 0;
    public distance: number = 0;
    public colorR: number = 0;
    public colorG: number = 0;
    public colorB: number = 0;
    public radius: number = 0;
    public isAlive: boolean = false;
    public speed: number = 0;
}