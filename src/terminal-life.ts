import { CommandLineOptions, parseCommandLineOptions } from "../../utilities/index.ts";
import { Shapers } from "./shapers.ts";
import { Grid, LifeLike } from "./core.ts";
import { ColorMap } from "./lib/ColorMap.ts";
import { PNG } from "pngjs";
import { Buffer } from "node:buffer";
import { crc32 } from "node:zlib";

function printHelp() {
  console.log(`
    Life-Like Terminal
    Runs a life-like cellular automaton grid for N ticks and optionally writes the result as a PNG.
    Non-cell grid state is embedded in a tEXt chunk so saved PNGs can be reloaded. Saving is a lossy
    process since the cells are processed as Float64 but only ~8 bits can be recovered from themed
    PNG images.
      
    Usage: terminal-life [OPTIONS]

    -h --help     Print this help
    -t --ticks N  Advance the grid by N ticks before saving (default: 0)
    --load [FILENAME] Load initial grid (cells + embedded state) from PNG. If omitted grid random.
    --out  [FILENAME] Write resulting grid to PNG file. If omitted, nothing is written.

============================================= Examples ============================================
    # Seed a random grid, tick 50 times, save
    terminal-life --ticks 50 --out run.png

    # Resume a saved grid for another 25 ticks
    terminal-life --load run.png -t 25 --out run-75.png
`);
}

async function main() {
  const now = Date.now();
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
  });
  if (opts.flags.h || opts.flags.help) return printHelp();
  const inputGrid = parseGridFromArguments(opts);
  let life: LifeLike;

  if (opts.options.load) {
    /**
     * If we are loading a PNG, we should use it's saved grid properties but override anything
     * explicitly set by the command line arguments. except width & height.
     */
    const loadedGrid = loadPng(opts.options.load);
    const { width, height } = loadedGrid;
    Object.assign(inputGrid, loadedGrid);
    Object.assign({ width, height }, loadedGrid);
    life = new LifeLike(loadedGrid);
  } else {
    /** Create a new grid with some random data */
    life = new LifeLike(inputGrid);
    life.stdin({ command: "reset-random" });
  }

  /** If ticks is specified, tick the grid by that much */
  if (opts.options.ticks || opts.options.t) {
    const ticks = Number(opts.options.ticks ?? opts.options.t);
    for (let i = 0; i < ticks; i++) life.tick();
  }

  /** If an output path is specified, save the resulting PNG to that path */
  if (opts.options.out) {
    savePng(life.grid, opts.options.out);
    console.log(`Saved file to ${opts.options.out}`);
  }

  console.log(`Took ${((Date.now() - now) / 1000 / 60).toFixed(2)} minutes`);
}

function parseGridFromArguments(args: CommandLineOptions): Partial<Grid> {
  const { options } = args;
  const grid: Partial<Grid> = {};

  /** Parse all the numeric grid properties then validate them */
  if (options.width !== undefined) grid.width = Number(options.width);
  if (options.height !== undefined) grid.height = Number(options.height);
  if (options.alpha !== undefined) grid.alpha = Number(options.alpha);
  if (options.beta !== undefined) grid.beta = Number(options.beta);
  if (options.rate !== undefined) grid.changeRate = Number(options.rate);

  for (const [key, value] of Object.entries(grid)) {
    if (Number.isNaN(value)) throw `Error: ${key} should be a number`;
  }

  /** Validate the string props - phase diagram range, validator function */
  if (options.phase) {
    const phaseRange = parsePhaseRange(options.phase);
    if (phaseRange) grid.phaseDiagram = phaseRange;
  }

  const { activation } = options;
  if (activation) {
    if (!(activation in Shapers)) {
      throw `Error: invalid activation function specified`;
    }
    grid.activation = activation;
  }

  return grid;
}

function loadPng(path: string): Grid {
  const bytes = Deno.readFileSync(path);
  const state = JSON.parse(extractLifeLikeTextChunk(bytes, "life-state"));

  const png = PNG.sync.read(Buffer.from(bytes));
  const cells = pixelsToCells(png.data, png.width, png.height);

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

function pixelsToCells(data: Uint8Array, width: number, height: number): Float64Array {
  const cells = new Float64Array(width * height);
  for (let i = 0; i < cells.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];
    cells[i] = ColorMap.fromRGBA(ColorMap.getRGBA, r, g, b, a);
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
function gridToPng({ cells, width, height }: Grid): Uint8Array {
  const buffer = new Uint8Array(width * height * 4);
  for (let i = 0; i < cells.length; i++) {
    const [r, g, b, a] = ColorMap.getRGBA(cells[i]);
    buffer[i * 4] = r;
    buffer[i * 4 + 1] = g;
    buffer[i * 4 + 2] = b;
    buffer[i * 4 + 3] = a;
  }
  const png = new PNG({ width, height, colorType: 6 });
  png.data = Buffer.from(buffer);
  return PNG.sync.write(png);
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
  const { cells, ...serializable } = grid;
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
