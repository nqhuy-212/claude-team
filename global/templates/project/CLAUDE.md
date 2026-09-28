# {{PROJECT_NAME}}

<!-- Luật chung nằm ở ~/.claude/CLAUDE.md. File này chỉ ghi phần riêng của dự án, giữ dưới 80 dòng. -->

## Mục tiêu
- (1–3 dòng: dự án làm gì, ai dùng)

## Stack
- Theo stack mặc định. Chỗ nào khác thì ghi ở đây, kèm mã quyết định trong `docs/DECISIONS.md`.

## Lệnh thường dùng
- Tạo môi trường: `py -3.13 -m venv .venv`
- Cài thư viện: `.venv/Scripts/python -m pip install -r requirements-dev.txt`
- Test: `.venv/Scripts/python -m pytest`
- Lint + format: `.venv/Scripts/python -m ruff check . --fix` rồi `.venv/Scripts/python -m ruff format .`
- Chạy app: (điền, vd `.venv/Scripts/python -m streamlit run src/app.py` hoặc `.venv/Scripts/python -m fastapi dev src/main.py`)
- Trên Linux/macOS thay `.venv/Scripts/` bằng `.venv/bin/`.

## Tài liệu
- `docs/PROGRESS.md`: đang làm gì, việc tiếp theo. Đọc đầu phiên; cuối phiên chạy `/handoff`.
- `docs/CODEMAP.md`: tính năng nằm ở file nào. Đọc trước khi tìm code.
- `docs/DECISIONS.md`: các quyết định kiến trúc.
- `.claude/protected`: vùng cấm sửa. Chỉ người dùng sửa file này.

## Lưu ý riêng
- (quy ước, cạm bẫy, dữ liệu nhạy cảm, hệ thống bên ngoài...)
