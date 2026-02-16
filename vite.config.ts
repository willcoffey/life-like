import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "life-like.js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});
