// Checks agent and skill frontmatter so a typo cannot silently break the team.
// Usage: node tests/test-definitions.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GLOBAL = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "global");
const CORE_AGENTS = ["architect", "reviewer", "tester", "ui-builder", "scout"];
const READ_ONLY = new Set(["architect", "reviewer", "scout"]);
const WRITE_TOOLS = ["Edit", "Write", "NotebookEdit"];
const MODELS = new Set(["opus", "sonnet", "haiku", "inherit"]);
const EFFORTS = new Set(["low", "medium", "high", "xhigh", "max"]);
const COLORS = new Set(["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"]);

let failed = 0;
function check(label, ok) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

function parse(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const fields = {};
  const unsafe = [];
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const raw = kv[2].trim();
    // An unquoted ": " makes YAML read the rest as a nested mapping.
    if (!/^["']/.test(raw) && /:\s/.test(raw)) unsafe.push(kv[1]);
    fields[kv[1]] = raw.replace(/^"(.*)"$/, "$1");
  }
  return { fields, body: m[2].trim(), unsafe };
}

const list = (value) => (value ? value.split(",").map((s) => s.trim()).filter(Boolean) : []);

const agentDir = path.join(GLOBAL, "agents");
for (const name of CORE_AGENTS) check(`agent ${name} exists`, fs.existsSync(path.join(agentDir, `${name}.md`)));

for (const file of fs.readdirSync(agentDir).filter((f) => f.endsWith(".md"))) {
  const id = path.basename(file, ".md");
  const def = parse(path.join(agentDir, file));
  if (!def) { check(`agent ${id}: has frontmatter`, false); continue; }
  const { fields, body, unsafe } = def;
  const tools = list(fields.tools);
  const denied = list(fields.disallowedTools);
  check(`agent ${id}: name matches file`, fields.name === id);
  check(`agent ${id}: has description and prompt`, Boolean(fields.description) && body.length > 0);
  check(`agent ${id}: no unquoted ": " in values`, unsafe.length === 0);
  check(`agent ${id}: model is valid`, MODELS.has(fields.model));
  check(`agent ${id}: effort is valid`, fields.effort === undefined || EFFORTS.has(fields.effort));
  check(`agent ${id}: color is valid`, fields.color === undefined || COLORS.has(fields.color));
  check(`agent ${id}: cannot spawn agents`, fields.tools ? !tools.includes("Agent") : denied.includes("Agent"));
  if (READ_ONLY.has(id)) {
    const canWrite = fields.tools
      ? WRITE_TOOLS.some((t) => tools.includes(t) && !denied.includes(t))
      : WRITE_TOOLS.some((t) => !denied.includes(t));
    check(`agent ${id}: is read-only`, !canWrite);
  }
}

const skillDir = path.join(GLOBAL, "skills");
for (const dir of fs.readdirSync(skillDir)) {
  const file = path.join(skillDir, dir, "SKILL.md");
  const def = fs.existsSync(file) ? parse(file) : null;
  if (!def) { check(`skill ${dir}: has SKILL.md with frontmatter`, false); continue; }
  check(`skill ${dir}: name matches folder`, def.fields.name === dir);
  check(`skill ${dir}: has description and body`, Boolean(def.fields.description) && def.body.length > 0);
  check(`skill ${dir}: no unquoted ": " in values`, def.unsafe.length === 0);
}

console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
