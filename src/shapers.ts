export type ShaperName = keyof typeof Shapers;
export type Shaper = {
  fn: (x: number, alpha: number, beta: number) => number;
  diagram: {
    alpha: [number, number];
    beta: [number, number];
  };
};
export const Shapers = {
  /**
   * Classic s shaped logistic curve.
   * Negative gamma flips orientation (decreasing instead of increasing).
   */
  sigmoid: {
    fn(value: number, gamma: number, offset: number): number {
      return 1 / (1 + Math.pow(Math.E, gamma * (-value + offset)));
    },
    diagram: {
      "alpha": [-1.470223180839406, 1.7787139177903089],
      "beta": [-0.9703970221859363, 1.6285400764437763],
    },
  },

  /**
   * Same type of activation function used for lenia. A bump shape.
   *     .-.
   *    /   \
   * __/     \__
   */
  gaussian: {
    fn(x: number, center: number, width: number): number {
      if (width === 0) return x === center ? 1 : 0;
      const z = (x - center) / width;
      return Math.exp(-0.5 * z * z);
    },
    diagram: {
      "alpha": [-0.6555734920896203, 1.3558666226111793],
      "beta": [-0.7557778051623004, 0.7556623095384988],
    },
  },

  /**
   * A bowl with the same characteristics as gaussian
   */
  inverseGaussian: {
    fn(x: number, center: number, width: number): number {
      if (width === 0) return x === center ? 1 : 0;
      const z = (x - center) / width;
      return 1 - Math.exp(-0.5 * z * z);
    },
    diagram: {
      "alpha": [-0.375, 0.625],
      "beta": [-0.16875, 0.18125],
    },
  },

  /**
   * Similar S shape to a sigmoid, but f(0) = 0 and f(1) = 1.
   * Input must be 0-1.
   */
  powerTransform: {
    fn(x: number, alpha: number, offset: number): number {
      const t = Math.pow(offset, alpha);
      const oneMinusT = Math.pow(1 - offset, alpha);
      const num = Math.pow(x, alpha) * oneMinusT;
      return num / (num + Math.pow(1 - x, alpha) * t);
    },
    diagram: {
      "alpha": [-0.6555734920896203, 1.3558666226111793],
      "beta": [-0.7557778051623004, 0.7556623095384988],
    },
  },

  /**
   * Sine wave shaper. Output is in [0, 1].
   *  - alpha controls frequency
   *  - beta shifts the wave horizontally
   */
  sin: {
    fn(x: number, alpha: number, beta: number): number {
      return (Math.sin(2 * Math.PI * alpha * x + beta) + 1) / 2;
    },
    diagram: {
      "alpha": [-4.976417966017118, 5.226417966017118],
      "beta": [-3.3612381562931777, 6.1915977757410605],
    },
  },

  /**
   * Sum of two sine waves with independent frequencies. Output in [0, 1].
   * Close frequencies produce beats; integer ratios produce harmonic shapes.
   *  - alpha is the first frequency
   *  - beta is the second frequency
   */
  sinSum: {
    fn(x: number, alpha: number, beta: number): number {
      return (Math.sin(2 * Math.PI * alpha * x) + Math.sin(2 * Math.PI * beta * x) + 2) / 4;
    },
    diagram: {
      "alpha": [-5, 5],
      "beta": [-5, 5],
    },
  },

  /**
   * Linear chirp — sine whose frequency sweeps across x. Non-periodic; the
   * wave compresses or stretches as x grows.
   *  - alpha is the base frequency
   *  - beta is the chirp rate (how fast frequency changes with x)
   */
  chirp: {
    fn(x: number, alpha: number, beta: number): number {
      return (Math.sin(2 * Math.PI * (alpha + beta * x) * x) + 1) / 2;
    },
    diagram: {
      "alpha": [-5, 5],
      "beta": [-5, 5],
    },
  },

  /**
   * Square wave centered at 0.5 with amplitude 0.25 (output in [0.375, 0.625]).
   *  - alpha controls frequency
   *  - beta shifts the wave horizontally
   */
  square25: {
    fn(x: number, alpha: number, beta: number): number {
      return Math.sin(2 * Math.PI * alpha * x + beta) >= 0 ? 0.625 : 0.375;
    },
    diagram: {
      "alpha": [-5, 5],
      "beta": [-Math.PI, Math.PI],
    },
  },

  /**
   * Square wave centered at 0.5 with amplitude 0.5 (output in [0.25, 0.75]).
   */
  square50: {
    fn(x: number, alpha: number, beta: number): number {
      return Math.sin(2 * Math.PI * alpha * x + beta) >= 0 ? 0.75 : 0.25;
    },
    diagram: {
      "alpha": [-5, 5],
      "beta": [-Math.PI, Math.PI],
    },
  },

  /**
   * Square wave centered at 0.5 with amplitude 0.75 (output in [0.125, 0.875]).
   */
  square75: {
    fn(x: number, alpha: number, beta: number): number {
      return Math.sin(2 * Math.PI * alpha * x + beta) >= 0 ? 0.875 : 0.125;
    },
    diagram: {
      "alpha": [-5, 5],
      "beta": [-Math.PI, Math.PI],
    },
  },

  /**
   * Sine wave shaper with amplitude + phase control.
   */
  sinAmp: {
    fn(x: number, alpha: number, beta: number): number {
      return (alpha * Math.sin(2 * Math.PI * x + beta) + 1) / 2;
    },
    diagram: {
      "alpha": [0, 2],
      "beta": [0, 2 * Math.PI],
    },
  },

  /**
   * Concentric rings in PhaseDiagram mode. Treats (alpha, beta) as 2D
   * coordinates and computes a radial mask cos(2π·k·r), then multiplies cell
   * state by it. Cells in "on" bands evolve normally via Conway rules; cells
   * in "off" bands get attenuated to 0. Rings are origin-centered — pan the
   * phase diagram to shift the center, zoom to change visible ring count.
   */
  rings: {
    fn(x: number, alpha: number, beta: number): number {
      const r = Math.sqrt(alpha * alpha + beta * beta);
      const phase = 2 * Math.PI * 3 * r;
      const center = 0.35 + 0.15 * Math.cos(phase);
      const width = 0.12 + 0.06 * Math.sin(phase);
      const z = (x - center) / width;
      return Math.exp(-0.5 * z * z);
    },
    diagram: {
      "alpha": [-1, 1],
      "beta": [-1, 1],
    },
  },

  /**
   * My hacky function that just takes a slope, inverts it around a threshold, and adds a constant
   * value. Even after adding various better functions this continued to produce good patterns.
   */
  will: {
    fn(state: number, m: number, x: number): number {
      if (state >= 1) return 1;
      if (state <= 0) return 0;

      if (state < x) {
        state = state / m;
      } else {
        state = 1 - ((1 - state) / m);
      }

      if (state >= 1) return 1;
      if (state <= 0) return 0;
      return state;
    },
    diagram: {
      "alpha": [-1.7015573892103815, 2.55797603970695],
      "beta": [-0.25476671445866594, 1.004766714458666],
    },
  },
} satisfies Record<string, Shaper>;
