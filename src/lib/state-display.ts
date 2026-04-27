import { Grid } from "../core";
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
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
</style>
<div id="state-display">
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
  }

  render(grid: Grid) {
    /** Check against old state and return early if nothing has changed */
    const newGrid: PartialBy<Grid, "cells"> = { ...grid };
    delete newGrid.cells;
    const newString = JSON.stringify(newGrid);
    if (newString === this.lastState) return;
    const keys: (keyof Grid)[] = ["playing", "activation", "alpha", "beta", "changeRate", "theme"];
    this.lastState = newString;
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
customElements.define("state-display", StateDisplay);
