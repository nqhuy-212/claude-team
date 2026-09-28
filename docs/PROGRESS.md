# Tiến độ

Cập nhật: 2026-09-28

## Đang làm
- **Giai đoạn 1 – Khung dự án**: đã viết xong, test đạt (hook 19/19, scaffold 18/18), đã cài trên máy công ty. Còn thiếu: thử thật `/new-project` và `/handoff`.
  - `global/templates/project/`: CLAUDE.md dự án, docs/CODEMAP, DECISIONS, PROGRESS, `.gitignore` (chặn `.env`, `*.xlsx`, `*.csv`...), `.gitattributes`, `.env.example`, `.claude/protected`.
  - `global/templates/scaffold.mjs`: chép template, không ghi đè file có sẵn; chỉ thêm dòng thiếu vào `.gitignore`/`.gitattributes`. Test: `tests/test-scaffold.mjs`.
  - Skill `/new-project`, `/onboard`, `/handoff` trong `global/skills/`.
  - Hook khóa thêm `~/.claude/templates/**` (thêm 1 case test, tổng 19); `install.mjs` chép thêm `templates/`.

## Đã xong
- **Giai đoạn 0 – Nền móng**: luật chung, hook `protect-files.mjs`, chặn lệnh nguy hiểm, `install.mjs`. Đã cài và kiểm chứng trên máy nhà.
- Đổi tên `claude-config` → `claude-team`, push lên GitHub `nqhuy-212/claude-team`.

## Quyết định đã chốt (chi tiết: ROADMAP.md)
- Phiên chính = PM; bắt đầu 5 agent lõi (architect, reviewer, tester, ui-builder, scout).
- Stack Python-centric (Python 3.13 + venv/pip, FastAPI, SQLAlchemy, Streamlit). Bỏ uv từ 2026-09-28 (máy công ty không vào được PyPI).
- Dữ liệu: SQL Server + Excel/Sheets + ERP → ETL vào schema `analytics`.
- Repo tách riêng: `claude-team`, `company-knowledge`, từng dự án (DataHub = chatbot/dữ liệu).

## Việc tiếp theo
1. Kiểm chứng Giai đoạn 1: tạo 1 dự án nhỏ bằng `/new-project`, sửa 1 tính năng chỉ dựa vào CODEMAP; thử `/handoff`.
2. Máy nhà: cài Python 3.13 (đang là 3.9), đăng nhập OneDrive cùng tài khoản, `git pull` → chạy 2 test → `node install.mjs`.
3. Kiểm tra OneDrive đồng bộ giữa hai máy (file thử trong `OneDrive\wheelhouse`); tạo wheel cho dự án đầu tiên ở máy nhà.
4. Sau đó: **Giai đoạn 2** – 5 agent lõi + skill `/kickoff`.

## Lưu ý
- Hook không chặn được lệnh shell; lưới an toàn cuối là git.
- Không sửa trực tiếp `~/.claude`; sửa trong repo này rồi chạy lại `node install.mjs`.
- Máy công ty dùng Node bản portable `D:\2025 nqhuy\Setup\node-v24.11.0-win-x64` (đã thêm vào User PATH). Hook cần `node` trong PATH; thiếu thì hook lỗi và **không chặn gì**.
- Mạng máy công ty: tường lửa `ngfw.crystal-regent.com.vn` ký lại chứng chỉ HTTPS; **`pypi.org` bị chặn hẳn**. GitHub vẫn vào được (git push OK); `curl` cần `--ssl-no-revoke`. Máy công ty cài thư viện offline từ `OneDrive\wheelhouse` qua `%APPDATA%\pip\pip.ini` (xem README).
