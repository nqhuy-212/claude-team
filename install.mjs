// Installs this repo's global config into ~/.claude (merge, never wipe).
// Usage: node install.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(REPO, "global");
const HOME = path.join(os.homedir(), ".claude");
const HOME_POSIX = HOME.split(path.sep).join("/");
const OUR_HOOKS = ["protect-files.mjs", "check-commit.mjs"];
// With a global core.hooksPath git skips .git/hooks, so these pass through to the repo's own hooks (and Git LFS).
const PASSTHROUGH_HOOKS = [
  "applypatch-msg", "pre-applypatch", "post-applypatch", "pre-merge-commit", "prepare-commit-msg", "commit-msg",
  "post-commit", "pre-rebase", "post-checkout", "post-merge", "pre-push", "post-rewrite", "pre-auto-gc", "sendemail-validate",
];

fs.mkdirSync(HOME, { recursive: true });

function backup(file) {
  if (fs.existsSync(file)) fs.copyFileSync(file, file + ".bak");
}

for (const dir of ["hooks", "agents", "skills", "templates"]) {
  const from = path.join(SRC, dir);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(HOME, dir), { recursive: true, force: true });
}

const claudeMd = path.join(HOME, "CLAUDE.md");
backup(claudeMd);
fs.copyFileSync(path.join(SRC, "CLAUDE.md"), claudeMd);

const settingsFile = path.join(HOME, "settings.json");
const current = fs.existsSync(settingsFile) ? JSON.parse(fs.readFileSync(settingsFile, "utf8")) : {};
const ours = JSON.parse(fs.readFileSync(path.join(SRC, "settings.json"), "utf8").replaceAll("{{CLAUDE_HOME}}", HOME_POSIX));

current.permissions ??= {};
current.permissions.deny = [...new Set([...(current.permissions.deny ?? []), ...ours.permissions.deny])];

current.hooks ??= {};
for (const [event, entries] of Object.entries(ours.hooks)) {
  const kept = (current.hooks[event] ?? []).filter(
    (e) => !(e.hooks ?? []).some((h) => OUR_HOOKS.some((name) => h.command?.includes(name)))
  );
  current.hooks[event] = [...kept, ...entries];
}

backup(settingsFile);
fs.writeFileSync(settingsFile, JSON.stringify(current, null, 2) + "\n");

const gitHooks = path.join(HOME, "git-hooks");
fs.mkdirSync(gitHooks, { recursive: true });
function writeGitHook(name, text) {
  const file = path.join(gitHooks, name);
  fs.writeFileSync(file, text.replace(/\r\n/g, "\n"));
  fs.chmodSync(file, 0o755);
}
writeGitHook("pre-commit", fs.readFileSync(path.join(SRC, "git-hooks", "pre-commit"), "utf8").replaceAll("{{CLAUDE_HOME}}", HOME_POSIX));
const passthrough = fs.readFileSync(path.join(SRC, "git-hooks", "passthrough"), "utf8");
for (const name of PASSTHROUGH_HOOKS) writeGitHook(name, passthrough);

function setGlobalHooksPath(dir) {
  const get = spawnSync("git", ["config", "--global", "--get", "core.hooksPath"], { encoding: "utf8" });
  if (get.error) return "WARNING: git not found, core.hooksPath not set. Your own commits are NOT checked.";
  const existing = get.stdout.trim();
  if (existing === dir) return `git core.hooksPath = ${dir}`;
  if (existing) return `WARNING: core.hooksPath is already "${existing}", left unchanged. Your own commits are NOT checked.`;
  const set = spawnSync("git", ["config", "--global", "core.hooksPath", dir], { encoding: "utf8" });
  return set.status === 0 ? `Set git core.hooksPath = ${dir}` : `WARNING: could not set core.hooksPath: ${set.stderr.trim()}`;
}

console.log(setGlobalHooksPath(HOME_POSIX + "/git-hooks"));
console.log(`Installed to ${HOME}. Restart Claude Code (or open /hooks) to load the new hooks.`);
