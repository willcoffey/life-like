import { ColorMap } from "./ColorMap";
/**
 * Visual bar to represent the values 0 - 1 in the automatas color scale
 */
const HTML = `
<style>
#scale {
  display: flex;
  align-items: flex;
  width: 100%;
  border-radius: 4px;
  padding: 2px;
  border: 2px solid #000;
  box-sizing: border-box;
  background-color: #FFF;
}
#color-scale {
  font-family: sans-serif;
  width: 100%;
  border: 1px solid #000;
  box-sizing: border-box;
  border-radius: 4px;
}
.scale-num {
  padding: 0 2px 0 2px;
  text-align: center;
}
</style>
<div id="scale">
  <div class = "scale-num">0</div>
  <canvas id="color-scale"></canvas>
  <div class = "scale-num">1</div>
</div>
`;

class ColorScale extends HTMLElement {
  shadow?: ShadowRoot;
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
    this.render();
  }

  render() {
    const ctx = this.getCtx();
    ctx.canvas.width = 4096;
    ctx.canvas.height = 1;
    const imageData = ColorScale.createImageData(4096);
    ctx.putImageData(imageData, 0, 0);
  }

  getCtx() {
    const canvas = this.shadow?.getElementById("color-scale");
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) throw "No canvas element";
    const ctx = canvas.getContext("2d");
    if (!ctx) throw "Could not get 2D context";
    return ctx;
  }

  /**
   * Use the same method as the automata rendere to get a gradient bar
   * image
   */
  static createImageData(width: number) {
    const imgDataArray = new Uint8ClampedArray(width * 4);
    const imageData = new ImageData(imgDataArray, width, 1);

    for (let i = 0; i <= width; i++) {
      const value = i / width;
      const [r, g, b, a] = ColorMap.getRGBA(value);
      imgDataArray[i * 4] = r;
      imgDataArray[i * 4 + 1] = g;
      imgDataArray[i * 4 + 2] = b;
      imgDataArray[i * 4 + 3] = a;
    }
    return imageData;
  }
}
customElements.define("color-scale", ColorScale);
