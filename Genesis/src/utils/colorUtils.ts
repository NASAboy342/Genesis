export class ColorUtils {
    /**
     * add addingAmount to the clolorValue and make sure it is with in 0 to 255
     */
    static addColorValue(colorValue: number, addingAmount: number): number {
        return (colorValue + addingAmount) % 255
    }
    /**
     * Convert RGB values (0-255) to a Phaser-compatible hex color (0xRRGGBB).
     * @param r Red (0-255)
     * @param g Green (0-255)
     * @param b Blue (0-255)
     * @returns Hexadecimal color (0xRRGGBB)
     */
    static rgbToHex(r: number, g: number, b: number): number {
        return (r << 16) | (g << 8) | b;
    }

    /**
     * Convert a Phaser hex color (0xRRGGBB) to an RGB object.
     * @param hex Hexadecimal color (0xRRGGBB)
     * @returns {r, g, b} object
     */
    static hexToRgb(hex: number): { r: number; g: number; b: number } {
        return {
            r: (hex >> 16) & 0xff,
            g: (hex >> 8) & 0xff,
            b: hex & 0xff
        };
    }

    /**
     * Create a Phaser Display Color object from RGB.
     * @param r Red (0-255)
     * @param g Green (0-255)
     * @param b Blue (0-255)
     * @returns Phaser.Display.Color object
     */
    static rgbToPhaserColor(r: number, g: number, b: number): Phaser.Display.Color {
        return new Phaser.Display.Color(r, g, b);
    }

    /**
     * Lighten a color by a percentage.
     * @param hex Hex color (0xRRGGBB)
     * @param amount Percentage to lighten (0-1)
     * @returns Lightened hex color
     */
    static lighten(hex: number, amount: number): number {
        let color = Phaser.Display.Color.IntegerToColor(hex);
        color = color.lighten(amount * 100); // Phaser uses 0-100 scale
        return color.color;
    }

    /**
     * Darken a color by a percentage.
     * @param hex Hex color (0xRRGGBB)
     * @param amount Percentage to darken (0-1)
     * @returns Darkened hex color
     */
    static darken(hex: number, amount: number): number {
        let color = Phaser.Display.Color.IntegerToColor(hex);
        color = color.darken(amount * 100);
        return color.color;
    }
}
