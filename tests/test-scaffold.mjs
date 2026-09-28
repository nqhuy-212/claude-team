// Usage: node tests/test-scaffold.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCAFFOLD = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "global", "templates", "scaffold.mjs");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-test-"));
const run = () => spawnSync("node", [SCAFFOLD, dir, "--name", "Demo App"], { encoding: "utf8" });
const read = (f) => fs.readFileSync(path.join(dir, f), "utf8");
const exists = (f) => fs.existsSync(path.join(dir, f));

let failed = 0;
function check(label, ok) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

fs.writeFileSync(path.join(dir, ".gitignore"), "node_modules/\n.env");
const first = run();
check("first run exits 0", first.status === 0);
for (const f of ["CLAUDE.md", "docs/CODEMAP.md", "docs/DECISIONS.md", "docs/PROGRESS.md", ".env.example", ".claude/protected", ".gitattributes"]) {
  check(`creates ${f}`, exists(f));
}
check("renames gitignore/gitattributes", !exists("gitignore") && !exists("gitattributes"));
check("fills project name", read("CLAUDE.md").startsWith("# Demo App"));
check("fills date", /Cập nhật: \d{4}-\d{2}-\d{2}/.test(read("docs/PROGRESS.md")));
const docs = ["CLAUDE.md", "docs/CODEMAP.md", "docs/DECISIONS.md", "docs/PROGRESS.md"].map(read).join("");
check("no placeholders left", !/\{\{\w+\}\}/.test(docs));

const gitignore = read(".gitignore");
check("keeps existing .gitignore lines", gitignore.startsWith("node_modules/\n.env\n"));
check("appends missing .gitignore lines", gitignore.includes("*.xlsx") && gitignore.includes("!.env.example"));
check("does not duplicate .gitignore lines", gitignore.split(/\r?\n/).filter((l) => l === ".env").length === 1);

fs.writeFileSync(path.join(dir, "CLAUDE.md"), "custom");
const second = run();
check("second run exits 0", second.status === 0);
check("never overwrites existing files", read("CLAUDE.md") === "custom");
check("second run changes nothing", !/created:|merged:/.test(second.stdout));

fs.rmSync(dir, { recursive: true, force: true });
console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
