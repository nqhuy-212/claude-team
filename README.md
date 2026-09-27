# claude-team

Đội ngũ Claude Code dùng chung cho mọi dự án (luật, agent, skill, hook). Đây là nguồn gốc duy nhất, đồng bộ giữa các máy. **Không sửa trực tiếp trong `~/.claude`**, hãy sửa ở repo này rồi cài lại.

## Cài lên một máy
```
git clone <repo-url> && cd claude-team
node install.mjs
```
Sau đó khởi động lại Claude Code. Yêu cầu: Node.js ≥ 18.

Script sẽ:
- Chép `global/CLAUDE.md`, `hooks/`, `agents/`, `skills/` vào `~/.claude`.
- Merge `global/settings.json` vào `~/.claude/settings.json` (giữ các thiết lập sẵn có, tạo file `.bak` trước khi ghi).

## Thành phần
| File | Vai trò |
|---|---|
| `global/CLAUDE.md` | Luật chung: phạm vi sửa, quy trình task, stack mặc định, bảo mật |
| `global/settings.json` | Chặn lệnh nguy hiểm (force push, reset --hard, rm -rf) + đăng ký hook |
| `global/hooks/protect-files.mjs` | Chặn đọc file bí mật và chặn sửa vùng được bảo vệ |

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
