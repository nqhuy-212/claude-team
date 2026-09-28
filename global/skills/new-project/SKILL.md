---
name: new-project
description: Tạo khung dự án mới theo chuẩn claude-team (CLAUDE.md dự án, docs/CODEMAP.md, DECISIONS.md, PROGRESS.md, .gitignore chặn secret và dữ liệu thật, khung Python bằng venv + pip). Dùng khi bắt đầu một dự án mới trong thư mục trống.
argument-hint: "[tên dự án] [mô tả ngắn]"
disable-model-invocation: true
---

# /new-project

Mục tiêu: sau khi chạy xong, thư mục hiện tại là một dự án có git và đủ tài liệu khung. Một phiên Claude mới chỉ cần đọc `CLAUDE.md` và `docs/PROGRESS.md` là biết phải làm gì.

Đầu vào từ người dùng: $ARGUMENTS

## Bước 1 – Kiểm tra thư mục
- Liệt kê thư mục hiện tại. Đã có code (ngoài `.git`, `README.md`, `.gitignore`, `LICENSE`) → dừng, đề xuất dùng `/onboard`.
- Chưa phải git repo → `git init`. Là repo mà `git status` không sạch → hỏi người dùng trước khi làm tiếp.

## Bước 2 – Hỏi cho đủ thông tin (gộp thành một lần hỏi)
Chỉ hỏi những gì đầu vào chưa có:
1. Tên dự án (mặc định: tên thư mục).
2. Mục tiêu 1–3 câu: làm gì, ai dùng.
3. Loại: `streamlit` (công cụ nội bộ), `api` (FastAPI), `etl` (job/script dữ liệu), `lib` (thư viện), hoặc `khác` (không dùng Python).
4. Có dùng dữ liệu công ty không, nguồn nào (SQL Server, Excel, ERP...)?

## Bước 3 – Chép template
Lệnh chạy được cả trong bash lẫn PowerShell:
```
node "$HOME/.claude/templates/scaffold.mjs" . --name "<Tên dự án>"
```
Script không ghi đè file đã có. Nó tạo `CLAUDE.md`, `docs/`, `.gitignore`, `.gitattributes`, `.env.example`, `.claude/protected`. File `.claude/protected` chỉ được tạo qua script này; sau đó chỉ người dùng được sửa.

## Bước 4 – Khung Python (bỏ qua nếu loại là `khác`)
1. Chạy `py -3.13 --version`. Không có Python 3.13 → bỏ qua bước này và ghi "Cài Python 3.13 rồi làm lại Bước 4 của /new-project" vào "Việc tiếp theo" trong `docs/PROGRESS.md`.
2. `py -3.13 -m venv .venv`
3. Tạo `requirements.txt` theo loại: `streamlit` → `streamlit`; `api` → `fastapi[standard]`. Có dùng SQL Server → thêm `sqlalchemy` và `pyodbc`. Tạo `requirements-dev.txt` gồm `-r requirements.txt`, `pytest`, `ruff`. Gói ngoài danh sách này thì hỏi trước.
4. `.venv/Scripts/python -m pip install -r requirements-dev.txt` (Linux/macOS: `.venv/bin/python`). Lỗi mạng hoặc thiếu wheel (máy không vào được PyPI) → không tìm cách lách. Ghi vào "Việc tiếp theo" của `docs/PROGRESS.md`: ở máy nhà chạy `py -3.13 -m pip wheel -r requirements-dev.txt -w "$env:OneDrive\wheelhouse"` (PowerShell), chờ OneDrive đồng bộ, rồi làm lại Bước 4. Sau đó dừng Bước 4.
5. Cài xong → pin các gói trực tiếp trong hai file requirements bằng `==`, lấy phiên bản thật từ `.venv/Scripts/python -m pip freeze`.
6. Tạo `pyproject.toml` chỉ chứa cấu hình công cụ:
   ```toml
   [tool.pytest.ini_options]
   pythonpath = ["src"]
   testpaths = ["src"]

   [tool.ruff]
   target-version = "py313"
   ```
7. Kiểm chứng: `.venv/Scripts/python -m ruff check .` phải sạch. `.venv/Scripts/python -m pytest` báo "no tests ran" (exit 5) là bình thường khi chưa có test.

## Bước 5 – Điền tài liệu
- `CLAUDE.md`: điền Mục tiêu, lệnh chạy app theo loại, lưu ý về dữ liệu. Xóa các dòng hướng dẫn trong ngoặc không còn cần.
- `docs/CODEMAP.md`: ghi cấu trúc đang có. Không bịa file chưa tồn tại; xóa dòng ví dụ.
- `docs/PROGRESS.md`: "Việc tiếp theo" = 1–3 bước đầu tiên hợp lý cho mục tiêu dự án.
- `docs/DECISIONS.md`: giữ D-001. Loại `khác` hoặc stack khác mặc định → sửa D-001 cho đúng.

## Bước 6 – Báo cáo và commit
- Tóm tắt: file đã tạo, bước nào bị bỏ qua và vì sao, việc tiếp theo.
- `git status`: không được có file secret hay dữ liệu thật.
- Đề xuất commit `Scaffold project from claude-team template`. Chỉ commit khi người dùng đồng ý. Không push.
