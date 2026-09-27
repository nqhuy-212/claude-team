// Installs this repo's global config into ~/.claude (merge, never wipe).
// Usage: node install.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(REPO, "global");
const HOME = path.join(os.homedir(), ".claude");
const HOME_POSIX = HOME.split(path.sep).join("/");
const HOOK_MARKER = "protect-files.mjs";

fs.mkdirSync(HOME, { recursive: true });

function backup(file) {
  if (fs.existsSync(file)) fs.copyFileSync(file, file + ".bak");
}

for (const dir of ["hooks", "agents", "skills"]) {
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
    (e) => !(e.hooks ?? []).some((h) => h.command?.includes(HOOK_MARKER))
  );
  current.hooks[event] = [...kept, ...entries];
}

backup(settingsFile);
fs.writeFileSync(settingsFile, JSON.stringify(current, null, 2) + "\n");

console.log(`Installed to ${HOME}. Restart Claude Code (or open /hooks) to load the new hooks.`);
