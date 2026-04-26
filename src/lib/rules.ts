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
};
