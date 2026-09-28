# Tiến độ

Cập nhật: 2026-09-28

## Đang làm
- **Giai đoạn 1 – Khung dự án**: đã viết, test đạt, đã push (`6db01d6`). Template `global/templates/project/`, `scaffold.mjs`, skill `/new-project`, `/onboard`, `/handoff`. Chạy tay các bước `/new-project` trên máy công ty: OK. **Chưa kiểm chứng**: gõ thật `/new-project`, sửa 1 tính năng chỉ dựa vào CODEMAP, thử `/handoff`.
- **Giai đoạn 2 – Đội dev lõi**: đã viết, test đạt, đã cài trên máy công ty.
  - `global/agents/`: architect (opus, effort high), reviewer (opus, high), tester (sonnet, medium), ui-builder (sonnet, medium), scout (haiku). architect và scout chỉ có Read/Grep/Glob; reviewer bị cấm Edit/Write. Mọi agent bị chặn tool `Agent` (giữ đội một tầng); reviewer, tester, ui-builder bị chặn MCP.
  - Skill `/kickoff`; luật chung thêm mục 8 "Đội agent"; `/handoff` ghi "Nhận xét đội agent" vào PROGRESS của dự án.
  - `tests/test-definitions.mjs` kiểm frontmatter agent và skill (đã cố ý làm hỏng 4 chỗ, test bắt đủ).
  - **Chưa kiểm chứng**: chạy 1 dự án thật, ghi lại agent nào hữu ích, agent nào thừa.
- **Chặn commit không an toàn** (việc của ROADMAP 3c): `global/hooks/check-commit.mjs` + git hook toàn máy (`core.hooksPath` → `~/.claude/git-hooks`, có chuyển tiếp hook riêng của repo và Git LFS) + hook Claude Code cho lệnh git. Test `tests/test-check-commit.mjs` 41 case; đã thử thật trên máy công ty (chặn `.env`, hook riêng và LFS vẫn chạy). Hook Claude Code chỉ có hiệu lực sau khi khởi động lại Claude Code.

## Đã xong
- **Giai đoạn 0 – Nền móng**: luật chung, hook `protect-files.mjs`, chặn lệnh nguy hiểm, `install.mjs`. Đã cài và kiểm chứng trên máy nhà.
- Đổi tên `claude-config` → `claude-team`, push lên GitHub `nqhuy-212/claude-team`.

## Quyết định đã chốt (chi tiết: ROADMAP.md)
- Phiên chính = PM; bắt đầu 5 agent lõi (architect, reviewer, tester, ui-builder, scout).
- Stack Python-centric (Python 3.13 + venv/pip, FastAPI, SQLAlchemy, Streamlit). Bỏ uv từ 2026-09-28 (máy công ty không vào được PyPI).
- Dữ liệu: SQL Server + Excel/Sheets + ERP → ETL vào schema `analytics`.
- Repo tách riêng: `claude-team`, `company-knowledge`, từng dự án (DataHub = chatbot/dữ liệu).

## Việc tiếp theo
1. Máy nhà: cài Python 3.13 (đang là 3.9), đăng nhập OneDrive cùng tài khoản, `git pull` → chạy 4 test → `node install.mjs` (sẽ đặt `core.hooksPath` toàn máy).
2. Kiểm chứng Giai đoạn 1 và 2 cùng lúc trên một dự án nhỏ thật (nên ở máy nhà): `/new-project` → `/kickoff` → làm 1–2 task có `tester` và `reviewer` → sửa 1 tính năng chỉ dựa vào CODEMAP → `/handoff`. Ghi nhận xét đội agent.
3. Kiểm tra OneDrive đồng bộ giữa hai máy (file thử trong `OneDrive\wheelhouse`); tạo wheel cho dự án đầu tiên ở máy nhà.
4. Sau đó: **Giai đoạn 3a** (ETL vào schema `analytics`) và **3b** (kho tri thức `company-knowledge`), theo ROADMAP.

## Lưu ý
- Hook không chặn được lệnh shell; lưới an toàn cuối là git.
- Agent để trống `effort` sẽ kế thừa effort của phiên chính (đang xhigh), nên agent opus/sonnet luôn đặt `effort`. Agent liệt kê `tools` mà không tên nào khớp thì không khởi động được; muốn cấm tool thì dùng `disallowedTools`.
- Không sửa trực tiếp `~/.claude`; sửa trong repo này rồi chạy lại `node install.mjs`.
- Máy công ty dùng Node bản portable `D:\2025 nqhuy\Setup\node-v24.11.0-win-x64` (đã thêm vào User PATH). Hook cần `node` trong PATH; thiếu thì hook lỗi và **không chặn gì**.
- Mạng máy công ty: tường lửa `ngfw.crystal-regent.com.vn` ký lại chứng chỉ HTTPS; **`pypi.org` bị chặn hẳn**. GitHub vẫn vào được (git push OK); `curl` cần `--ssl-no-revoke`. Máy công ty cài thư viện offline từ `OneDrive\wheelhouse` qua `%APPDATA%\pip\pip.ini` (xem README).
