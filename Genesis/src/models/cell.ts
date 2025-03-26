import { GameObjects } from "phaser";
import { InternalClock } from "./internalClock";
import { ColorUtils } from "@/utils/colorUtils";
import { NeuralNetwork } from "./ai/neuralNetwork";
import { CellTypeEnum } from "./enums/cellTypeEnum";

export class Cell extends GameObjects.Graphics {
    public radius: number = 5;
    public color: number;
    public colorR: number = 0;
    public colorG: number = 0;
    public colorB: number = 0;
    public isAlive: boolean = true;
    public speed: number = 1;
    public clock: InternalClock;
    public neuronNetwork: NeuralNetwork;
    public id: number;
    public maxRadius: number = 16;
    public cellType: CellTypeEnum;

    constructor(
        scene: Phaser.Scene, 
        viewWidth: number, 
        viewHeight: number, 
        id: number,
        posistionX: number = 0,
        posistionY: number = 0,
        cellType: CellTypeEnum = CellTypeEnum.omnivore,
        colors: number[] = []
    ) {
        super(scene);
        this.cellType = cellType;
        this.angle = Phaser.Math.DegToRad(0);
        this.getColor(colors);
        this.draw();
        this.addToDisplayList();
        this.x = posistionX === 0 ? Phaser.Math.Between(0, viewWidth) : posistionX;
        this.y = posistionY === 0 ? Phaser.Math.Between(0, viewHeight) : posistionY;
        this.clock = new InternalClock();
        this.neuronNetwork = new NeuralNetwork([9, 4, 4, 2, 1]);
        this.neuronNetwork.mutate(0.1);
        this.id = id;
    }
    draw() {
        this.clear();
        this.fillStyle(this.color)
        this.fillCircle(0, 0, this.radius);
    }
    getColor(colors: number[]): void {
        if(this.cellType === CellTypeEnum.plant) {
            this.colorR = 0;
            this.colorG = 255;
            this.colorB = 0;
        } else {
        this.colorR = colors.length > 0 ? colors[0] + Phaser.Math.Between(-1, 1) : Phaser.Math.Between(50, 255);
        this.colorG = colors.length > 0 ? colors[1] + Phaser.Math.Between(-1, 1) : Phaser.Math.Between(50, 255);
        this.colorB = colors.length > 0 ? colors[2] + Phaser.Math.Between(-1, 1) : Phaser.Math.Between(50, 255);
        }
        this.color = ColorUtils.rgbToHex(this.colorR, this.colorG, this.colorB);
    }

    public move(dEngle: number): void {
        this.angle += dEngle;
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
        this.radius -= 0.001;
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
            sensory.cellId = closestCell.id;
            sensory.cellType = closestCell.cellType;
            sensory.isSensing = true;
        }
        return sensory;
    }

    override update(...args: any[]): void {
        this.handleDeath();

        if(this.cellType !== CellTypeEnum.plant) {
            let sensory = this.Senc(...args[0]);
            let neuronOutPut = this.neuronNetwork.feedForward(
                [
                    sensory.angle, 
                    sensory.distance, 
                    sensory.colorR, 
                    sensory.colorG, 
                    sensory.colorB, 
                    sensory.radius, 
                    sensory.isAlive ? 1 : 0, 
                    sensory.speed,
                    this.radius,
                ]);
                let dEngle = neuronOutPut[0] * 5;
                this.handleEating(sensory,...args[0]);
                this.handleReproduction(...args[0]);
                this.move(dEngle);
        }
        
        this.draw();
        super.update(...args);
    }
    public handleReproduction(cells: Cell[] = []): void {
        if(cells){
            if(this.radius >= this.maxRadius -1) {
                let cell = new Cell(this.scene, 800, 600, cells.length, this.x, this.y, this.cellType, [this.colorR, this.colorG, this.colorB]);
                cells.push(cell);
                this.radius = this.radius / 2;
            }
        }
    }
    public handleDeath(): void {
        if(this.radius <= 2) {
            this.destroy();
        }
    }
    
    public handleEating(sensory: CellSensory, neiborCells: Cell[] = []): void {
        if(
            (sensory.isSensing)
            &&
            (this.radius < this.maxRadius)
            &&
            (sensory.distance - sensory.radius - this.radius <= 0)
            &&
            (
                (sensory.cellType === CellTypeEnum.plant) || ((sensory.radius < this.radius) && (this.isDifferentColor(sensory.colorR, sensory.colorG, sensory.colorB)))
            )
        ){
            let cell = neiborCells.find(cell => cell.id === sensory.cellId);
            if(cell && cell.isAlive) {
                if(cell.radius > 0){
                    let energyBefore = cell.radius; 
                    cell.radius -= 1;
                    let energyAfter = cell.radius;
                    this.radius += energyBefore - energyAfter;
                }
            }
        }
    }
    isDifferentColor(colorR: number, colorG: number, colorB: number): boolean {
        let dR = Math.abs(this.colorR - colorR);
        let dG = Math.abs(this.colorG - colorG);
        let dB = Math.abs(this.colorB - colorB);
        return dR + dG + dB > 35;
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
    public cellId: number = 0;
    public cellType: CellTypeEnum = CellTypeEnum.omnivore;
    public isSensing: boolean = false;
}