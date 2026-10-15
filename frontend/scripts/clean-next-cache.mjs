import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const nextCachePath = join(scriptDir, "..", ".next");

rmSync(nextCachePath, { recursive: true, force: true });
console.log("Cleared .next cache");
