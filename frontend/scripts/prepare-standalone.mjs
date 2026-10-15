import { cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = path.join(root, ".next", "standalone");

await cp(path.join(root, "public"), path.join(standaloneDir, "public"), {
  recursive: true,
  force: true
});
await cp(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"), {
  recursive: true,
  force: true
});

console.log("Standalone server assets prepared.");
