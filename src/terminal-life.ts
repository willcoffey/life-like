import { parseCommandLineOptions } from "../../utilities/index.ts";
import { Grid, LifeLike } from "./core.ts";
import { ColorMap } from "./lib/ColorMap.ts";
import { PNG } from "pngjs";
import { Buffer } from "node:buffer";

async function main() {
  const opts = parseCommandLineOptions(Deno.args, {
    w: true,
    width: true,
    h: true,
    height: true,
    t: true,
    ticks: true,
  });

  const now = Date.now();
  const grid = computeGrid();
  const image = gridToPng(grid);
  console.log(Date.now() - now);
  Deno.writeFileSync("out.png", PNG.sync.write(image));
}

function gridToPng({ cells, width, height }: Grid): PNG {
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
  return png;
}

function computeGrid(): Grid {
  const ticks = 5000;
  const life = new LifeLike({
    width: 1000,
    height: 100,
    pM: 1.86,
    pX: .14,
    pY: -.23,
  });
  //life.stdin({ command: "reset-random" });
  LifeLike.addCircle(life.grid);
  //life.stdin({ command: "make-symmetric" });
  for (let i = 0; i < ticks; i++) life.tick();
  return life.grid;
}

main();
