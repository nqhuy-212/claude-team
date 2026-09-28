// Path patterns shared by the claude-team hooks.
// Syntax is gitignore-like: "dir/" means everything below, "**" crosses folders, "!" negates, last match wins.
import fs from "node:fs";
import path from "node:path";

export const IS_WIN = process.platform === "win32";
export const SECRET_FILES = [".env", ".env.*", "!.env.example", "*.pem", "*.pfx", "*.key"];

export const toPosix = (p) => p.split(path.sep).join("/");

export function globToRegex(glob) {
  let g = glob;
  if (g.endsWith("/")) g += "**";
  if (!g.includes("/")) g = "**/" + g;
  g = g.replace(/^\.?\//, "");
  let re = "";
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === "*" && g[i + 1] === "*") {
      if (g[i + 2] === "/") { re += "(?:.*/)?"; i += 2; } else { re += ".*"; i += 1; }
    } else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp("^" + re + "$", IS_WIN ? "i" : "");
}

export function matches(relPath, patterns) {
  let hit = null;
  for (const raw of patterns) {
    const negate = raw.startsWith("!");
    const pattern = negate ? raw.slice(1) : raw;
    if (globToRegex(pattern).test(relPath)) hit = negate ? null : pattern;
  }
  return hit;
}

export function readProjectPatterns(projectDir) {
  try {
    return fs.readFileSync(path.join(projectDir, ".claude", "protected"), "utf8")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  } catch {
    return [];
  }
}
