// PreToolUse hook: blocks edits to protected paths and reads of secret files.
// Exit code 2 = block; stderr is shown to Claude as the reason.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SECRET_FILES, matches, readProjectPatterns, toPosix } from "./lib/patterns.mjs";

const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
const CLAUDE_HOME = path.join(os.homedir(), ".claude");
const GLOBAL_LOCKED = ["CLAUDE.md", "settings.json", "hooks/**", "agents/**", "skills/**", "templates/**", "git-hooks/**"];
const PROJECT_LOCKED = [".claude/protected", ".claude/settings.json", ".claude/settings.local.json"];

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

const secret = matches(baseName, SECRET_FILES);
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
