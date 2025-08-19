export class CustomLine{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    
    constructor(x1: number, y1: number, x2: number, y2: number) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    
    public length(): number {
        return Phaser.Math.Distance.Between(this.x1, this.y1, this.x2, this.y2);
    }
    
    public angle(): number {
        return Phaser.Math.RadToDeg(Math.atan2(this.y2 - this.y1, this.x2 - this.x1));
    }
    
    public midpoint(): { x: number, y: number } {
        return { x: (this.x1 + this.x2) / 2, y: (this.y1 + this.y2) / 2 };
    }
    static CreateLineByAngle(x: number, y: number, angle: number, length: number): Phaser.Geom.Line {
        const radians = Phaser.Math.DegToRad(angle);
        const x2 = x + Math.cos(radians) * length;
        const y2 = y + Math.sin(radians) * length;
        return new Phaser.Geom.Line(x, y, x2, y2);
    }
}