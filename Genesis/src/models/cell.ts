import { GameObjects } from "phaser";
import { InternalClock } from "./internalClock";
import { ColorUtils } from "@/utils/colorUtils";
import { deserializeNeuralNetwork, NeuralNetwork, serializeNeuralNetwork } from "./ai/neuralNetwork";
import { CellTypeEnum } from "./enums/cellTypeEnum";
import { MathUtils } from "@/utils/mathUtils";
import { plainToInstance } from "class-transformer";

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
    public lastTimeEaten: number = 0;
    public isMarked: boolean = false;
    public markedOnAge: number = 0;
    public markForInSec: number = 0;
    public lastTimeMutated: number = 0;
    public mutationIntervalInSec: number = 5;
    public successPoints: number = 0;

    constructor(
        scene: Phaser.Scene, 
        viewWidth: number, 
        viewHeight: number, 
        id: number,
        posistionX: number = 0,
        posistionY: number = 0,
        cellType: CellTypeEnum = CellTypeEnum.omnivore,
        colors: number[] = [],
        neuronNetworkInJson: string = ""
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
        this.neuronNetwork = neuronNetworkInJson === "" ? new NeuralNetwork([11, 15, 10, 4, 2]) : deserializeNeuralNetwork(neuronNetworkInJson);
        this.neuronNetwork.mutate(0.5);
        this.id = id;
        this.successPoints += neuronNetworkInJson !== "" ? 1 : 0;
    }
    draw() {
        this.clear();
        if(this.isMarked) {
            this.fillStyle(ColorUtils.rgbToHex(255, 255, 255), 0.3);
            this.fillCircle(0, 0, this.radius + 5);
        }
        
        this.fillStyle(this.color)
        this.fillCircle(0, 0, this.radius);

    }
    getColor(colors: number[]): void {
        if(this.cellType === CellTypeEnum.plant) {
            this.colorR = 0;
            this.colorG = 255;
            this.colorB = 0;
        } else {
            this.colorR = colors.length > 0 ? ColorUtils.addColorValue(colors[0], Phaser.Math.Between(-20, 20)) : Phaser.Math.Between(50, 255);
            this.colorG = colors.length > 0 ? ColorUtils.addColorValue(colors[1], Phaser.Math.Between(-20, 20)) : Phaser.Math.Between(50, 255);
            this.colorB = colors.length > 0 ? ColorUtils.addColorValue(colors[2], Phaser.Math.Between(-20, 20)) : Phaser.Math.Between(50, 255);
        }
        this.color = ColorUtils.rgbToHex(this.colorR, this.colorG, this.colorB);
    }

    public move(dEngle: number, speedToMove: number): void {
        this.angle += dEngle;
        this.speed = speedToMove;
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
        this.radius -= this.speed * 0.0005 + 0.0001;
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
            this.successPoints += 0.00001;
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
                    this.angle,
                    this.speed
                ]);
                let dEngle =  MathUtils.SigmoidToMinMax(neuronOutPut[0], -5, 5);
                let speedToMove = MathUtils.SigmoidToMinMax(neuronOutPut[1], 0, 2);
                this.handleEating(sensory,...args[0]);
                this.handleReproduction(...args[0]);
                this.move(dEngle, speedToMove);
                this.clock.aging();
                this.handleToUnMark();
        }
        
        this.draw();
        super.update(...args);
    }
    public handleToUnMark() {
        if(this.isMarked) {
            if((this.clock.ageInSec - this.markedOnAge) > this.markForInSec) {
                this.isMarked = false;
                this.markedOnAge = 0;
                this.markForInSec = 0;
            }
        }
    }
    public handleReproduction(cells: Cell[] = []): void {
        try{
            if(cells){
                if(this.radius >= this.maxRadius -1) {
                    for(let i = 0; i <= 1; i++){
                        let cell = new Cell(this.scene, 800, 600, cells.length, this.x, this.y, this.cellType, [this.colorR, this.colorG, this.colorB], serializeNeuralNetwork(this.neuronNetwork));
                        cells.push(cell);
                        this.radius = this.radius / 2;
                        this.successPoints += 1;
                    }
                }
            }
        }
        catch(e) {
            console.log(e);
        }
    }
    public handleDeath(): void {
        if(this.radius <= 2) {
            this.isAlive = false;
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
                    this.lastTimeEaten = this.clock.ageInSec;
                    this.successPoints += 0.1;
                }
            }
        }
        else{
            if(this.clock.ageInSec - this.lastTimeEaten > 10) {
                this.handleMutation(0.5);
            }
        }
    }
    public handleMutation(rate: number) {
        if(this.clock.ageInSec - this.lastTimeMutated > this.mutationIntervalInSec) {
            this.neuronNetwork.mutate(rate);
            this.lastTimeMutated = this.clock.ageInSec;
            this.markFor(1);
        }
    }
    public markFor(sec: number) {
        this.isMarked = true;
        this.markedOnAge = this.clock.ageInSec + 0;
        this.markForInSec = sec;
    }
    isDifferentColor(colorR: number, colorG: number, colorB: number): boolean {
        let cellColors = [
            {
                c: 1,
                v: this.colorR
            },
            {
                c: 2,
                v: this.colorG
            },
            {
                c: 3,
                v: this.colorB
            },
        ]

        let neiborCellColors = [
            {
                c: 1,
                v: colorR
            },
            {
                c: 2,
                v: colorG
            },
            {
                c: 3,
                v: colorB
            },
        ]

        cellColors = cellColors.sort((a, b) => b.v - a.v);
        neiborCellColors = neiborCellColors.sort((a, b) => b.v - a.v );

        if(cellColors[0].c === 1 && neiborCellColors[0].c === 2)
            return true;
        if(cellColors[0].c === 2 && neiborCellColors[0].c === 3)
            return true;
        if(cellColors[0].c === 3 && neiborCellColors[0].c === 1)
            return true;
        return false;
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