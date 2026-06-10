import { builtinModules } from "node:module";
import { defineConfig } from "vitest/config";

const external = [
  "node-forge",
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
];

export default defineConfig({
  build: {
    target: "node20",
    sourcemap: true,
    copyPublicDir: false,
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external,
    },
  },
  test: {
    environment: "node",
  },
});
