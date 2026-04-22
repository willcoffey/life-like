import { Grid } from "../core";
/**
 * Visual bar to represent the values 0 - 1 in the automatas color scale
 */
const HTML = `
<style>
  #grid-state {
    background-color: #222;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    border-top: 4px solid #ccc;
    grid-gap: 4px;
  }
</style>
<div id="state-display">
</div>
`;

class StateDisplay extends HTMLElement {
  shadow?: ShadowRoot;
  lastState?: Grid;
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
    console.log(grid);
  }
}
customElements.define("state-display", StateDisplay);
