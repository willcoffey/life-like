import palettes from "./palette.json";
export type RGB = [number, number, number];
export type PaletteData = typeof palettes;
export type PaletteName = keyof PaletteData;

export class ColorMap {
  /** The current theme as a Uint8ClampedArray lookup table for performance */
  static lookup: Uint8ClampedArray = new Uint8ClampedArray(256 * 4);

  /**
   * Receives a value from 0 to 1 and outputs RGBA values according to current
   * theme lookup tables
   *
   * hard coded for 1 === white and 0 === black
   */
  static getRGBA(value: number): [number, number, number, number] {
    if (value === 1) return [255, 255, 255, 255];
    if (value === 0) return [0, 0, 0, 255];

    const o = ((value * 255) | 0) * 4;
    return [this.lookup[o], this.lookup[o + 1], this.lookup[o + 2], this.lookup[o + 3]];
  }

  static load(theme: PaletteName) {
    const data = palettes[theme];
    if (!data) throw "Invalid Theme";
    for (let i = 0; i < 256; i++) {
      const src = data[Math.round((i / 255) * (data.length - 1))];
      ColorMap.lookup[i * 4] = src[0];
      ColorMap.lookup[i * 4 + 1] = src[1];
      ColorMap.lookup[i * 4 + 2] = src[2];
      ColorMap.lookup[i * 4 + 3] = 255;
    }
  }
}

function randomTheme(): PaletteName {
  const names = Object.keys(palettes) as PaletteName[];
  return names[Math.floor(Math.random() * names.length)];
}
ColorMap.load(randomTheme());
