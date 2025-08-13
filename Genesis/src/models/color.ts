import { ColorUtils } from "@/utils/colorUtils";

export class Color{
    public r: number;
    public g: number;
    public b: number;
    public a: number;
    
    public GetHex(): number {
        return ColorUtils.rgbToHex(this.r, this.g, this.b);
    }
    public static GetHexFromRGB(r: number, g: number, b: number): number {
      return ColorUtils.rgbToHex(r, g, b);
    }
}