export class InternalClock{
    public startTime: Date;
    public age: number;
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
        this.age = this.getAge();
    }
    public isRecycle(){
        if(this.age >= (this.lastCycle + this.cycle)){
            this.lastCycle = this.age
            return true;
        }
        return false
    }
}