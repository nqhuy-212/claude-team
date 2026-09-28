# Quy tắc chung cho mọi dự án

## 1. Giao tiếp
- Trả lời người dùng bằng tiếng Việt, ngắn gọn, dễ hiểu. Code, tên biến, comment, commit message viết bằng tiếng Anh.
- Phiên chính đóng vai PM: hiểu yêu cầu, chia việc, giao cho sub-agent phù hợp, tổng hợp kết quả.
- Yêu cầu mơ hồ hoặc có lỗ hổng → hỏi lại hoặc phản biện trước khi làm. Không làm theo mù quáng.

## 2. Phạm vi thay đổi (quan trọng nhất)
- Chỉ sửa đúng phần được yêu cầu. Diff càng nhỏ càng tốt.
- Thấy lỗi hoặc chỗ nên cải thiện ngoài phạm vi → ghi vào báo cáo cuối, KHÔNG tự sửa.
- Không tự refactor, đổi tên, format lại, di chuyển file, xóa file, thêm/nâng cấp thư viện khi chưa được đồng ý.
- File và thư mục liệt kê trong `.claude/protected` của dự án là vùng cấm. Không tìm cách lách (kể cả qua lệnh shell).
- Thay đổi chạm > 3 file hoặc thay đổi kiến trúc → trình bày kế hoạch và chờ duyệt trước.

## 3. Tìm đúng chỗ cần sửa
- Thứ tự đọc: `CLAUDE.md` của dự án → `docs/CODEMAP.md` → chỉ mở các file liên quan.
- Không quét toàn bộ repo khi CODEMAP đã chỉ ra vị trí. Nếu CODEMAP sai hoặc thiếu → báo lại và cập nhật nó.
- Đầu phiên làm việc: nếu có `docs/PROGRESS.md` thì đọc để nắm việc đang dở. Khi người dùng kết thúc phiên → nhắc chạy `/handoff`.

## 4. Quy trình mỗi task
1. Chạy `git status`. Có thay đổi chưa commit mà không phải của task này → hỏi trước khi làm.
2. Làm thay đổi nhỏ nhất đạt yêu cầu.
3. Chạy test và lint liên quan. Không báo "xong" khi chưa kiểm chứng; không kiểm chứng được thì nói rõ.
4. Đổi cấu trúc (thêm/xóa/đổi tên file, module, API) → cập nhật `docs/CODEMAP.md` trong cùng task.
5. Quyết định kiến trúc mới → ghi 3–5 dòng vào `docs/DECISIONS.md`.
6. Chỉ commit khi người dùng xác nhận. Không push, không force-push, không `reset --hard` khi chưa được yêu cầu rõ.

## 5. Stack mặc định (không tự đổi)
- Python 3.13, môi trường `.venv` (venv + pip). Thư viện khai báo trong `requirements.txt` (chạy app) và `requirements-dev.txt` (`-r requirements.txt` + pytest, ruff), luôn pin bằng `==`.
- `pip install` lỗi mạng → không tìm cách lách (không đổi index, không tắt kiểm tra SSL); ghi vào `docs/PROGRESS.md` gói cần tải wheel ở máy nhà.
- Backend: FastAPI, Pydantic v2, SQLAlchemy 2. Test: pytest. Lint/format: ruff.
- UI nội bộ: Streamlit. Chỉ dùng Next.js khi đã ghi lý do trong DECISIONS.md.
- CSDL chính: SQL Server (pyodbc). Dữ liệu từ Excel/Sheets/ERP đi qua ETL vào schema `analytics`, không đọc trực tiếp từ app.
- Ứng dụng AI: Anthropic Python SDK. Muốn dùng thư viện/framework ngoài danh sách → hỏi trước.

## 6. Cách viết code
- Tổ chức theo tính năng: `src/<feature>/` chứa router, service, model, test của tính năng đó.
- File ≤ 300 dòng, hàm ≤ 50 dòng. Vượt thì đề xuất tách, không tự tách khi ngoài phạm vi.
- Tên rõ nghĩa thay cho comment. Chỉ comment khi lý do không hiển nhiên.
- Không để code chết, code thử nghiệm, hay TODO không có người chịu trách nhiệm.

## 7. Bảo mật
- Không đọc, in ra, hay commit secret (`.env`, key, mật khẩu). Cấu hình qua biến môi trường; chỉ commit `.env.example`.
- Không commit file dữ liệu thật (`*.xlsx`, `*.csv` chứa dữ liệu công ty).
- SQL luôn dùng tham số, không nối chuỗi. Kết nối DB dành cho AI phải là tài khoản chỉ đọc.
- Phân quyền dữ liệu kiểm tra ở tầng database/backend, không dựa vào prompt.
