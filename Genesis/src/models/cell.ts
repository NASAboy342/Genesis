import { GameObjects } from "phaser";
import { InternalClock } from "./internalClock";

export class Cell extends GameObjects.Graphics {
    public radius: number = 10;
    public color: number = 0xff0000;
    public isAlive: boolean = true;
    public speed: number = 5;
    public clock: InternalClock;

    constructor(scene: Phaser.Scene, viewWidth: number, viewHeight: number) {
        super(scene);
        this.x = this.getViewWidth(viewWidth /2);
        this.y = this.getViewHeight(viewHeight /2);
        
        this.angle = Phaser.Math.DegToRad(0);
        this.fillStyle(this.color)
        this.fillCircle(this.x, this.y, this.radius);
        this.addToDisplayList();
        this.clock = new InternalClock();
    }

    public getViewWidth(viewWidth: number): number {
        return viewWidth / 2;
    }

    public getViewHeight(viewHeight: number): number {
        return viewHeight / 2;
    }

    //move randomly
    public move(): void {
        this.angle += Phaser.Math.DegToRad(Phaser.Math.Between(-5, 5));
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);

    }

    override update(...args: any[]): void {
        this.move();
        super.update(...args);
    }
    
}