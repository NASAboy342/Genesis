import { GameObjects } from "phaser";
import { InternalClock } from "./internalClock";
import { ColorUtils } from "@/utils/colorUtils";
import { deserializeNeuralNetwork, NeuralNetwork, serializeNeuralNetwork } from "./ai/neuralNetwork";
import { CellTypeEnum } from "./enums/cellTypeEnum";
import { MathUtils } from "@/utils/mathUtils";
import { plainToInstance } from "class-transformer";
import { Photon } from "./photon";

export class Cell extends GameObjects.Graphics {
    radius: number = 5;
    color: number;
    isAlive: boolean = true;
    speed: number = 1;
    clock: InternalClock;
    neuronNetwork: NeuralNetwork;
    id: number;
    maxRadius: number = 16;
    cellType: CellTypeEnum;
    lastTimeEaten: number = 0;
    isMarked: boolean = false;
    markedOnAge: number = 0;
    markForInSec: number = 0;
    lastTimeMutated: number = 0;
    mutationIntervalInSec: number = 50;
    successPoints: number = 0;
    maxPlantRadius: number = 7;
    messageMemmorySlots: number[] = [0, 0, 0, 0, 0, 0, 0]; // 7 slots of messages
    sendingMessage: number = 0;


    constructor(
        scene: Phaser.Scene, 
        viewWidth: number, 
        viewHeight: number, 
        id: number,
        posistionX: number = 0,
        posistionY: number = 0,
        cellType: CellTypeEnum = CellTypeEnum.omnivore,
        neuronNetworkInJson: string = ""
    ) {
        super(scene);
        this.cellType = cellType;
        this.angle = Phaser.Math.DegToRad(0);
        this.neuronNetwork = neuronNetworkInJson === "" ? new NeuralNetwork([18, 20, 10, 5, 3]) : deserializeNeuralNetwork(neuronNetworkInJson);
        this.getColor();
        this.draw();
        this.addToDisplayList();
        this.x = posistionX === 0 ? Phaser.Math.Between(0, viewWidth) : posistionX;
        this.y = posistionY === 0 ? Phaser.Math.Between(0, viewHeight) : posistionY;
        this.clock = new InternalClock();
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
        if(this.cellType !== CellTypeEnum.plant){
            this.fillStyle( ColorUtils.rgbToHex(this.sendingMessage, this.sendingMessage, this.sendingMessage));
            this.fillCircle(0 ,0 , this.radius * 0.3);
        }

    }
    getColor(): void {
        if(this.cellType === CellTypeEnum.plant) {
            this.neuronNetwork.colorR = 0;
            this.neuronNetwork.colorG = 255;
            this.neuronNetwork.colorB = 0;
        } else {
            this.neuronNetwork.colorR = this.neuronNetwork.colorR > 0 ? ColorUtils.addColorValue(this.neuronNetwork.colorR, Phaser.Math.Between(-1, 1)) : Phaser.Math.Between(50, 255);
            this.neuronNetwork.colorG = this.neuronNetwork.colorR > 0 ? ColorUtils.addColorValue(this.neuronNetwork.colorR, Phaser.Math.Between(-1, 1)) : Phaser.Math.Between(50, 255);
            this.neuronNetwork.colorB = this.neuronNetwork.colorR > 0 ? ColorUtils.addColorValue(this.neuronNetwork.colorR, Phaser.Math.Between(-1, 1)) : Phaser.Math.Between(50, 255);
        }
        this.color = ColorUtils.rgbToHex(this.neuronNetwork.colorR, this.neuronNetwork.colorG, this.neuronNetwork.colorB);
    }

    move(dEngle: number, speedToMove: number): void {
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

            sensory.relativeAngle = Phaser.Math.Angle.Between(this.x, this.y, closestCell.x, closestCell.y);
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
            sensory.inCommingMessage = closestCell.sendingMessage;
            sensory.isSensing = true;
            this.successPoints += 0.00001;
        }
        return sensory;
    }

    update(photons: Photon[] = [],...args: any[]): void {
        this.scene.physics.world.wrap(this);
        this.handleDeath();
        this.doIfNotPlant(...args);
        this.doIfPlant(photons, ...args[0]);
        this.draw();
        
        //super.update(...args);
    }
    mutateColor() {
        this.neuronNetwork.colorR = this.neuronNetwork.colorR > 0 ? ColorUtils.addColorValue(this.neuronNetwork.colorR, Phaser.Math.Between(-1, 1)) : Phaser.Math.Between(50, 255);
        this.neuronNetwork.colorG = this.neuronNetwork.colorG > 0 ? ColorUtils.addColorValue(this.neuronNetwork.colorG, Phaser.Math.Between(-1, 1)) : Phaser.Math.Between(50, 255);
        this.neuronNetwork.colorB = this.neuronNetwork.colorB > 0 ? ColorUtils.addColorValue(this.neuronNetwork.colorB, Phaser.Math.Between(-1, 1)) : Phaser.Math.Between(50, 255);
        this.color = ColorUtils.rgbToHex(this.neuronNetwork.colorR, this.neuronNetwork.colorG, this.neuronNetwork.colorB);
    }
    doIfPlant(photons: Photon[] = [], cells: Cell[] = []) {
        if(this.cellType === CellTypeEnum.plant) {
            this.handleObsorbPhoton(photons);
            this.handlePlantReproduction(cells);
            this.handleRigidBodyV2(cells);
        }
    }
    handleRigidBodyV2(cells: Cell[]) {
        let touchingDistance = -1;
        let touchingCells = cells.find(cell => cell.id !== this.id && Phaser.Math.Distance.Between(this.x, this.y, cell.x, cell.y) - this.radius - cell.radius <= touchingDistance);
        if(touchingCells) {
            let angle = Phaser.Math.Angle.Between(this.x, this.y, touchingCells.x, touchingCells.y);
            let pushingDistance = Math.abs(Phaser.Math.Distance.Between(this.x, this.y, touchingCells.x, touchingCells.y) - this.radius - touchingCells.radius); 
            this.pushBack(Phaser.Math.Angle.Reverse(angle), pushingDistance / 2);
            touchingCells.pushBack(angle, pushingDistance / 2);
        }
    }
    handlePlantReproduction(cells: Cell[] = []) {
        if(this.radius > this.maxPlantRadius && this.isPlantCellsNotOverPopulated(cells)){
            let newPlant = new Cell(this.scene, 0, 0 , cells.length, this.x + Phaser.Math.Between(2,5), this.y + Phaser.Math.Between(2,5), CellTypeEnum.plant, '' );
            cells.push(newPlant);
            this.radius = 5;
        }
    }
    isPlantCellsNotOverPopulated(cells: Cell[]): boolean {
        return cells.filter(cell => cell.cellType === CellTypeEnum.plant).length < 200;
    }
    handleObsorbPhoton(photons: Photon[] = []) {
        if(this.radius < this.maxPlantRadius+1 && photons && photons.length > 0) {
            let hittedPhoton = photons.find(photon => Phaser.Math.Distance.Between(this.x, this.y, photon.x, photon.y) - this.radius - photon.radius <= -0);
            if(hittedPhoton) {
                this.radius += hittedPhoton.radius;
                hittedPhoton.radius = 0;
            }
        }
    }
    doIfNotPlant(...args: any[]) {
        if(this.cellType !== CellTypeEnum.plant) {
            let sensory = this.Senc(...args[0]);
            this.saveInCommingMessage(sensory);
            let neuronOutPut = this.neuronNetwork.feedForward(
                [
                    sensory.relativeAngle, 
                    sensory.distance, 
                    sensory.colorR, 
                    sensory.colorG, 
                    sensory.colorB, 
                    sensory.radius,
                    sensory.isAlive ? 1 : 0, 
                    sensory.speed,
                    this.radius,
                    this.angle,
                    this.speed,
                    this.messageMemmorySlots[0],
                    this.messageMemmorySlots[1],
                    this.messageMemmorySlots[2],
                    this.messageMemmorySlots[3],
                    this.messageMemmorySlots[4],
                    this.messageMemmorySlots[5],
                    this.messageMemmorySlots[6],
                ]);
                let dEngle =  MathUtils.SigmoidToMinMax(neuronOutPut[0], -5, 5);
                let speedToMove = MathUtils.SigmoidToMinMax(neuronOutPut[1], 0, 2);
                this.sendingMessage = MathUtils.SigmoidToMinMax(neuronOutPut[2], 0, 255);
                this.handleEating(sensory,...args[0]);
                this.handleReproduction(...args[0]);
                this.move(dEngle, speedToMove);
                this.handleRigidBody(sensory, ...args[0]);
                this.clock.aging();
                this.handleToUnMark();
                this.mutateColor();
        }
    }
    saveInCommingMessage(sensory: CellSensory) {
        if(sensory.isSensing && sensory.cellType === CellTypeEnum.omnivore){
            this.pushOldMessageAlongTheSlotsToMakeRoomForNew()
            this.messageMemmorySlots[0] = sensory.inCommingMessage;
        }
    }
    pushOldMessageAlongTheSlotsToMakeRoomForNew() {
        for(
            let index = this.messageMemmorySlots.length - 1;
            index > 0;
            index--
        ){
            this.messageMemmorySlots[index] = this.messageMemmorySlots[index-1];
        }
    }
    handleRigidBody(sensory: CellSensory, neiborCells: Cell[] = []) {
        if(!sensory.isSensing) return;
        let serfaceDisten = sensory.distance - this.radius - sensory.radius;
        let colitionThreshold = -0.5;
        if(serfaceDisten <= colitionThreshold){
            this.pushBack(Phaser.Math.Angle.Reverse(sensory.relativeAngle), Math.abs(serfaceDisten - colitionThreshold / 2));
            let cell = neiborCells.find(cell => cell.id === sensory.cellId);
            if(cell){
                cell.pushBack(sensory.relativeAngle, Math.abs(colitionThreshold / 2));
            }
        }
    }
    pushBack(angleToPushBack: number, distenToPush: number) {
        this.x += distenToPush * Math.cos(angleToPushBack);
        this.y += distenToPush * Math.sin(angleToPushBack);
    }
    handleToUnMark() {
        if(this.isMarked) {
            if((this.clock.ageInSec - this.markedOnAge) > this.markForInSec) {
                this.isMarked = false;
                this.markedOnAge = 0;
                this.markForInSec = 0;
            }
        }
    }
    handleReproduction(cells: Cell[] = []): void {
        try{
            if(cells){
                if(this.radius >= this.maxRadius -1) {
                    for(let i = 0; i <= 1; i++){
                        let newCell = new Cell(this.scene, 800, 600, cells.length, this.x, this.y, this.cellType, serializeNeuralNetwork(this.neuronNetwork));
                        newCell.successPoints = this.successPoints;
                        cells.push(newCell);
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
    handleDeath(): void {
        if(this.radius <= 2) {
            this.isAlive = false;
        }
    }
    
    handleEating(sensory: CellSensory, neiborCells: Cell[] = []): void {
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
                    cell.radius -= 0.05;
                    let energyAfter = cell.radius;
                    this.radius += energyBefore - energyAfter;
                    this.lastTimeEaten = this.clock.ageInSec;
                    this.successPoints += 0.1;
                }
            }
        }
        else{
            if(this.clock.ageInSec - this.lastTimeEaten > 120) {
                this.handleMutation(0.5);
            }
        }
    }
    handleMutation(rate: number) {
        if(this.clock.ageInSec - this.lastTimeMutated > this.mutationIntervalInSec) {
            this.neuronNetwork.mutate(rate);
            this.lastTimeMutated = this.clock.ageInSec;
            this.markFor(1);
        }
    }
    markFor(sec: number) {
        this.isMarked = true;
        this.markedOnAge = this.clock.ageInSec + 0;
        this.markForInSec = sec;
    }
    isDifferentColor(colorR: number, colorG: number, colorB: number): boolean {
        let cellColors = [
            {
                c: 1,
                v: this.neuronNetwork.colorR
            },
            {
                c: 2,
                v: this.neuronNetwork.colorG
            },
            {
                c: 3,
                v: this.neuronNetwork.colorB
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
    relativeAngle: number = 0;
    distance: number = 0;
    colorR: number = 0;
    colorG: number = 0;
    colorB: number = 0;
    radius: number = 0;
    isAlive: boolean = false;
    speed: number = 0;
    cellId: number = 0;
    cellType: CellTypeEnum = CellTypeEnum.omnivore;
    inCommingMessage: number = 0;
    isSensing: boolean = false;

}