import type { Grid } from "../life-like";
interface Rule {
  // How much to adjust high / low probs
  amp: number;
  rules: {
    b: number[]; // define when a dead cell becomes alive, b[3]=1 means when 3 neighbors live, become alive
    s: number[]; // define when a live cell survices or dies, s[2] = 0 means a live cell dies when it has 2 neighbors
  }[];
}
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
export const rules = [
  {
    "amp": .6,
    "rules": [
      { "b": [1, 0, 0, 0, 0, 1, 0, 1, 1], "s": [1, 0, 1, 1, 0, 1, 1, 1, 1] },
      { "b": [1, 0, 1, 1, 1, 0, 0, 0, 0], "s": [1, 1, 1, 1, 1, 1, 1, 1, 1] },
      { "b": [0, 0, 1, 0, 0, 0, 0, 0, 0], "s": [1, 1, 0, 1, 1, 1, 1, 1, 1] },
    ],
  },
  {
    "amp": 1.71,
    "rules": [
      { "b": [0, 0, 1, 1, 0, 0, 0, 0, 0], "s": [1, 1, 1, 1, 1, 1, 1, 1, 1] },
      { "b": [0, 0, 0, 1, 0, 0, 0, 0, 0], "s": [0, 1, 1, 1, 1, 1, 1, 1, 1] },
      { "b": [0, 0, 1, 0, 1, 0, 0, 0, 0], "s": [1, 1, 1, 1, 1, 1, 1, 1, 0] },
    ],
  },

  {
    "amp": 2,
    "rules": [
      { "b": [0, 0, 1, 0, 0, 0, 0, 0, 0], "s": [1, 1, 1, 1, 1, 1, 1, 0, 1] },
      { "b": [0, 0, 0, 0, 0, 0, 0, 0, 0], "s": [0, 1, 1, 1, 1, 1, 1, 1, 1] },
      { "b": [0, 0, 1, 0, 0, 0, 0, 0, 0], "s": [1, 1, 1, 1, 1, 1, 1, 1, 1] },
    ],
  },

  {
    "amp": 2.2,
    "rules": [
      { "b": [0, 0, 0, 0, 1, 0, 0, 0, 0], "s": [0, 0, 0, 1, 0, 1, 0, 0, 0] },
      { "b": [0, 0, 0, 0, 0, 0, 0, 0, 0], "s": [0, 0, 0, 0, 1, 0, 0, 1, 1] },
    ],
  },
  {
    "amp": .71,
    "rules": [
      { "b": [0, 1, 0, 0, 1, 0, 1, 0, 0], "s": [0, 0, 1, 0, 0, 1, 1, 0, 1] },
      { "b": [0, 0, 0, 0, 0, 0, 0, 0, 0], "s": [1, 0, 0, 0, 1, 0, 1, 0, 1] },
      { "b": [0, 1, 0, 0, 1, 0, 1, 0, 0], "s": [0, 0, 1, 0, 0, 1, 1, 0, 1] },
      { "b": [0, 1, 0, 0, 1, 0, 1, 0, 0], "s": [0, 0, 1, 0, 0, 1, 1, 0, 1] },
      { "b": [0, 1, 0, 0, 1, 0, 1, 0, 0], "s": [0, 0, 1, 0, 0, 1, 1, 0, 1] },
      { "b": [0, 1, 0, 0, 1, 0, 1, 0, 0], "s": [0, 0, 1, 0, 0, 1, 1, 0, 1] },
      { "b": [0, 1, 0, 0, 1, 0, 1, 0, 0], "s": [0, 0, 1, 0, 0, 1, 1, 0, 1] },
      { "b": [0, 1, 0, 0, 1, 0, 1, 0, 0], "s": [0, 0, 1, 0, 0, 1, 1, 0, 1] },
      { "b": [0, 1, 0, 0, 1, 0, 1, 0, 0], "s": [0, 0, 1, 0, 0, 1, 1, 0, 1] },
    ],
  },
  {
    "amp": 1,
    "rules": [
      { "b": [null, 0, 0, 0, 1, 0, 0, 0, 0], "s": [1, 1, 1, 1, 1, 1, 0, 0, 1] },
      { "b": [null, 0, 0, 0, 1, 0, 0, 0, 0], "s": [1, 1, 0, 0, 1, 1, 0, 1, 1] },
    ],
  },
];
