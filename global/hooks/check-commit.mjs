// Blocks commits that would leak secrets or real data, and Claude's commits that touch protected paths.
// Claude Code PreToolUse hook (Bash/PowerShell): reads the tool call on stdin; exit 2 = block.
// Git pre-commit hook: `node check-commit.mjs --git`; exit 1 = block.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { SECRET_FILES, matches, readProjectPatterns } from "./lib/patterns.mjs";

const DATA_FILES = ["*.xlsx", "*.xlsm", "*.xls", "*.csv", "*.parquet", "!tests/fixtures/**"];
const MAX_FILE_MB = 5;
const MAX_REPORTED = 20;
const KEY_PATTERNS = [
  [/sk-ant-[A-Za-z0-9_-]{20,}/, "Anthropic API key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, "GitHub token"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
];
// Credentials written as literals. Skipped in tests and docs, where fake values are expected.
const CONNECTION_PASSWORD = /[;"']\s*(?:PWD|Password)\s*=\s*(?!["'{$<])([^;"'\s{}]{4,})/i;
const ASSIGNMENT = /\b\w*(?:password|passwd|pwd|secret|api_?key)\w*["']?\s*[:=]\s*["']([^"'\s]{8,})["']/i;
const PLACEHOLDER = /^(?:your|my|example|changeme|placeholder|dummy|fake|xxx|\*|<|\$\{)/i;
const CREDENTIAL_EXEMPT = ["**/tests/**", "test_*.py", "*_test.py", "conftest.py", "*.md", ".env.example"];

function git(cwd, args) {
  const r = spawnSync("git", ["-c", "core.quotePath=false", ...args], { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.error || r.status !== 0) throw new Error((r.stderr || String(r.error)).trim());
  return r.stdout;
}

function topLevel(dir) {
  try {
    return git(dir, ["rev-parse", "--show-toplevel"]).trim();
  } catch {
    return null;
  }
}

function changedFiles(root, staged) {
  const args = ["diff", ...(staged ? ["--cached"] : []), "--name-only", "--diff-filter=ACMR", "-z"];
  return git(root, args).split("\0").filter(Boolean);
}

function addedLines(root, staged) {
  const args = ["diff", ...(staged ? ["--cached"] : []), "-U0", "--no-color", "--no-ext-diff", "--no-textconv",
    "--src-prefix=a/", "--dst-prefix=b/", "--diff-filter=ACMR"];
  const lines = [];
  let file = null;
  let lineNo = 0;
  let inHeader = false;
  for (const line of git(root, args).split("\n")) {
    if (line.startsWith("diff --git ")) { inHeader = true; file = null; continue; }
    if (inHeader && line.startsWith("+++ ")) { file = line.startsWith("+++ b/") ? line.slice(6) : null; continue; }
    if (line.startsWith("@@")) { inHeader = false; lineNo = Number(line.match(/\+(\d+)/)?.[1] ?? 0); continue; }
    if (!inHeader && file && line.startsWith("+")) lines.push({ file, lineNo: lineNo++, text: line.slice(1) });
  }
  return lines;
}

function fileSize(file) {
  try {
    return fs.statSync(file).size;
  } catch {
    return 0;
  }
}

function findSecret(file, text) {
  for (const [re, label] of KEY_PATTERNS) if (re.test(text)) return label;
  if (matches(file, CREDENTIAL_EXEMPT)) return null;
  const conn = text.match(CONNECTION_PASSWORD);
  if (conn && !PLACEHOLDER.test(conn[1])) return "mật khẩu trong chuỗi kết nối";
  const value = text.match(ASSIGNMENT)?.[1];
  if (value && /\d/.test(value) && /[a-z]/i.test(value) && !PLACEHOLDER.test(value)) return "mật khẩu hoặc khóa viết thẳng trong code";
  return null;
}

function findProblems(root, { includeUnstaged, checkProtected }) {
  const problems = new Set();
  const files = new Set(changedFiles(root, true));
  if (includeUnstaged) for (const f of changedFiles(root, false)) files.add(f);
  const locked = checkProtected ? readProjectPatterns(root) : [];
  for (const file of files) {
    const secret = matches(path.posix.basename(file), SECRET_FILES);
    if (secret) problems.add(`${file}: file bí mật (${secret})`);
    const data = matches(file, DATA_FILES);
    if (data) problems.add(`${file}: file dữ liệu (${data}); dữ liệu mẫu giả thì đặt trong tests/fixtures/`);
    const size = fileSize(path.join(root, file));
    if (size > MAX_FILE_MB * 1024 * 1024) problems.add(`${file}: file lớn ${(size / 1048576).toFixed(1)} MB (> ${MAX_FILE_MB} MB)`);
    const rule = locked.length ? matches(file, locked) : null;
    if (rule) problems.add(`${file}: thuộc vùng khóa .claude/protected (luật: ${rule})`);
  }
  const lines = addedLines(root, true);
  if (includeUnstaged) lines.push(...addedLines(root, false));
  for (const { file, lineNo, text } of lines) {
    const label = findSecret(file, text);
    if (label) problems.add(`${file}:${lineNo}: ${label}`);
  }
  return [...problems];
}

function report(problems, byClaude) {
  const shown = problems.slice(0, MAX_REPORTED).map((p) => `  - ${p}`);
  if (problems.length > MAX_REPORTED) shown.push(`  ... và ${problems.length - MAX_REPORTED} vấn đề khác`);
  const advice = byClaude
    ? "Bỏ file khỏi stage (git restore --staged <file>), chuyển secret sang biến môi trường. File thuộc vùng khóa hoặc báo nhầm: báo người dùng, không tìm cách lách."
    : "Bỏ file khỏi stage: git restore --staged <file>. Nếu đây là báo nhầm, commit lại với: git commit --no-verify";
  return `BLOCKED (claude-team): commit có vấn đề an toàn:\n${shown.join("\n")}\n${advice}\n`;
}

// Splits a shell command into segments of tokens; quoted text keeps its content but is marked as quoted.
function tokenize(command) {
  const text = command
    .replace(/<<-?\s*(['"]?)(\w+)\1[\s\S]*?\n\s*\2\s*(?=\n|$)/g, " ")
    .replace(/@(['"])[\s\S]*?\n\1@/g, " ");
  const segments = [[]];
  let token = null;
  const flush = () => { if (token) segments[segments.length - 1].push(token); token = null; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'" || c === '"') {
      let end = i + 1;
      while (end < text.length && text[end] !== c) end += c === '"' && text[end] === "\\" ? 2 : 1;
      token ??= { text: "", quoted: false };
      token.text += text.slice(i + 1, end);
      token.quoted = true;
      i = end;
    } else if (c === "\n" || c === ";" || c === "|" || c === "&") {
      flush();
      segments.push([]);
    } else if (/\s/.test(c)) {
      flush();
    } else {
      token ??= { text: "", quoted: false };
      token.text += c;
    }
  }
  flush();
  return segments.filter((s) => s.length);
}

function gitCalls(command) {
  const calls = [];
  for (const tokens of tokenize(command)) {
    const at = tokens.findIndex((t) => /(^|[\\/])git(\.exe)?$/i.test(t.text));
    if (at < 0) continue;
    const call = { dir: null, config: [], sub: null, args: [] };
    let i = at + 1;
    for (; i < tokens.length && tokens[i].text.startsWith("-"); i++) {
      if (tokens[i].text === "-C") call.dir = tokens[++i]?.text ?? null;
      else if (tokens[i].text === "-c") call.config.push(tokens[++i]?.text ?? "");
    }
    call.sub = tokens[i]?.text ?? null;
    call.args = tokens.slice(i + 1);
    calls.push(call);
  }
  return calls;
}

function block(reason) {
  process.stderr.write(reason);
  process.exit(2);
}

function checkClaudeCommand(input) {
  const command = input.tool_input?.command ?? "";
  if (!/\bgit\b/i.test(command)) return;
  const baseDir = path.resolve(input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
  const bypass = "BLOCKED (claude-team): không được bỏ qua kiểm tra an toàn của git (--no-verify, -n, core.hooksPath). Nếu hook báo nhầm, hãy báo người dùng; chỉ người dùng được tự commit bỏ qua kiểm tra.\n";
  for (const call of gitCalls(command)) {
    if (call.config.some((c) => c.toLowerCase().startsWith("core.hookspath"))) block(bypass);
    const words = call.args.map((a) => a.text.toLowerCase());
    if (call.sub === "config" && words.includes("core.hookspath")
      && !words.some((w) => ["--get", "--get-all", "--list", "-l"].includes(w))) block(bypass);
    if (call.sub !== "commit") continue;
    const flags = call.args.filter((a) => !a.quoted).map((a) => a.text);
    if (flags.some((f) => /^--no-v/.test(f) || /^-[a-zA-Z]*n[a-zA-Z]*$/.test(f))) block(bypass);
    const root = topLevel(call.dir ? path.resolve(baseDir, call.dir) : baseDir);
    if (!root) continue;
    const includeUnstaged = flags.some((f) => f === "--all" || /^-[a-zA-Z]*a[a-zA-Z]*$/.test(f));
    const problems = findProblems(root, { includeUnstaged, checkProtected: true });
    if (problems.length) block(report(problems, true));
  }
}

function checkGitCommit() {
  const root = topLevel(process.cwd());
  if (!root) return 0;
  const byClaude = process.env.CLAUDECODE === "1";
  const problems = findProblems(root, { includeUnstaged: false, checkProtected: byClaude });
  if (!problems.length) return 0;
  process.stderr.write(report(problems, byClaude));
  return 1;
}

try {
  if (process.argv.includes("--git")) process.exit(checkGitCommit());
  const input = JSON.parse(fs.readFileSync(0, "utf8"));
  if (input.tool_name === "Bash" || input.tool_name === "PowerShell") checkClaudeCommand(input);
  process.exit(0);
} catch (err) {
  process.stderr.write(`claude-team check-commit: lỗi nội bộ, bỏ qua kiểm tra (${err.message})\n`);
  process.exit(0);
}
