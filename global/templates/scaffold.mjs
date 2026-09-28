// Copies the project template into a directory without overwriting existing files.
// Existing .gitignore/.gitattributes only get the missing lines appended.
// Usage: node scaffold.mjs [targetDir] [--name "Project name"]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "project");
// Stored without the dot so git does not apply them to this repo.
const RENAMES = { gitignore: ".gitignore", gitattributes: ".gitattributes" };
const MERGEABLE = new Set(Object.values(RENAMES));

const toPosix = (p) => p.split(path.sep).join("/");
const pad = (n) => String(n).padStart(2, "0");

function parseArgs(argv) {
  const args = { target: ".", name: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--name") args.name = argv[++i];
    else args.target = argv[i];
  }
  return args;
}

function listFiles(dir, prefix = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(prefix, entry.name);
    return entry.isDirectory() ? listFiles(path.join(dir, entry.name), rel) : [rel];
  });
}

function appendMissingLines(destFile, templateText) {
  const existing = fs.readFileSync(destFile, "utf8");
  const have = new Set(existing.split(/\r?\n/).map((l) => l.trim()));
  const missing = templateText.split(/\r?\n/).map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !have.has(l));
  if (!missing.length) return false;
  const sep = !existing || existing.endsWith("\n") ? "" : "\n";
  fs.appendFileSync(destFile, `${sep}\n# Added by claude-team template\n${missing.join("\n")}\n`);
  return true;
}

const { target, name } = parseArgs(process.argv.slice(2));
const targetDir = path.resolve(target);
const now = new Date();
const vars = {
  PROJECT_NAME: name || path.basename(targetDir),
  DATE: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
};
const fill = (text) => text.replace(/\{\{(\w+)\}\}/g, (m, key) => vars[key] ?? m);

const report = { created: [], merged: [], skipped: [] };
for (const rel of listFiles(TEMPLATE)) {
  const baseName = path.basename(rel);
  const destRel = path.join(path.dirname(rel), RENAMES[baseName] ?? baseName);
  const dest = path.join(targetDir, destRel);
  const text = fill(fs.readFileSync(path.join(TEMPLATE, rel), "utf8"));
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, text);
    report.created.push(toPosix(destRel));
  } else if (MERGEABLE.has(path.basename(destRel)) && appendMissingLines(dest, text)) {
    report.merged.push(toPosix(destRel));
  } else {
    report.skipped.push(toPosix(destRel));
  }
}

console.log(`Scaffold "${vars.PROJECT_NAME}" into ${targetDir}`);
for (const [label, files] of Object.entries(report)) {
  if (files.length) console.log(`${label}:\n${files.map((f) => "  " + f).join("\n")}`);
}
