// PreToolUse hook: blocks edits to protected paths and reads of secret files.
// Exit code 2 = block; stderr is shown to Claude as the reason.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const IS_WIN = process.platform === "win32";
const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
const SECRET_PATTERNS = [".env", ".env.*", "!.env.example", "*.pem", "*.pfx", "*.key"];
const CLAUDE_HOME = path.join(os.homedir(), ".claude");
const GLOBAL_LOCKED = ["CLAUDE.md", "settings.json", "hooks/**", "agents/**", "skills/**", "templates/**"];
const PROJECT_LOCKED = [".claude/protected", ".claude/settings.json", ".claude/settings.local.json"];

const toPosix = (p) => p.split(path.sep).join("/");

function globToRegex(glob) {
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

function matches(relPath, patterns) {
  let hit = null;
  for (const raw of patterns) {
    const negate = raw.startsWith("!");
    const pattern = negate ? raw.slice(1) : raw;
    if (globToRegex(pattern).test(relPath)) hit = negate ? null : pattern;
  }
  return hit;
}

function readProjectPatterns(projectDir) {
  try {
    return fs.readFileSync(path.join(projectDir, ".claude", "protected"), "utf8")
      .replace(/^﻿/, "")
      .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  } catch {
    return [];
  }
}

function relativeInside(base, target) {
  const rel = path.relative(base, target);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return toPosix(rel);
}

function block(reason) {
  process.stderr.write(reason + "\n");
  process.exit(2);
}

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const tool = input.tool_name;
const rawPath = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
if (!rawPath || (tool !== "Read" && !EDIT_TOOLS.has(tool))) process.exit(0);

const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());
const target = path.resolve(projectDir, rawPath);
const baseName = path.basename(target);

const secret = matches(baseName, SECRET_PATTERNS);
if (secret) block(`BLOCKED: "${baseName}" là file bí mật (${secret}). Không đọc/sửa. Hãy dùng .env.example hoặc hỏi người dùng.`);

if (tool === "Read") process.exit(0);

const inHome = relativeInside(CLAUDE_HOME, target);
if (inHome) {
  const hit = matches(inHome, GLOBAL_LOCKED);
  if (hit) block(`BLOCKED: ~/.claude/${inHome} được quản lý bởi repo claude-team. Hãy sửa trong repo đó rồi chạy lại install.`);
}

const inProject = relativeInside(projectDir, target);
if (inProject) {
  const hit = matches(inProject, [...PROJECT_LOCKED, ...readProjectPatterns(projectDir)]);
  if (hit) block(`BLOCKED: "${inProject}" nằm trong vùng bảo vệ (luật: ${hit}). Không sửa file này và không tìm cách lách; hãy báo người dùng nếu thật sự cần sửa.`);
}

process.exit(0);
