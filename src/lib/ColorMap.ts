import palettes from "./palette.json" with { type: "json" };
export type RGB = [number, number, number];
export type PaletteData = typeof palettes;
export type PaletteName = keyof PaletteData;

export class ColorMap {
  /** The current theme as a Uint8ClampedArray lookup table for performance */
  static lookup: Uint8ClampedArray = new Uint8ClampedArray(256 * 4);

  /**
   * Receives a value from 0 to 1 and outputs RGBA values according to current
   * theme lookup tables
   */
  static getRGBA(value: number): [number, number, number, number] {
    const o = ((value * 255) | 0) * 4;
    return [ColorMap.lookup[o], ColorMap.lookup[o + 1], ColorMap.lookup[o + 2], ColorMap.lookup[o + 3]];
  }

  static fromRGBA(
    fn: (value: number) => [number, number, number, number],
    r: number,
    g: number,
    b: number,
    a: number,
  ): number {
    const K = 64;
    let bestK = 0;
    let bestD = Infinity;
    for (let i = 0; i <= K; i++) {
      const c = fn(i / K);
      const dr = c[0] - r, dg = c[1] - g, db = c[2] - b;
      const d = dr * dr + dg * dg + db * db;
      if (d < bestD) { bestD = d; bestK = i; }
    }
    // exact coarse-sample match — skip refinement. critical at boundaries:
    // golden section on [K-1, K] samples only interior points, so it cannot
    // recover v=1 when palette[254] is far from white (e.g. plasma ends in
    // yellow), and symmetric for v=0.
    if (bestD === 0) return bestK / K;
    let lo = bestK > 0 ? (bestK - 1) / K : 0;
    let hi = bestK < K ? (bestK + 1) / K : 1;
    const phi = 0.6180339887498949;
    let aX = hi - phi * (hi - lo);
    let bX = lo + phi * (hi - lo);
    let c = fn(aX);
    let dr = c[0] - r, dg = c[1] - g, db = c[2] - b;
    let fa = dr * dr + dg * dg + db * db;
    c = fn(bX);
    dr = c[0] - r; dg = c[1] - g; db = c[2] - b;
    let fb = dr * dr + dg * dg + db * db;
    const eps = 1e-4;
    while (hi - lo > eps) {
      if (fa < fb) {
        hi = bX; bX = aX; fb = fa;
        aX = hi - phi * (hi - lo);
        c = fn(aX);
        dr = c[0] - r; dg = c[1] - g; db = c[2] - b;
        fa = dr * dr + dg * dg + db * db;
      } else {
        lo = aX; aX = bX; fa = fb;
        bX = lo + phi * (hi - lo);
        c = fn(bX);
        dr = c[0] - r; dg = c[1] - g; db = c[2] - b;
        fb = dr * dr + dg * dg + db * db;
      }
    }
    return (lo + hi) / 2;
  }

  static createReverseLookup() {
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
//ColorMap.load(randomTheme());
ColorMap.load("magma");
