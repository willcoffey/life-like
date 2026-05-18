import { Grid } from "../core";

/** Drops runtime-only fields when serializing a Grid (used for diffing). */
const omitRuntime = (key: string, value: unknown) =>
  key === "cells" || key === "cache" ? undefined : value;

type Field = [label: string, get: (g: Grid) => string];
const FIELDS: Field[] = [
  ["tick", (g) => `${g.tick}`],
  ["mode", (g) => g.mode],
  ["playing", (g) => `${g.playing}`],
  ["width", (g) => `${g.width}`],
  ["height", (g) => `${g.height}`],
  ["rule", (g) => g.rule],
  ["activation", (g) => g.activation],
  ["alpha", (g) => g.alpha.toFixed(2)],
  ["beta", (g) => g.beta.toFixed(2)],
  ["changeRate", (g) => `${g.changeRate}`],
  ["theme", (g) => String(g.theme)],
  ["pd.type", (g) => g.phaseDiagram.type],
  ["win min x", (g) => `${g.phaseDiagram.x[0]}`],
  ["win max x", (g) => `${g.phaseDiagram.x[1]}`],
  ["win min y", (g) => `${g.phaseDiagram.y[0]}`],
  ["win max y", (g) => `${g.phaseDiagram.y[1]}`],
  ["pd.lowB", (g) => g.phaseDiagram.type === "rule" ? `${g.phaseDiagram.lowB}` : "-"],
  ["pd.lowS", (g) => g.phaseDiagram.type === "rule" ? `${g.phaseDiagram.lowS}` : "-"],
];

const HTML = `
<style>
  :host { font: 14px/1.3 monospace; color: #eee; }
  #sd { display: grid; grid-template-columns: repeat(6, fit-content(180px));
        justify-content: start; gap: 1px; background: #222; }
  #sd > * { background: #000; padding: 4px 6px; min-width: 0;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #sd > [data-label]:focus { white-space: normal; word-break: break-all;
                             outline: 1px solid #888; }
  #sd > [data-label]::before { content: attr(data-label); display: block;
                               opacity: .6; font-size: 12px; }
  #actions { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr 2fr;
             gap: 1px; padding: 0; background: transparent; }
  #actions > * { font: inherit; padding: 4px; min-width: 0; }
  textarea { resize: none; }
  @media (max-width: 600px) {
    #sd { grid-template-columns: repeat(3, fit-content(180px)); }
  }
</style>
<div id="sd">
  <div id="actions">
    <button id="yank-command" type="button">copy cmd</button>
    <button id="yank-json" type="button">copy json</button>
    <textarea id="paste-json" rows="1" placeholder="paste json"></textarea>
  </div>
${FIELDS.map(([l], i) => `  <div tabindex="0" data-label="${l}" data-i="${i}"></div>`).join("\n")}
</div>
`;

/**
 * View-only display for grid state. Renders fields on `render(grid)` and emits
 * bubbling, composed CustomEvents (`yank-command`, `yank-json`, `load-state`)
 * for user actions -- the host element is responsible for acting on them.
 */
export class StateDisplay extends HTMLElement {
  shadow?: ShadowRoot;
  lastState?: string;
  cells: HTMLElement[] = [];

  emit(name: string, detail?: unknown) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = HTML;
    this.cells = FIELDS.map((_, i) =>
      this.shadow!.querySelector(`[data-i="${i}"]`) as HTMLElement
    );

    this.shadow.getElementById("yank-command")?.addEventListener(
      "click",
      () => this.emit("yank-command"),
    );
    this.shadow.getElementById("yank-json")?.addEventListener(
      "click",
      () => this.emit("yank-json"),
    );

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
      this.emit("load-state", state);
      pasteEl.value = "";
    });
  }

  render(grid: Grid) {
    const newString = JSON.stringify(grid, omitRuntime);
    if (newString === this.lastState) return;
    this.lastState = newString;
    for (let i = 0; i < FIELDS.length; i++) {
      const v = FIELDS[i][1](grid);
      this.cells[i].textContent = v;
      this.cells[i].title = v;
    }
  }
}

customElements.define("state-display", StateDisplay);
