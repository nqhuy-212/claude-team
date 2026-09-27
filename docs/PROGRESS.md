# Tiến độ

Cập nhật: 2026-09-27

## Đã xong
- **Giai đoạn 0 – Nền móng**
  - `global/CLAUDE.md`: luật chung.
  - `protect-files.mjs`: hook chặn đọc secret và chặn sửa vùng bảo vệ (test 18/18).
  - `global/settings.json`: chặn lệnh nguy hiểm.
  - `install.mjs`: merge cấu hình vào `~/.claude`.
  - Đã cài trên máy nhà và kiểm chứng chặn thật.
- Đổi tên `claude-config` → `claude-team`, push lên GitHub `nqhuy-212/claude-team`.

## Quyết định đã chốt (chi tiết: ROADMAP.md)
- Phiên chính = PM; bắt đầu 5 agent lõi (architect, reviewer, tester, ui-builder, scout).
- Stack Python-centric (Python 3.12 + uv, FastAPI, SQLAlchemy, Streamlit).
- Dữ liệu: SQL Server + Excel/Sheets + ERP → ETL vào schema `analytics`.
- Repo tách riêng: `claude-team`, `company-knowledge`, từng dự án (DataHub = chatbot/dữ liệu).

## Việc tiếp theo
1. **Giai đoạn 1**: template dự án (CLAUDE.md dự án, docs/CODEMAP.md, DECISIONS.md, PROGRESS.md, .gitignore chặn `.env`/`*.xlsx`) + skill `/new-project`, `/onboard`, `/handoff`.
2. Cài Python 3.12 + `uv` (máy nhà đang có Python 3.9).
3. Máy công ty: clone repo → `node install.mjs`.

## Lưu ý
- Hook không chặn được lệnh shell; lưới an toàn cuối là git.
- Không sửa trực tiếp `~/.claude`; sửa trong repo này rồi chạy lại `node install.mjs`.
