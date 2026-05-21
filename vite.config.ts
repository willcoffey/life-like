import { defineConfig } from "vite";

export default defineConfig({
  server: { open: "/dev.html" },
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
      /**
       * index.html is used for github pages, and requires a built version of
       * life-like.ts but I still want the vite server to automatically load
       * the dev file, so it needs a manual redirect to dev.html since
       * index.html is already in use
       */
      name: "root-to-dev",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/") req.url = "/dev.html";
          next();
        });
      },
    },
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
