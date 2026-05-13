export type ShaperName = keyof typeof Shapers;
export type Shaper = {
  fn: (x: number, alpha: number, beta: number) => number;
  diagram: {
    alpha: [number, number];
    beta: [number, number];
  };
};
export function isShaperName(name: string): name is ShaperName {
  return Object.hasOwn(Shapers, name);
}
export const Shapers = {
  "none": { fn: (state) => state, diagram: { alpha: [0, 0], beta: [0, 0] } },
  /**
   * Classic s shaped logistic curve.
   * Negative gamma flips orientation (decreasing instead of increasing).
   */
  sigmoid: {
    fn(value: number, gamma: number, offset: number): number {
      return 1 / (1 + Math.pow(Math.E, gamma * (-value + offset)));
    },
    diagram: {
      "alpha": [1.5, 1.7787139177903089],
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
      "alpha": [-0.15, .30],
      "beta": [-0.2, 0.2],
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
   * Hermite smoothstep: 3t² - 2t³ over a window centered at alpha with width
   * beta, clamped to [0, 1] outside. Like sigmoid but with a finite support
   * region and zero derivative at the edges.
   *  - alpha is the center of the transition
   *  - beta is the width of the transition
   */
  smoothstep: {
    fn(x: number, alpha: number, beta: number): number {
      if (beta === 0) return x < alpha ? 0 : 1;
      const half = beta / 2;
      const t = (x - (alpha - half)) / beta;
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return t * t * (3 - 2 * t);
    },
    diagram: {
      "alpha": [-6, 6],
      "beta": [-3, 3],
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
      alpha: [-5, 5], // symmetric, integer cycles
      beta: [-Math.PI, 2 * Math.PI], // 1.5 periods, peak (β=π/2) centered
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
