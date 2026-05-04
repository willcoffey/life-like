import { Grid } from "../core";
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type GridState = PartialBy<Grid, "cells" | "cache">;
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
  #actions textarea {
    flex: 1;
    font-family: inherit;
    padding: 6px;
    resize: none;
    min-width: 0;
  }
</style>
<div id="state-display">
  <div id="actions">
    <button id="copy-command" type="button">copy command</button>
    <button id="copy-json" type="button">copy json</button>
    <textarea id="paste-json" rows="1" placeholder="paste json state"></textarea>
  </div>
  <div id="mode"></div>
  <div id="resolution"></div>
  <div id="rule"></div>
  <div id="activation"></div>
  <div id="alphaBeta"></div>
  <div id="cellCount"></div>
  <div id="changeRate"></div>
  <div id="theme"></div>
  <div id="playing"></div>
  <div id="phaseType"></div>
  <div id="phaseX"></div>
  <div id="phaseY"></div>
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

    const pasteEl = this.shadow.getElementById("paste-json") as HTMLTextAreaElement | null;
    pasteEl?.addEventListener("paste", (e) => {
      const text = e.clipboardData?.getData("text") ?? "";
      let state: unknown;
      try {
        state = JSON.parse(text);
      } catch {
        return; // let the textarea show what was pasted so user can see it failed
      }
      if (!state || typeof state !== "object") return;
      e.preventDefault();
      this.dispatchEvent(
        new CustomEvent("load-state", { detail: state, bubbles: true, composed: true }),
      );
      pasteEl.value = "";
    });
  }

  render(grid: Grid) {
    /** Check against old state and return early if nothing has changed */
    const newGrid: GridState = { ...grid }
    delete newGrid.cells;
    delete newGrid.cache;

    const newString = JSON.stringify(newGrid) + `|n:${grid.cache.neighborhood.length}`;
    if (newString === this.lastState) return;
    this.lastState = newString;
    this.lastGrid = newGrid;

    const set = (id: string, text: string) => {
      const el = this.shadow?.getElementById(id);
      if (el) el.innerHTML = text;
    };

    set("mode", `mode: ${grid.mode}`);
    set("resolution", `res: ${grid.width} × ${grid.height}`);
    set("rule", `rule: ${grid.rule}`);
    set("activation", `activation: ${grid.activation}`);
    set("alphaBeta", `α/β: ${grid.alpha.toFixed(2)} / ${grid.beta.toFixed(2)}`);
    set("cellCount", `cell count: ${grid.cache.neighborhood.length}`);
    set("changeRate", `changeRate: ${grid.changeRate.toFixed(2)}`);
    set("theme", `theme: ${grid.theme}`);
    set("playing", `playing: ${grid.playing}`);
    set("phaseType", `phase type: ${grid.phaseDiagram.type}`);
    set("phaseX", `phase x: [${grid.phaseDiagram.x[0]}, ${grid.phaseDiagram.x[1]}]`);
    set("phaseY", `phase y: [${grid.phaseDiagram.y[0]}, ${grid.phaseDiagram.y[1]}]`);
  }
}

/**
 * Convert non-cell grid state into a terminal-life command line. Only the
 * options that terminal-life parses are emitted (see terminal-life.ts).
 */
function toTerminalCommand(grid: GridState): string {
  const parts = ["terminal-life"];
  if (grid.width !== undefined) parts.push(`--width=${grid.width}`);
  if (grid.height !== undefined) parts.push(`--height=${grid.height}`);
  if (grid.alpha !== undefined) parts.push(`--alpha=${grid.alpha}`);
  if (grid.beta !== undefined) parts.push(`--beta=${grid.beta}`);
  if (grid.changeRate !== undefined) parts.push(`--rate=${grid.changeRate}`);
  if (grid.activation !== undefined) parts.push(`--activation=${grid.activation}`);
  if (grid.theme !== undefined) parts.push(`--theme=${grid.theme}`);
  if (grid.mode === "PhaseDiagram" && grid.phaseDiagram) {
    const { x, y } = grid.phaseDiagram;
    parts.push(`--phase=${x[0]}:${x[1]},${y[0]}:${y[1]}`);
  }
  return parts.join(" ");
}
customElements.define("state-display", StateDisplay);
