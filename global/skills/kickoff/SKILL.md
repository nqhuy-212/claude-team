---
name: kickoff
description: Khởi động một dự án hoặc một mục tiêu lớn. Nhờ architect phân tích, phản biện, thiết kế và chia task; trình bày đội hình và kế hoạch để người dùng duyệt; ghi kế hoạch vào PROGRESS và quyết định vào DECISIONS. Chưa viết code.
argument-hint: "[mô tả dự án hoặc mục tiêu]"
disable-model-invocation: true
---

# /kickoff

Mục tiêu: từ một mô tả, có được kế hoạch đã được người dùng duyệt, ghi trong `docs/PROGRESS.md`, để các phiên sau làm theo từng task nhỏ.

Mô tả từ người dùng: $ARGUMENTS

## Bước 1 – Kiểm tra điều kiện
- Thiếu `CLAUDE.md` hoặc `docs/PROGRESS.md`: thư mục trống → đề nghị chạy `/new-project` trước; đã có code → đề nghị `/onboard` trước. Dừng.
- Mô tả trống → hỏi người dùng mục tiêu (1–3 câu) rồi mới làm tiếp.
- `git status` không sạch → hỏi người dùng trước khi làm tiếp.

## Bước 2 – Thu thập bối cảnh
- Đọc `CLAUDE.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/CODEMAP.md`.
- Dự án đã có nhiều code → gọi `scout` với câu hỏi cụ thể về những phần liên quan tới mục tiêu, lấy tóm tắt để đưa cho `architect` (architect chạy opus, tự đọc code sẽ tốn hơn).

## Bước 3 – Giao cho architect
Gọi agent `architect`. Prompt gồm: mô tả của người dùng nguyên văn; tóm tắt bối cảnh (mục tiêu dự án, stack, quyết định đã có, cấu trúc hiện tại, tóm tắt từ scout); yêu cầu trả báo cáo đúng định dạng của architect.

## Bước 4 – Làm rõ với người dùng
- Báo cáo có "Câu hỏi cho người dùng" → hỏi người dùng một lần (gộp các câu), mỗi câu kèm phương án đề xuất.
- Câu trả lời làm thiết kế thay đổi đáng kể → gọi lại `architect`, gửi kèm báo cáo cũ và câu trả lời (agent không nhớ lần gọi trước). Thay đổi nhỏ thì PM tự chỉnh kế hoạch.

## Bước 5 – Trình bày để duyệt
Trình bày ngắn gọn bằng tiếng Việt:
1. Mục tiêu và phạm vi đợt này (làm / để sau).
2. Thiết kế tóm tắt: luồng chính, các module.
3. **Đội hình**: bảng agent → vai trò trong dự án này; agent nào không dùng và vì sao; agent riêng dự án nếu có đề xuất.
4. **Kế hoạch task**: bảng `# | Task | Người làm | Tiêu chí xong`.
5. Quyết định sẽ ghi vào DECISIONS và các rủi ro chính.

Chờ người dùng duyệt hoặc sửa. Không tự bắt đầu code.

## Bước 6 – Ghi lại sau khi được duyệt
- `docs/PROGRESS.md`: "Việc tiếp theo" = danh sách task theo thứ tự, mỗi task kèm tiêu chí xong ngắn; "Chờ quyết định" = các câu hỏi còn mở.
- `docs/DECISIONS.md`: thêm các quyết định đã duyệt, đánh số tiếp theo.
- `CLAUDE.md`: mục "Mục tiêu" còn trống thì điền.
- Agent riêng dự án đã được duyệt → tạo `.claude/agents/<tên>.md` theo cùng định dạng với agent của claude-team (`~/.claude/agents/`).
- Đề xuất commit `Add project plan from kickoff` (chỉ gồm tài liệu). Chỉ commit khi người dùng đồng ý.
- Kết thúc bằng: task 1 là gì, và đề nghị bắt đầu.
