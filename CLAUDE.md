# claude-team

Repo này định nghĩa đội ngũ Claude Code dùng chung cho mọi dự án. Nó không phải một ứng dụng.

- Đầu phiên: đọc `docs/PROGRESS.md` (đang ở đâu, làm gì tiếp), rồi mới đọc `docs/ROADMAP.md` khi cần chi tiết.
- `global/` là nội dung được cài vào `~/.claude` bằng `node install.mjs`. Sửa ở đây, không sửa trực tiếp `~/.claude`.
- Sửa hook thì phải chạy `node tests/test-protect-files.mjs` trước khi cài lại.
- Hook phải chạy được chỉ với Node.js, không cần thư viện ngoài.
