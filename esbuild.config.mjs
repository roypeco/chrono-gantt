import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { existsSync } from "fs";

const isProd = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: isProd ? false : "inline",
  treeShaking: true,
  outfile: existsSync("/obsidian-plugin") ? "/obsidian-plugin/main.js" : "main.js",
});

if (isProd) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
