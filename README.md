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

## Thành phần
| File | Vai trò |
|---|---|
| `global/CLAUDE.md` | Luật chung: phạm vi sửa, quy trình task, stack mặc định, bảo mật |
| `global/settings.json` | Chặn lệnh nguy hiểm (force push, reset --hard, rm -rf) + đăng ký hook |
| `global/hooks/protect-files.mjs` | Chặn đọc file bí mật và chặn sửa vùng được bảo vệ |
| `global/templates/project/` | Khung dự án: CLAUDE.md, docs/CODEMAP, DECISIONS, PROGRESS, .gitignore chặn secret và dữ liệu thật |
| `global/templates/scaffold.mjs` | Chép khung vào một thư mục, không ghi đè file đã có |
| `global/skills/` | Skill `/new-project`, `/onboard`, `/handoff` |

## Skill
| Lệnh | Khi nào dùng |
|---|---|
| `/new-project [tên] [mô tả]` | Thư mục trống → dự án có git, tài liệu khung, khung Python (venv + pip) |
| `/onboard [ghi chú]` | Dự án có sẵn code → sinh tài liệu và danh sách vấn đề, không sửa code |
| `/handoff [ghi chú]` | Cuối phiên → cập nhật `docs/PROGRESS.md`, commit, push để máy khác làm tiếp |

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

## Kiểm thử
```
node tests/test-protect-files.mjs
node tests/test-scaffold.mjs
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
Hook chỉ chặn được các tool Read/Edit/Write của Claude. Một lệnh shell (Bash/PowerShell) vẫn có thể ghi file về mặt kỹ thuật. Lớp chặn này do luật trong CLAUDE.md đảm nhận, còn lưới an toàn cuối cùng là git.
