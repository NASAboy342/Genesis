export class MathUtils{
    public static SigmoidToMinMax(value: number, min: number, max: number): number {
        return value * (max - min) + min;
    }
    public static Mapto0and8(value: number): number {
        const sigmoid = 1 / (1 + Math.exp(-value)); // maps x to (0, 1)
        return sigmoid * 8; // scales to (0, 8)
    }
}