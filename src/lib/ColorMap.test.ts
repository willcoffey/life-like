import { assert } from "jsr:@std/assert";
import { ColorMap, type PaletteName } from "./ColorMap.ts";
import palettes from "./palette.json" with { type: "json" };

/**
 * Test the round-trip accuracy of encoding value as color and then recovering it
 */
Deno.test("fromRGBA precision and perf across themes", () => {
  const TRIALS = 10000;
  const TOLERANCE = 0.008;
  const MEAN_TOLERANCE = 0.05;
  const themes = Object.keys(palettes) as PaletteName[];
  const fn = ColorMap.getRGBA;

  for (const theme of themes) {
    ColorMap.load(theme);

    let maxErr = 0;
    let totalErr = 0;
    // Includes random generation time, so only applicable for like-to-like comparison
    const start = performance.now();

    // Perform the trials against this theme
    for (let i = 0; i < TRIALS; i++) {
      const value = Math.random();
      const diff = Math.abs(value - ColorMap.fromRGBA(fn, ...fn(value)));
      if (diff > TOLERANCE) {
        throw `${theme}: recovery failed at value ${value} (err ${diff} > tolerance ${TOLERANCE})`;
      }
      totalErr += diff;
      if (diff > maxErr) maxErr = diff;
    }

    const microsPerCall = (performance.now() - start) * 1000 / TRIALS;
    const meanErr = totalErr / TRIALS;
    const bitsRecovered = -Math.log2(2 * meanErr);

    assert(ColorMap.fromRGBA(fn, ...fn(0)) === 0, `${theme}: fn(0) roundtrip`);
    assert(ColorMap.fromRGBA(fn, ...fn(1)) === 1, `${theme}: fn(1) roundtrip`);
    assert(
      meanErr < MEAN_TOLERANCE,
      `${theme}: mean err ${meanErr} > ${MEAN_TOLERANCE}`,
    );

    console.log(
      `${theme.padEnd(8)} mean=${meanErr.toExponential(2)} ` +
        `max=${maxErr.toExponential(2)} bits=${bitsRecovered.toFixed(2)} ` +
        `${microsPerCall.toFixed(2)}µs/call`,
    );
  }
});
