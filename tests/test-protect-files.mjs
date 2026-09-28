// Usage: node tests/test-protect-files.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "global", "hooks", "protect-files.mjs");
const project = fs.mkdtempSync(path.join(os.tmpdir(), "protect-test-"));
fs.mkdirSync(path.join(project, ".claude"));
fs.writeFileSync(path.join(project, ".claude", "protected"), "﻿src/payroll/\r\n# comment\n\nconfig.py\nmigrations/**\n!migrations/draft.sql\n");
const home = path.join(os.homedir(), ".claude");

const cases = [
  ["Edit", "src/payroll/calc.py", 2],
  ["Write", "src/payroll/sub/x.py", 2],
  ["Edit", "src/sales/calc.py", 0],
  ["Edit", "config.py", 2],
  ["Edit", "app/config.py", 2],
  ["Edit", "migrations/001.sql", 2],
  ["Edit", "migrations/draft.sql", 0],
  ["Read", "config.py", 0],
  ["Read", ".env", 2],
  ["Read", ".env.production", 2],
  ["Read", ".env.example", 0],
  ["Edit", ".env.example", 0],
  ["Write", ".claude/protected", 2],
  ["Write", ".claude/settings.local.json", 2],
  ["Edit", path.join(home, "settings.json"), 2],
  ["Edit", path.join(home, "hooks", "protect-files.mjs"), 2],
  ["Write", path.join(home, "templates", "project", "CLAUDE.md"), 2],
  ["Write", path.join(home, "projects", "x", "memory", "m.md"), 0],
  ["Bash", "src/payroll/calc.py", 0],
];

let failed = 0;
for (const [tool, file, expected] of cases) {
  const input = JSON.stringify({ tool_name: tool, tool_input: { file_path: path.resolve(project, file) }, cwd: project });
  const r = spawnSync("node", [HOOK], { input, env: { ...process.env, CLAUDE_PROJECT_DIR: project }, encoding: "utf8" });
  const ok = r.status === expected;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${tool.padEnd(6)} ${file}  -> exit ${r.status}${r.stderr ? "  " + r.stderr.trim() : ""}`);
}
fs.rmSync(project, { recursive: true, force: true });
console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
