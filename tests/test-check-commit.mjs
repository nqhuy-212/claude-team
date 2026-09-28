// Usage: node tests/test-check-commit.mjs
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "global", "hooks", "check-commit.mjs");
// Secret-looking values are assembled at runtime so this file itself passes the commit check.
const ANTHROPIC_KEY = ["sk", "ant", "api03", "a".repeat(40)].join("-");
const AWS_KEY = "AKIA" + "ABCDEFGHIJKLMNOP";
const PRIVATE_KEY = "-----BEGIN " + "RSA PRIVATE KEY-----";
const PASSWORD = "Hunter2" + "Hunter2";
const USER_ENV = { ...process.env };
delete USER_ENV.CLAUDECODE;
const CLAUDE_ENV = { ...process.env, CLAUDECODE: "1" };
const temps = [];

function git(dir, ...args) {
  const r = spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args],
    { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
}

function write(dir, files) {
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  }
}

function stage(dir, files) {
  write(dir, files);
  git(dir, "add", "--", ...Object.keys(files));
}

function repo(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "commit-test-"));
  temps.push(dir);
  git(dir, "init", "-q");
  stage(dir, files);
  return dir;
}

function committed(files) {
  const dir = repo(files);
  git(dir, "commit", "--no-verify", "-qm", "base");
  return dir;
}

const runGitHook = (dir, env = USER_ENV) => spawnSync("node", [HOOK, "--git"], { cwd: dir, env, encoding: "utf8" });
const runClaude = (cwd, command, tool = "Bash") => spawnSync("node", [HOOK],
  { input: JSON.stringify({ tool_name: tool, tool_input: { command }, cwd }), env: CLAUDE_ENV, encoding: "utf8" });

let failed = 0;
function assert(label, ok, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : "\n" + detail}`);
}
const check = (label, result, expected) =>
  assert(`${label}  -> exit ${result.status}`, result.status === expected, result.stderr);

console.log("== git pre-commit (your own commits)");
check("clean code", runGitHook(repo({ "src/app.py": "print('hi')\n" })), 0);
check(".env", runGitHook(repo({ ".env": "X=1\n" })), 1);
check(".env.example", runGitHook(repo({ ".env.example": "# X=\n" })), 0);
check("nested .env.production", runGitHook(repo({ "config/.env.production": "X=1\n" })), 1);
check("key file", runGitHook(repo({ "certs/server.key": "k\n" })), 1);
check("real data .xlsx", runGitHook(repo({ "data/sales.xlsx": "fake" })), 1);
check("fake data in tests/fixtures", runGitHook(repo({ "tests/fixtures/sample.csv": "a,b\n1,2\n" })), 0);
check("file > 5 MB", runGitHook(repo({ "assets/big.bin": Buffer.alloc(6 * 1024 * 1024) })), 1);
const keyResult = runGitHook(repo({ "src/llm.py": `KEY = "${ANTHROPIC_KEY}"\n` }));
check("Anthropic key in code", keyResult, 1);
assert("report does not echo the secret", !keyResult.stderr.includes(ANTHROPIC_KEY), keyResult.stderr);
check("AWS key", runGitHook(repo({ "deploy.sh": `export K=${AWS_KEY}\n` })), 1);
check("private key block", runGitHook(repo({ "notes.txt": `${PRIVATE_KEY}\nabc\n` })), 1);
check("password in connection string", runGitHook(repo({ "src/db.py": `CONN = "Server=db;UID=app;PWD=${PASSWORD};"\n` })), 1);
check("connection string placeholder", runGitHook(repo({ "src/db.py": 'CONN = f"Server=db;UID=app;PWD={password};"\n' })), 0);
check("password passed as variable", runGitHook(repo({ "src/db.py": "engine = connect(password=db_password)\n" })), 0);
check("hard-coded password", runGitHook(repo({ "src/settings.py": `DB_PASSWORD = "${PASSWORD}"\n` })), 1);
check("env var name is not a password", runGitHook(repo({ "src/settings.py": 'PASSWORD_ENV = "DB_PASSWORD"\n' })), 0);
check("fake password in a test file", runGitHook(repo({ "src/test_settings.py": `DB_PASSWORD = "${PASSWORD}"\n` })), 0);

const legacy = committed({ "src/legacy.py": `DB_PASSWORD = "${PASSWORD}"\n` });
stage(legacy, { "src/legacy.py": `DB_PASSWORD = "${PASSWORD}"\nx = 1\n` });
check("only newly added lines are scanned", runGitHook(legacy), 0);

const removal = committed({ ".env": "X=1\n" });
git(removal, "rm", "--cached", "-q", ".env");
check("removing a tracked .env is allowed", runGitHook(removal), 0);

const locked = committed({ ".claude/protected": "src/payroll/\n" });
stage(locked, { "src/payroll/calc.py": "x = 1\n" });
check("protected path, your commit", runGitHook(locked, USER_ENV), 0);
check("protected path, Claude's commit", runGitHook(locked, CLAUDE_ENV), 1);

console.log("\n== Claude Code hook (Claude's git commands)");
const clean = repo({ "src/app.py": "print('hi')\n" });
const leaky = repo({ ".env": "X=1\n" });
check("non-git command", runClaude(clean, "ls -la"), 0);
check("git status", runClaude(clean, "git status"), 0);
check("clean commit", runClaude(clean, 'git commit -m "add app"'), 0);
check("--no-verify", runClaude(clean, 'git commit --no-verify -m "x"'), 2);
check("-n inside short flags", runClaude(clean, 'git commit -nm "x"'), 2);
check("--no-verify only inside the message", runClaude(clean, 'git commit -m "explain --no-verify rule"'), 0);
check("--no-verify only inside a heredoc", runClaude(clean, "git commit -F - <<'EOF'\nexplain --no-verify rule\nEOF"), 0);
check("override core.hooksPath with -c", runClaude(clean, "git -c core.hooksPath=/dev/null commit -m x"), 2);
check("set core.hooksPath", runClaude(clean, "git config --global core.hooksPath /tmp/none"), 2);
check("read core.hooksPath", runClaude(clean, "git config --get core.hooksPath"), 0);
check(".env staged", runClaude(leaky, 'git commit -m "x"'), 2);
check("chained add && commit", runClaude(leaky, 'git add . && git commit -m "x"'), 2);
check("git -C another repo", runClaude(os.tmpdir(), `git -C "${leaky}" commit -m x`), 2);
check("PowerShell tool", runClaude(clean, 'git commit --no-verify -m "x"', "PowerShell"), 2);
check("protected path", runClaude(locked, 'git commit -m "x"'), 2);

const tracked = committed({ "src/app.py": "x = 1\n" });
write(tracked, { "src/app.py": `x = 1\nKEY = "${ANTHROPIC_KEY}"\n` });
check("commit -a includes unstaged tracked change", runClaude(tracked, 'git commit -am "x"'), 2);
check("same change unstaged, plain commit", runClaude(tracked, 'git commit -m "x"'), 0);

for (const dir of temps) fs.rmSync(dir, { recursive: true, force: true });
console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
