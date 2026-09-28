# claude-team

Đội ngũ Claude Code dùng chung cho mọi dự án (luật, agent, skill, hook). Đây là nguồn gốc duy nhất, đồng bộ giữa các máy. **Không sửa trực tiếp trong `~/.claude`**, hãy sửa ở repo này rồi cài lại.

## Cài lên một máy
```
git clone <repo-url> && cd claude-team
node install.mjs
```
Sau đó khởi động lại Claude Code. Yêu cầu: Node.js ≥ 18.

Script sẽ:
- Chép `global/CLAUDE.md`, `hooks/`, `agents/`, `skills/`, `templates/` vào `~/.claude`.
- Merge `global/settings.json` vào `~/.claude/settings.json` (giữ các thiết lập sẵn có, tạo file `.bak` trước khi ghi).
- Cài git hook vào `~/.claude/git-hooks` và đặt `git config --global core.hooksPath` trỏ vào đó (không ghi đè nếu máy đã có giá trị khác).

## Thành phần
| File | Vai trò |
|---|---|
| `global/CLAUDE.md` | Luật chung: phạm vi sửa, quy trình task, stack mặc định, bảo mật |
| `global/settings.json` | Chặn lệnh nguy hiểm (force push, reset --hard, rm -rf) + đăng ký hook |
| `global/hooks/protect-files.mjs` | Chặn đọc file bí mật và chặn sửa vùng được bảo vệ |
| `global/hooks/check-commit.mjs` | Chặn commit lộ secret, dữ liệu thật, file lớn; chặn Claude commit vùng khóa hoặc lách hook |
| `global/git-hooks/` | Git hook toàn máy: `pre-commit` gọi check-commit; `passthrough` chuyển tiếp các hook khác về hook riêng của repo và Git LFS |
| `global/templates/project/` | Khung dự án: CLAUDE.md, docs/CODEMAP, DECISIONS, PROGRESS, .gitignore chặn secret và dữ liệu thật |
| `global/templates/scaffold.mjs` | Chép khung vào một thư mục, không ghi đè file đã có |
| `global/skills/` | Skill `/new-project`, `/onboard`, `/kickoff`, `/handoff` |
| `global/agents/` | 5 agent lõi: architect, reviewer, tester, ui-builder, scout |

## Skill
| Lệnh | Khi nào dùng |
|---|---|
| `/new-project [tên] [mô tả]` | Thư mục trống → dự án có git, tài liệu khung, khung Python (venv + pip) |
| `/onboard [ghi chú]` | Dự án có sẵn code → sinh tài liệu và danh sách vấn đề, không sửa code |
| `/kickoff [mô tả]` | Dự án mới hoặc mục tiêu lớn → architect thiết kế, chia task; duyệt xong ghi vào PROGRESS, DECISIONS |
| `/handoff [ghi chú]` | Cuối phiên → cập nhật `docs/PROGRESS.md`, commit, push để máy khác làm tiếp |

Quy trình dự án mới: `/new-project` → `/kickoff` → làm từng task (mỗi task một commit) → `/handoff` cuối phiên.

## Đội agent
Phiên chính đóng vai PM: tự viết code backend/logic, giao việc cho agent khi đúng vai (chi tiết: mục 8 của `global/CLAUDE.md`). Đội giữ một tầng: không agent nào được gọi agent khác.

| Agent | Model | Quyền |
|---|---|---|
| `architect` | opus | Chỉ đọc (Read, Grep, Glob) |
| `reviewer` | opus | Chỉ đọc + shell để xem diff, chạy test |
| `tester` | sonnet | Sửa được file; theo luật chỉ sửa file test |
| `ui-builder` | sonnet | Sửa được file; làm giao diện Streamlit |
| `scout` | haiku | Chỉ đọc (Read, Grep, Glob) |

Gọi thẳng một agent: gõ `@` rồi chọn agent, hoặc nói "dùng scout tìm ...".

## Máy không vào được PyPI (cài thư viện offline)
Hai máy dùng cùng Python 3.13 (Windows x64). Máy vào được PyPI (máy nhà) tạo file wheel vào thư mục OneDrive; máy bị chặn (máy công ty) cài từ thư mục đó.

Làm một lần trên máy bị chặn: tạo `%APPDATA%\pip\pip.ini`
```
[global]
no-index = true
find-links = C:\Users\<user>\OneDrive\wheelhouse
```
Mỗi lần dự án thêm hoặc đổi thư viện, ở máy nhà, trong thư mục dự án (PowerShell):
```
py -3.13 -m pip wheel -r requirements-dev.txt -w "$env:OneDrive\wheelhouse"
```
Chờ OneDrive đồng bộ xong, ở máy công ty chạy `pip install -r requirements-dev.txt` như bình thường. Dùng `pip wheel` thay cho `pip download` vì nó tự build wheel cho những gói chỉ phát hành mã nguồn.

## Kiểm tra an toàn trước khi commit
Mọi commit trên máy (của Claude và của bạn, kể cả nút Commit trong VS Code) đi qua `check-commit.mjs`. Commit bị chặn khi phần được stage có:
- File bí mật: `.env*` (trừ `.env.example`), `*.pem`, `*.key`, `*.pfx`.
- File dữ liệu: `*.xlsx`, `*.xls`, `*.xlsm`, `*.csv`, `*.parquet` (trừ dữ liệu mẫu giả trong `tests/fixtures/`).
- File lớn hơn 5 MB.
- Dòng mới thêm chứa API key (Anthropic, AWS, GitHub), private key, mật khẩu trong chuỗi kết nối, hoặc mật khẩu gán thẳng trong code. Hai loại sau bỏ qua file test và file `.md`. Chỉ quét dòng mới thêm, nên code cũ không làm kẹt mọi commit.

Riêng commit do Claude chạy còn bị chặn nếu chạm vùng khóa (`.claude/protected`), hoặc nếu Claude dùng `--no-verify`, `-n`, hay đổi `core.hooksPath`.

- Báo nhầm: bạn tự commit bằng `git commit --no-verify`. Claude không được dùng cách này.
- Gỡ lớp git hook: `git config --global --unset core.hooksPath`.
- Giới hạn: repo tự đặt `core.hooksPath` riêng (vd husky) thì chỉ còn lớp kiểm tra lệnh của Claude. Hook `reference-transaction`, `post-index-change` và các hook phía server không được chuyển tiếp. Mỗi commit chậm thêm khoảng 1 giây.

## Kiểm thử
```
node tests/test-protect-files.mjs
node tests/test-scaffold.mjs
node tests/test-definitions.mjs
node tests/test-check-commit.mjs
```

## Khóa file trong một dự án
Tạo file `.claude/protected` ở gốc dự án, mỗi dòng một pattern (cú pháp giống `.gitignore`, dòng bắt đầu `!` là ngoại lệ):
```
# code đang chạy ổn, không động vào
src/payroll/
migrations/**
config.py
```
Luôn được khóa sẵn: `.env*` (trừ `.env.example`), `*.pem`, `*.key`, file cấu hình của Claude trong `~/.claude` và `.claude/` của dự án.

## Giới hạn cần biết
Hook `protect-files` chỉ chặn được các tool Read/Edit/Write của Claude. Một lệnh shell (Bash/PowerShell) vẫn có thể ghi file về mặt kỹ thuật. Lớp chặn này do luật trong CLAUDE.md đảm nhận; nếu vẫn lọt, `check-commit` chặn Claude commit thay đổi đó, và lưới an toàn cuối cùng là git.

Các mẫu secret là luật cố định nên có thể sót hoặc báo nhầm. Phần cần phán đoán vẫn do agent `reviewer` đảm nhận.
