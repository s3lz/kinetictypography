#!/usr/bin/env node
import * as esbuild from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  entryPoints: [path.join(root, "server/vercel-handler.ts")],
  outfile: path.join(root, "api/creative-direction.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external",
  alias: {
    "@": path.join(root, "src"),
  },
  logLevel: "info",
});
