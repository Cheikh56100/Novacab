import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../src/", import.meta.url).pathname;
const app = readFileSync(join(root, "App.jsx"), "utf8");
if (app.split(/\r?\n/).length > 20) throw new Error("src/App.jsx doit rester un point d'entrée minimal");

const cabinet = readFileSync(join(root, "components-refactored/CabinetApp.jsx"), "utf8");
const lines = cabinet.split(/\r?\n/).length;
if (lines > 1000) throw new Error(`CabinetApp.jsx trop volumineux: ${lines} lignes`);

const componentsDir = join(root, "components-refactored");
const jsxFiles = readdirSync(componentsDir).filter((name) => name.endsWith(".jsx"));
const missingReactImport = jsxFiles.filter((name) => {
  const text = readFileSync(join(componentsDir, name), "utf8");
  return /\buse(State|Effect|Memo|Callback|Ref)\b/.test(text) && !/from ["']react["']/.test(text);
});
if (missingReactImport.length) throw new Error(`Hooks React sans import React: ${missingReactImport.join(", ")}`);

console.log(`Architecture OK — App.jsx: ${app.split(/\r?\n/).length} lignes; CabinetApp.jsx: ${lines} lignes; composants: ${jsxFiles.length}`);
