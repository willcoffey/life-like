import { CommandLineOptions, parseCommandLineOptions } from "./util.ts";
import { isShaperName, Shapers } from "./shapers.ts";
import { Grid, LifeLike } from "./core.ts";
import { ColorMap, isPaletteName, PaletteName } from "./lib/ColorMap.ts";
import { PNG } from "npm:pngjs@7.0.0";
import { Buffer } from "node:buffer";
import { crc32 } from "node:zlib";

/** Used for mapping floats to rgba and vice versa */
const colorMap = new ColorMap();

function printHelp() {
  console.log(`
Life-Like Terminal

  Runs a life-like cellular automaton grid for N ticks and optionally writes the result as a PNG.
  Non-cell grid state is embedded in a tEXt chunk so saved PNGs can be reloaded. Saving is a lossy
  process since the cells are processed as Float64 but only ~8 bits can be recovered from themed
  PNG images.

  Usage: terminal-life [OPTIONS]

  Note: arguments with negative values must use --name=value syntax (e.g. --alpha=-0.5).

  -h --help         Print this help
  -t --ticks N      Advance the grid by N ticks before saving (default: 0)
  --load FILENAME   Load initial grid (cells + embedded state) from PNG. If 
                    omitted, grid is randomized.
  --out FILENAME    Write resulting grid to PNG file.
  --log-json        Logs the serializable grid metadata in JSON format. I.e. 
                    everything needed to reproduce state except for cell state.
  --stream          Stream RGBA  to stdout, for use with ffmpeg
  --width N         Grid width in cells. Ignored when --load is used.
  --height N        Grid height in cells. Ignored when --load is used.
  --alpha N         First shaping parameter for the activation function.
  --beta N          Second shaping parameter for the activation function.
  --rate N          Smoothing factor on per-tick updates; higher values apply 
                    smaller per-cell changes. 1 matches classic Conway.
  --phase RANGE     PhaseDiagram mode: linearly interpolate alpha and beta across the grid using 
                    the given min:max ranges. Overrides fixed --alpha / --beta values.
  --activation NAME Activation function to use (e.g. gaussian, sin, sigmoid). See shapers.ts
  --theme           Name of a palette. magma, inferno, plasma, viridis, cividis, turbo, berlin,
                     managua, vanimo
  -v --verbose      Log output details
  --rule            The rule to run, either lifelike or LtL  B36/S23 
                    Lifelike: "b36s23" means birth on 3 or 6 and survive 2 or 3
                    LtL: "r5m1s34-58b34-45m" where that means radius 5 middle included survive
                    between 34 and 58, birth between 34 and 45, use a moore neighborhood. "d" for
                    disc neighborhood also supported.
  --reset-random    Seed the grid with random values from a deterministic PRNG
  --reset-sparse    Seed the grid with random values with a low density, most cells dead

    
=================================== Examples ==================================

  # Seed a random grid, tick 50 times, save
  terminal-life --ticks 50 --out run.png

  # Resume a saved grid for another 25 ticks
  terminal-life --load run.png -t 25 --out run-75.png

  # Run a custom fixed-mode grid with a sigmoid activation
  terminal-life --width 200 --height 200 --activation sigmoid --alpha 1.2 --beta 0.4 --ticks 100 --out fixed.png

  # Render a phase diagram by sweeping alpha and beta
  terminal-life --width 400 --height 400 --rate 5 --activation gaussian --phase=-0.470:0.668,-0.319:0.319 --ticks 10 --out phase.png
`);
}

async function main() {
  const now = Date.now();
  //@TODO - Does just true work to set everything?
  const opts = parseCommandLineOptions(Deno.args, {
    t: true,
    ticks: true,

    // File input / output
    load: true,
    out: true,

    // Grid properties
    width: true,
    height: true,
    alpha: true,
    beta: true,
    rate: true,
    phase: true,
    activation: true,
    theme: true,
    rule: true,
    "log-json": true,
  });
  if (opts.flags.h || opts.flags.help) return printHelp();

  const verbose = opts.flags.v ?? opts.flags.verbose;
  const inputGrid = parseGridFromArguments(opts);
  let life: LifeLike;

  /** Build the grid */
  if (opts.options.load) {
    /**
     * If we are loading a PNG, we should use it's saved grid properties but override anything
     * explicitly set by the command line arguments. except width & height.
     */
    const loadedGrid = loadPng(opts.options.load);
    const { width, height } = loadedGrid;
    Object.assign(loadedGrid, inputGrid);
    Object.assign(loadedGrid, { width, height });
    life = new LifeLike(loadedGrid);
  } else {
    /** Create a new grid */
    life = new LifeLike(inputGrid);
  }

  if (verbose) console.log(life.grid);
  if (opts.flags["reset-random"]) life.stdin({ "command": "reset-random" });
  if (opts.flags["reset-sparse"]) {
    life.stdin({
      "command": "reset-random",
      args: {
        densityRange: [.9995, .9995],
        valueRange: [0, 1],
      },
    });
  }

  /** If ticks is specified, tick the grid by that much */
  if (opts.options.ticks || opts.options.t) {
    const ticks = Number(opts.options.ticks ?? opts.options.t);
    for (let i = 0; i < ticks; i++) {
      if (opts.flags.stream) {
        writeAll(makeRgbaBuffer(life.grid));
      }
      life.stdin({ "command": "tick" });
    }

    // compute the hash of this tick and store it on the grid
    life.stdin({ "command": "hash" });
  }

  /** If an output path is specified, save the resulting PNG to that path */
  if (opts.options.out) {
    savePng(life.grid, opts.options.out);
    if (verbose) console.log(`Saved file to ${opts.options.out}`);
  }

  if (opts.flags["log-json"] || opts.options["log-json"]) {
    if (verbose) {
      console.log(life.grid);
    } else {
      logGridMetadata(life.grid);
    }
  }

  if (verbose) console.log(`Took ${((Date.now() - now) / 1000 / 60).toFixed(2)} minutes`);
}

function logGridMetadata(grid: Grid) {
  const exclude = new Set(["cache", "cells"]);
  const json = JSON.stringify(grid, (key, value) => exclude.has(key) ? undefined : value, 2);
  console.log(json);
}

function writeAll(buffer: Uint8Array) {
  let bytesWritten = 0;
  while (bytesWritten < buffer.length) {
    const written = Deno.stdout.writeSync(buffer.subarray(bytesWritten));
    bytesWritten += written;
  }
}

function parseGridFromArguments(args: CommandLineOptions): Partial<Grid> {
  const { options, flags } = args;
  const grid: Partial<Grid> = { mode: "Fixed" };

  /** Parse all the numeric grid properties then validate them */
  if (options.width !== undefined) grid.width = Number(options.width);
  if (options.height !== undefined) grid.height = Number(options.height);
  if (options.alpha !== undefined) grid.alpha = Number(options.alpha);
  if (options.beta !== undefined) grid.beta = Number(options.beta);
  if (options.rate !== undefined) grid.changeRate = Number(options.rate);

  for (const [key, value] of Object.entries(grid)) {
    if (Number.isNaN(value)) throw `Error: ${key} should be a number`;
  }

  const { activation } = options;
  if (activation) {
    if (!isShaperName(activation)) {
      throw `Error: invalid activation function specified`;
    }
    grid.activation = activation;
  }

  /** Validate the string props - phase diagram range, validator function */
  if (options.phase) {
    const phaseRange = parsePhaseRange(options.phase);
    if (phaseRange) {
      grid.phaseDiagram = {
        type: "activation",
        x: phaseRange.alpha,
        y: phaseRange.beta,
      };
      grid.mode = "PhaseDiagram";
    }
  } else if (flags.phase && grid.activation) {
    /** phase was specified without a range, use activation default */
    grid.mode = "PhaseDiagram";
    grid.phaseDiagram = {
      type: "activation",
      x: Shapers[grid.activation].diagram.alpha,
      y: Shapers[grid.activation].diagram.beta,
    };
  }

  if (options.rule) {
    grid.rule = options.rule;
  }

  const { theme } = options;
  if (theme && isPaletteName(theme)) {
    grid.theme = theme;
    colorMap.load(theme);
  }

  return grid;
}

function loadPng(path: string): Grid {
  const bytes = Deno.readFileSync(path);
  const state = JSON.parse(extractLifeLikeTextChunk(bytes, "life-state"));
  const cache = LifeLike.buildGridCache(state);
  colorMap.load(state.theme);

  const png = PNG.sync.read(Buffer.from(bytes));
  const cells = pixelsToCells(png.data, png.width, png.height, cache.parsedRule.radius);

  return { ...state, cells };
}
/**
 * Walk the PNG chunk stream looking for a tEXt chunk with the given keyword.
 */
function extractLifeLikeTextChunk(bytes: Uint8Array, keyword: string): string {
  const decoder = new TextDecoder();
  const reader = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Skip 8-byte PNG signature
  let offset = 8;
  while (offset < bytes.length) {
    const length = reader.getUint32(offset);

    // Decode the type chunk header
    const type = decoder.decode(bytes.subarray(offset + 4, offset + 8));

    // Exit early if we reach the end
    // IEND: image trailer, which is the last chunk in a PNG datastream.
    if (type === "IEND") return "{}";

    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    // We only care about the tEXt chunks
    if (type === "tEXt") {
      // Find the seperator between keyword and data of tEXt record
      const nullIdx = bytes.indexOf(0x00, dataStart);

      // Decode the keyword, if it matches then return the decoded data
      const key = decoder.decode(bytes.subarray(dataStart, nullIdx));
      if (key === "life-state") {
        return decoder.decode(bytes.subarray(nullIdx + 1, dataEnd));
      }
    }

    // Skip the data portions of any other chunk
    offset = dataEnd + 4;
  }

  return "{}";
}

function pixelsToCells(
  data: Uint8Array,
  width: number,
  height: number,
  radius: number,
): Float64Array {
  const physWidth = width + 2 * radius;
  const physHeight = height + 2 * radius;
  const cells = new Float64Array(physWidth * physHeight);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const physPos = (y + radius) * physWidth + (x + radius);
      cells[physPos] = colorMap.fromRGBA(
        data[src],
        data[src + 1],
        data[src + 2],
        data[src + 3],
      );
    }
  }
  return cells;
}

/**
 * Takes in a grid and saves it as a PNG along with it's associated metadata
 *
 * this metadata is required to load it in the future
 */
function savePng(grid: Grid, path: string) {
  const image = gridToPng(grid);
  const state = createTextChunk(grid);

  const out = new Uint8Array(image.length + state.length);
  out.set(image.subarray(0, 33), 0);
  out.set(state, 33);
  out.set(image.subarray(33), 33 + state.length);

  Deno.writeFileSync(path, out);
}

/**
 * Generate a PNG with the image data as the cell state and the rest of the
 * needed grid state saved to PNG metadata.
 *
 * # Refs
 *  How PNG text chunks work - 4.2.3. Textual information
 *  https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
 *
 *  Essentially, key value pairs in differing formats
 *
 *  tEXt - most basic, latin-1, nothing fancy
 *  zTXt - same as above except compressed
 *  iTXt - fancy. UTF-8, compression flag, compression method, language
 */
function gridToPng(grid: Grid): Uint8Array {
  const buffer = makeRgbaBuffer(grid);
  const png = new PNG({ width: grid.width, height: grid.height, colorType: 6 });
  png.data = Buffer.from(buffer);
  return PNG.sync.write(png);
}

function makeRgbaBuffer(grid: Grid): Uint8Array {
  const { cells, width, height } = grid;
  const buffer = new Uint8Array(width * height * 4);
  for (const [position, x, y] of LifeLike.cellIterator(grid)) {
    const [r, g, b, a] = colorMap.getRGBA(cells[position]);
    const i = (y * width + x) * 4;
    buffer[i] = r;
    buffer[i + 1] = g;
    buffer[i + 2] = b;
    buffer[i + 3] = a;
  }
  return buffer;
}

/**
 * converts the non-cell grid state to a Uint8Array for storage as a tEXt
 * chunk.
 *
 * PNG Chunks are
 * [Chunk length][Chunk Type][Chunk Data][CRC]
 *
 * and tEXt has the following format for data field:
 *
 * [1-79 Byte keyword][Null Seperator][0 or more Text byes]
 *
 * see: https://www.w3.org/TR/png/#11tEXt
 */
function createTextChunk(grid: Grid): Uint8Array {
  const encoder = new TextEncoder();

  /** Determine the total size of the chunk */
  const keywordBytes = encoder.encode("life-state");
  const stateBytes = encoder.encode(getStateString(grid));

  const chunkSize = keywordBytes.length + stateBytes.length + 1;

  // The chunk + it's length field, type field, and CRC
  const chunk = new Uint8Array(4 + 4 + chunkSize + 4);
  const writer = new DataView(chunk.buffer);

  // Chunk length
  writer.setUint32(0, chunkSize);
  // Chunk Type - tEXt
  chunk.set([0x74, 0x45, 0x58, 0x74], 4);
  // tEXt keyword
  chunk.set(keywordBytes, 8);
  // tEXt seperator
  chunk[8 + keywordBytes.length] = 0x00;
  // tEXt body
  chunk.set(stateBytes, 9 + keywordBytes.length);
  // CRC
  writer.setUint32(8 + chunkSize, crc32(chunk.subarray(4, 8 + chunkSize)));
  return chunk;
}

function getStateString(grid: Grid): string {
  const { cells, cache, ...serializable } = grid;
  return JSON.stringify(serializable);
}

/**
 * Takes in the phase diagram range specified via console in the format
 * --phase 0:1,3:4
 *
 * where this parses to an alpha and beta min/max of 0,1 and 3,4 respectively
 *
 * input string is just the '0:1,3:4'
 */
function parsePhaseRange(
  input: string,
): { alpha: [number, number]; beta: [number, number] } | undefined {
  const [alphaString, betaString] = input.split(",");
  if (!alphaString || !betaString) throw `Error: invalid phase range specified`;

  const [alphaMinString, alphaMaxString] = alphaString.split(":");
  const [betaMinString, betaMaxString] = betaString.split(":");

  const alphaMin = Number(alphaMinString);
  const alphaMax = Number(alphaMaxString);
  const betaMin = Number(betaMinString);
  const betaMax = Number(betaMaxString);

  if (!Number.isFinite(alphaMin)) return undefined;
  if (!Number.isFinite(alphaMax)) return undefined;
  if (!Number.isFinite(betaMin)) return undefined;
  if (!Number.isFinite(betaMax)) return undefined;

  return {
    alpha: [alphaMin, alphaMax],
    beta: [betaMin, betaMax],
  };
}

main();
