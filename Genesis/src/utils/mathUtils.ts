export class MathUtils{
    public static SigmoidToMinMax(value: number, min: number, max: number): number {
        return value * (max - min) + min;
    }
}