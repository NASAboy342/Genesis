export class Clock {
    startTime: Date;
    ageInSec: number;
    ageInMilliSec: number;
    cycle: number = 0.05;
    lastCycle: number = 0;
    deltaTimeInMilliSec: number = 0;
    constructor(){
        this.startTime = new Date();
        this.ageInMilliSec = this.getAgeInMilliSec();
    }
    getAgeInSec(): number{
        return (new Date().getTime() - this.startTime.getTime()) / 1000;
    }
    getAgeInMilliSec(): number{
        return new Date().getTime() - this.startTime.getTime();
    }
    reset(): void{
        this.startTime = new Date();
        this.ageInSec = 0;
        this.ageInMilliSec = 0;
    }
    aging(): void{
        this.deltaTimeInMilliSec = this.getAgeInMilliSec() - this.ageInMilliSec;
        this.ageInMilliSec = this.getAgeInMilliSec();
        this.ageInSec = this.getAgeInSec();
    }
    isRecycle(){
        if(this.ageInSec >= (this.lastCycle + this.cycle)){
            this.lastCycle = this.ageInSec
            return true;
        }
        return false
    }
}