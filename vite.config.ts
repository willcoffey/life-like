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
  plugins: [
    {
      name: "watch-assets",
      configureServer(server) {
        server.watcher.add(["./src/**/*.png", "./src/**/*.webp"]);
        server.watcher.on("change", (path) => {
          if (path.endsWith(".png") || path.endsWith(".webp")) {
            server.ws.send({ type: "full-reload" });
          }
        });
      },
    },
  ],
});
