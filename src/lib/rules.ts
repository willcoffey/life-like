import type { Grid } from "../core.ts";
export interface Rule {
  (state: number, pmf: number[]): number;
}

export const Rules = {
  /**
   * Larger than life ruels where
   * sMin - minimal # of living cells for a state 1 cell to survive
   * sMax - maximum # of living cells before a state 1 cell dies
   * bMin - minimum # of living cells for a dead cell to birth
   * bMax - maximum # of living cells for a dead cell to birth
   *
   * state is a [0-1] value representing odds this cell is alive
   * return value is the probability this cell is state 1, given the PMF
   */
  largerThanLife: (
    [sMin, sMax]: [number, number],
    [bMin, bMax]: [number, number],
    middle: number, // 0 or 1, if the middle is included or not
    state: number,
    pmf: number[],
  ) => {
    // If the middle is included, we don't need to check our state, just overall neighborhood
    if (middle) {
      let total = 0;
      for (let i = 0; i < pmf.length; i++) {
        if ((i >= bMin && i <= bMax) || (i >= sMin && i <= sMax)) {
          total += pmf[i];
        }
      }
      return total;
    } else {
      let birth = 0;
      for (let i = bMin; i <= bMax; i++) birth += pmf[i];

      let survive = 0;
      for (let i = sMin; i <= sMax; i++) survive += pmf[i];
      return (1 - state) * birth + state * survive;
    }
  },
};

export const NAMED_RULES = {
  conway: (grid: Grid, position: number, odds: number[]) => {
    return (
      // Odds of a dead cell becoming alive
      ((1 - grid.cells[position]) * odds[3]) +
      // Odds of a living cell surviving
      (grid.cells[position] * (odds[2] + odds[3]))
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
  // Larger-than-Life Conway. Bosco's rule scaled to any neighborhood size.
  // At range 5 / Moore (120 neighbors) this is exactly Bosco's: B34-45/S33-57.
  // Thresholds are stored as Bosco fractions and re-scaled to the actual
  // neighbor count, so the rule works for any radius / shape.
  largerThanLifeConway: (grid: Grid, position: number, odds: number[]) => {
    const totalNeighbors = odds.length - 1;
    const birthMin = Math.round(totalNeighbors * 34 / 120);
    const birthMax = Math.round(totalNeighbors * 45 / 120);
    const survivalMin = Math.round(totalNeighbors * 33 / 120);
    const survivalMax = Math.round(totalNeighbors * 57 / 120);

    let birth = 0;
    for (let k = birthMin; k <= birthMax; k++) birth += odds[k];

    let survival = 0;
    for (let k = survivalMin; k <= survivalMax; k++) survival += odds[k];

    return (1 - grid.cells[position]) * birth +
      grid.cells[position] * survival;
  },
};
