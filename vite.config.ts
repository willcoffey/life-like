import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/life-like.ts",
      name: "LifeLike",
      formats: ["iife"],
      fileName: () => "life-like.js",
    },
  },
});
