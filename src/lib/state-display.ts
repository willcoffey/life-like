import { Grid } from "../core";
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type GridState = PartialBy<Grid, "cells">;
/**
 * Visual bar to represent the values 0 - 1 in the automatas color scale
 */
const HTML = `
<style>
  #state-display {
    font-family: monospace;
    background-color: #000;
    border: 2px solid #222;
    border-radius: 3px;
    display: grid;
    grid-gap: 2px;
    grid-template-columns: 1fr 1fr 1fr;
    box-sizing: border-box;
    overflow: hiddden;
  }
  #state-display > div {
    overflow: hiddden;
    background-color: #EEE;
    padding: 10px;
    min-width: 0;
  }
  #actions {
    grid-column: 1 / -1;
    display: flex;
    gap: 2px;
    padding: 0 !important;
    background-color: transparent !important;
  }
  #actions button {
    flex: 1;
    font-family: inherit;
    padding: 6px;
    cursor: pointer;
  }
</style>
<div id="state-display">
  <div id="actions">
    <button id="copy-json" type="button">copy json</button>
    <button id="copy-command" type="button">copy command</button>
  </div>
  <div id="playing"></div>
  <div id="activation"></div>
  <div id="alpha"></div>
  <div id="beta"></div>
  <div id="changeRate"></div>
  <div id="theme"></div>
</div>
`;

export class StateDisplay extends HTMLElement {
  shadow?: ShadowRoot;
  lastState?: string;
  lastGrid?: GridState;
  constructor() {
    super();
  }

  /**
   * Invoked when the custom element is first connected to the document's DOM.
   * shadow cannot be attached before this is run.
   */
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = HTML;

    this.shadow.getElementById("copy-json")?.addEventListener("click", () => {
      if (this.lastGrid) navigator.clipboard.writeText(JSON.stringify(this.lastGrid));
    });
    this.shadow.getElementById("copy-command")?.addEventListener("click", () => {
      if (this.lastGrid) navigator.clipboard.writeText(toTerminalCommand(this.lastGrid));
    });
  }

  render(grid: Grid) {
    /** Check against old state and return early if nothing has changed */
    const newGrid: GridState = { ...grid };
    delete newGrid.cells;
    const newString = JSON.stringify(newGrid);
    if (newString === this.lastState) return;
    const keys: (keyof Grid)[] = ["playing", "activation", "alpha", "beta", "changeRate", "theme"];
    this.lastState = newString;
    this.lastGrid = newGrid;
    for (const key of keys) {
      const el = this.shadow?.getElementById(key);
      if (!el) continue;
      const value = newGrid[key];
      if (typeof value === "number") {
        if (el) el.innerHTML = `${key}: ${value.toFixed(2)}`;
      } else {
        if (el) el.innerHTML = `${key}: ${value}`;
      }
    }
  }
}

/**
 * Convert non-cell grid state into a terminal-life command line. Only the
 * options that terminal-life parses are emitted (see terminal-life.ts).
 */
function toTerminalCommand(grid: GridState): string {
  const parts = ["terminal-life"];
  if (grid.width !== undefined) parts.push(`--width ${grid.width}`);
  if (grid.height !== undefined) parts.push(`--height ${grid.height}`);
  if (grid.alpha !== undefined) parts.push(`--alpha ${grid.alpha}`);
  if (grid.beta !== undefined) parts.push(`--beta ${grid.beta}`);
  if (grid.changeRate !== undefined) parts.push(`--rate ${grid.changeRate}`);
  if (grid.activation !== undefined) parts.push(`--activation ${grid.activation}`);
  if (grid.phaseDiagram) {
    const { alpha, beta } = grid.phaseDiagram;
    parts.push(`--phase ${alpha[0]}:${alpha[1]},${beta[0]}:${beta[1]}`);
  }
  return parts.join(" ");
}
customElements.define("state-display", StateDisplay);
