export class Clock {
    public startTime: Date;
    public ageInSec: number;
    public cycle: number = 0.05;
    public lastCycle: number = 0;
    public constructor(){
        this.startTime = new Date();
    }
    public getAge(): number{
        return (new Date().getTime() - this.startTime.getTime()) / 1000;
    }
    public reset(): void{
        this.startTime = new Date();
    }
    public aging(): void{
        this.ageInSec = this.getAge();
    }
    public isRecycle(){
        if(this.ageInSec >= (this.lastCycle + this.cycle)){
            this.lastCycle = this.ageInSec
            return true;
        }
        return false
    }
}