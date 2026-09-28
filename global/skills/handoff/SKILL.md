---
name: handoff
description: Kết thúc phiên làm việc. Cập nhật docs/PROGRESS.md (và CODEMAP, DECISIONS nếu cần), kiểm tra không lọt secret hay dữ liệu, rồi commit và push để máy khác hoặc phiên sau làm tiếp được.
argument-hint: "[ghi chú thêm cho phiên sau]"
disable-model-invocation: true
---

# /handoff

Mục tiêu: phiên sau (máy khác, hoặc một Claude không nhớ gì) chỉ cần `git pull` rồi đọc `docs/PROGRESS.md` là làm tiếp được.

Ghi chú thêm từ người dùng: $ARGUMENTS

## Bước 1 – Nắm tình hình
- `git status`, `git diff --stat`, và `git log --oneline "@{u}.."` để xem commit chưa push (bỏ qua nếu nhánh chưa có upstream).
- Từ cuộc hội thoại của phiên này: đã làm gì, đang dở gì, đã quyết định gì, vướng ở đâu.

## Bước 2 – Cập nhật tài liệu
- `docs/PROGRESS.md` (chưa có thì tạo theo mẫu `$HOME/.claude/templates/project/docs/PROGRESS.md`). Giữ cấu trúc mục sẵn có của file:
  - Ngày "Cập nhật" = hôm nay.
  - Việc đã xong → chuyển vào "Đã xong", ghi gọn theo kết quả, không kể từng lệnh.
  - Việc dở → ghi rõ dở tới đâu, ở file nào.
  - "Việc tiếp theo": các bước cụ thể, làm được ngay.
  - Việc đang chờ người dùng quyết định → ghi thành câu hỏi rõ ràng.
  - Giữ file ngắn (khoảng < 60 dòng): gộp các mục "Đã xong" cũ thành một dòng cho mỗi giai đoạn.
- Phiên này có đổi cấu trúc (thêm, xóa, đổi tên file, module, API) mà `docs/CODEMAP.md` chưa cập nhật → cập nhật.
- Có quyết định kiến trúc mới chưa ghi → thêm vào `docs/DECISIONS.md`.
- Phiên có gọi agent → thêm một dòng vào mục "Nhận xét đội agent" của `docs/PROGRESS.md` (tạo mục nếu chưa có): agent nào hữu ích, thừa, hoặc làm sai ở đâu. Đây là dữ liệu để đánh giá và chỉnh đội agent.

## Bước 3 – Kiểm tra trước khi commit
- Liệt kê file sẽ commit. Dừng lại và hỏi nếu thấy: `.env*` (trừ `.env.example`), key/cert, `*.xlsx`/`*.csv`/dữ liệu thật, file lớn bất thường, hoặc thay đổi không thuộc phiên này.
- `git add` từng file hoặc thư mục cụ thể. Không dùng `git add -A` hay `git add .`.
- Test/lint chưa chạy hoặc đang lỗi → ghi rõ vào `docs/PROGRESS.md` và báo người dùng.

## Bước 4 – Commit và push (cần xác nhận)
- Trình bày: danh sách file, commit message đề xuất (tiếng Anh, tóm tắt việc làm trong phiên), nhánh sẽ push.
- Chờ người dùng đồng ý một lần rồi mới `git commit` và `git push`. Không force-push. Push lỗi (xung đột, chưa có remote) → báo lại, không tự xử lý bằng lệnh phá hủy.
- Kết thúc bằng một dòng: phiên sau bắt đầu từ việc gì.
