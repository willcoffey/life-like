import type { Grid } from "./core.ts";

export interface CommandLineOptions {
  options: Record<string, string>;
  flags: Record<string, true>;
  leftovers?: string[];
  operands: string[];
}
export function parseCommandLineOptions(
  argv: string[],
  optionsWithArguments: Record<string, boolean> | boolean = true,
): CommandLineOptions {
  const options: Record<string, string> = {};
  const operands: string[] = [];
  const flags: Record<string, true> = {};

  let currentFlag = "";

  for (let i = 0; i < argv.length; i++) {
    // If the first character of the string is not '-' then it specifes an operand or a value
    if (argv[i][0] !== "-") {
      //If no options can take arguments treat as operand
      if (optionsWithArguments === false) {
        operands.push(argv[i]);
        //If all options can take arguments check if there is a current flag, treat as flag or operand respectively
      } else if (optionsWithArguments === true) {
        if (currentFlag) {
          options[currentFlag] = argv[i];
          currentFlag = "";
        } else {
          operands.push(argv[i]);
        }
        //If there isn't a current flag or this flag doesn't accept arguments treat as operand
      } else if (!currentFlag || !optionsWithArguments[currentFlag]) {
        operands.push(argv[i]);
      } else {
        options[currentFlag] = argv[i];
        currentFlag = "";
      }
    } else {
      // First two characters = '--' so string is of form --help or similar
      if (argv[i][1] === "-") {
        if (isEqArg(argv[i])) {
          const eq = argv[i].indexOf("=");
          const name = argv[i].substring(2, eq);
          flags[name] = true;
          options[name] = argv[i].substring(eq + 1);
          currentFlag = "";
        } else {
          currentFlag = argv[i].substring(2);
          flags[currentFlag] = true;
        }
      } else {
        //argument is something like '-gzxv' or '-f'
        if (isEqArg(argv[i])) {
          // special case for options specified as -f=-23
          const eq = argv[i].indexOf("=");
          for (let j = 1; j < eq; j++) flags[argv[i][j]] = true;
          if (eq > 1) options[argv[i][eq - 1]] = argv[i].substring(eq + 1);
          currentFlag = "";
        } else {
          for (let j = 1; j < argv[i].length; j++) {
            currentFlag = argv[i][j];
            flags[currentFlag] = true;
          }
        }
      }
    }
  }

  return { flags: flags, options: options, operands: operands };
}

/** Shorthand utility for detecting stuff like --negative=-44 */
function isEqArg(arg: string) {
  return arg.indexOf("=") !== -1;
}

/**
 * FNV-1a 128-bit hash of a Float64Array's raw bytes.
 * Adapted from @sindresorhus/fnv1a (MIT)
 * https://github.com/sindresorhus/fnv1a/blob/main/index.js
 */
export function hashFloatArray128(cells: Float64Array): string {
  const OFFSET = 144_066_263_297_769_815_596_495_629_667_062_367_629n;
  const PRIME = 309_485_009_821_345_068_724_781_371n;
  let hash = OFFSET;
  const bytes = new Uint8Array(cells.buffer, cells.byteOffset, cells.byteLength);
  for (let i = 0; i < bytes.length; i++) {
    hash ^= BigInt(bytes[i]);
    hash = BigInt.asUintN(128, hash * PRIME);
  }
  return hash.toString(16).padStart(32, "0");
}

/**
 * @TODO Wed May  6 02:02:49 PM EDT 2026
 * Stub until I update terminal life API
 *
 * Convert a serialized Grid back into the `terminal-life` CLI command
 * that would reproduce it. Round-trip companion to `--log-json`.
 *
 * Negative values use `--name=value` form -- bare `-0.5` would be read
 * as a new short-flag bundle by `parseCommandLineOptions`.
 *
 * Drops `playing`, `hash` (no CLI counterpart) and `phaseDiagram` while
 * in Fixed mode (not load-bearing -- it just remembers the last viewport).
 */
export function gridToCommand(grid: Grid): string {
  const args: string[] = [];

  const pushNumber = (name: string, value: number) => {
    if (value < 0) args.push(`--${name}=${value}`);
    else args.push(`--${name}`, String(value));
  };

  pushNumber("width", grid.width);
  pushNumber("height", grid.height);
  args.push("--rule", grid.rule);
  args.push("--activation", grid.activation);
  args.push("--theme", grid.theme);
  pushNumber("alpha", grid.alpha);
  pushNumber("beta", grid.beta);
  // CLI flag is `--rate`, grid property is `changeRate` -- the one mismatch.
  pushNumber("rate", grid.changeRate);

  // `--phase` implicitly sets PhaseDiagram mode, so no separate --mode flag.
  if (grid.mode === "PhaseDiagram") {
    const { x: [aMin, aMax], y: [bMin, bMax] } = grid.phaseDiagram;
    const range = `${aMin}:${aMax},${bMin}:${bMax}`;
    if (aMin < 0 || aMax < 0 || bMin < 0 || bMax < 0) {
      args.push(`--phase=${range}`);
    } else {
      args.push("--phase", range);
    }
  }
  pushNumber("ticks", grid.tick);
  return ["terminal-life", ...args].join(" ");
}
