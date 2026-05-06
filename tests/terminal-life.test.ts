import { gridToCommand } from "../src/util.ts";

const UPDATE = Deno.args.includes("--update") ||
  Deno.env.get("UPDATE_FIXTURES") === "1";

/**
 * Commands will be prefixed to match
 * terminal-life --activation smoothstep
 * and so forth
 */
const COMMANDS = [
  `terminal-life --width 1000 --height 100 --rule r1m0s3-6b3-6m --theme inferno --ticks 50`,
];

/**
 * Round trip PNG determinism
 * - loads banner.png
 * - runs command to regenerate
 *    - compares hash
 * - loads banner.png
 * - ticks additional 100 times
 * - loads banner_50.png
 *    -compares hash
 *
 * if update fixtures true, it should re-generate the fixtures
 *
 * base command
 * terminal-life --width 1000 --height 100 --rule r1m0s3-6b3-6m --theme inferno
 *
 * ticks @ 5 then + 50
 */
Deno.test("terminal-life", async () => {
  // How many ticks to run before test
  const TICKS = 50;

  // Generate a grid state and check it against a saved grid state that is stored in PNG tEXt
  // which contains a hash of the cell state
  {
    const load_state = JSON.parse(await run(`--load tests/fixtures/banner.png --log-json`));
    const generated = JSON.parse(
      await run(
        `--reset-random --width 1000 --height 100 --rule r1m0s3-6b3-6m --theme inferno --ticks ${TICKS} --log-json`,
      ),
    );

    /** Check the saved png hash against what we just generated */
    if (load_state.hash !== generated.hash) {
      console.log(load_state, generated);
      throw new Error(`regenerate mismatch: ${load_state.hash} vs ${generated.hash}`);
    } else {
      console.log("Generated hash matched loaded PNG hash")
    }
  }

  // Load a grid state from PNG image data and advance it 50 ticks. check the resulting hash
  // against another stored PNG image with tEXt data
  {
    const generated = JSON.parse(
      await run(`--load tests/fixtures/banner.png --ticks ${TICKS} --log-json`),
    );
    const load_state = JSON.parse(
      await run(`--load tests/fixtures/banner_${TICKS}.png --ticks ${TICKS} --log-json`),
    );

    /** Check the saved png hash against what we just generated */
    if (load_state.hash !== generated.hash) {
      throw new Error(`regenerate mismatch: ${load_state.hash} vs ${generated.hash}`);
    } else {
      console.log("Ticked PNG matched loaded PNG hash")
    }
  }
});

// Buffers the full run; for streaming output (e.g. --stream RGBA frames),
// use cmd.spawn() and read child.stdout as a ReadableStream instead.
async function run(argString: string): Promise<string> {
  const args = argString.trim().split(/\s+/).filter(Boolean);
  const cmd = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-read",
      "--allow-write",
      "src/terminal-life.ts",
      ...args,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const dec = new TextDecoder();
  const { code, stdout, stderr } = await cmd.output();
  const [err, out] = [
    dec.decode(stderr),
    dec.decode(stdout),
  ];
  if (err) throw new Error(err);
  return out;
}
