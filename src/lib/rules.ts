import type { Grid } from "../core.ts";

export const NAMED_RULES = {
  conway: (grid: Grid, position: number, odds: number[]) => {
    return (
      // Odds of a dead cell becoming alive
      ((1 - grid.cells[position]) * odds[3]) +
      // Odds of a living cell surviving
      (grid.cells[position] * (odds[2] + odds[3]))
    );
  },
  ltl: (grid: Grid, position: number, odds: number[]) => {
    // LtL thresholds. Conway's Life equivalent: B=[3,3], S=[2,3].
		const [bmin, bmax] = [23, 30]; // birth range, circular R=5
		const [smin, smax] = [23, 39]; // survival range, circular R=5

    // Sum the probability of the count falling in the birth range [bmin, bmax]
    // and in the survival range [smin, smax]. Ranges are inclusive.
    let birthProb = 0;
    let surviveProb = 0;
    const maxK = odds.length - 1;
    const bHi = Math.min(bmax, maxK);
    const sHi = Math.min(smax, maxK);
    for (let k = bmin; k <= bHi; k++) birthProb += odds[k];
    for (let k = smin; k <= sHi; k++) surviveProb += odds[k];

    return (
      // Odds of a dead cell becoming alive (count lands in birth range)
      (1 - grid.cells[position]) * birthProb +
      // Odds of a living cell surviving (count lands in survival range)
      grid.cells[position] * surviveProb
    );
  },

  // Day/Night B3678/S34678
  dayNight: (grid: Grid, position: number, odds: number[]) => {
    return (
      // Odds of a dead cell becoming alive
      (1 - grid.cells[position]) * (odds[3] + odds[6] + odds[7] + odds[8]) +
      // Odds of a living cell surviving
      (grid.cells[position]) * (odds[3] + odds[4] + odds[6] + odds[7] + odds[8])
    );
  },

  // Diomoeba B35678/S5678
  diomoeba: (grid: Grid, position: number, odds: number[]) => {
    return (
      // Odds of a dead cell becoming alive
      (1 - grid.cells[position]) * (odds[3] + odds[5] + odds[6] + odds[7] + odds[8]) +
      // Odds of a living cell surviving
      (grid.cells[position]) * (odds[5] + odds[6] + odds[7] + odds[8])
    );
  },
  //B4678/S35678
  anneal: (grid: Grid, position: number, odds: number[]) => {
    return (
      // Odds of a dead cell becoming alive
      (1 - grid.cells[position]) * (odds[4] + odds[6] + odds[7] + odds[8]) +
      // Odds of a living cell surviving
      (grid.cells[position]) * (odds[3] + odds[5] + odds[6] + odds[7] + odds[8])
    );
  },
  interpolated: (grid: Grid, position: number, odds: number[], a: number, b: number) => {
    const rules = [
      { w: a, b: [0, 0, 0, 1, 0, 0, 0, 0, 0], s: [0, 0, 1, 1, 0, 0, 0, 0, 0] }, // Conway
      { w: b, b: [0, 0, 0, 1, 0, 1, 1, 1, 1], s: [0, 0, 0, 0, 0, 1, 1, 1, 1] }, // Diamoeba
      { w: a * b, b: [0, 0, 0, 1, 0, 0, 1, 1, 1], s: [0, 0, 0, 1, 1, 0, 1, 1, 1] }, // Day & Night
      { w: (1 - a) * (1 - b), b: [0, 0, 0, 1, 0, 0, 1, 0, 0], s: [0, 0, 1, 1, 0, 0, 0, 0, 0] }, // HighLife
      { w: (1 - a) * b, b: [0, 0, 1, 0, 0, 0, 0, 0, 0], s: [0, 0, 0, 0, 0, 0, 0, 0, 0] }, // Seeds
    ];

    const total = rules.reduce((acc, r) => acc + r.w, 0);

    let pBirth = 0, pSurvive = 0;
    for (let k = 0; k < 9; k++) {
      for (const r of rules) {
        pBirth += odds[k] * r.b[k] * r.w / total;
        pSurvive += odds[k] * r.s[k] * r.w / total;
      }
    }

    return (1 - grid.cells[position]) * pBirth + grid.cells[position] * pSurvive;
  },
};
