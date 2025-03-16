import { defineConfig } from "tsup";

export default defineConfig({
  shims: true,
  entryPoints: ["src/index.ts"],
  sourcemap: true,
  clean: false,
  dts: true,
  outDir: "dist",
  format: ["esm", "cjs"],
  onSuccess: "cp -a src/wsdl dist"
});
