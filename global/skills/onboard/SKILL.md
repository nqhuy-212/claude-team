---
name: onboard
description: Đưa một dự án có sẵn code vào quy trình claude-team. Đọc code (chỉ đọc), sinh CLAUDE.md dự án, docs/CODEMAP.md, DECISIONS.md, PROGRESS.md, báo cáo danh sách vấn đề và đề xuất vùng cần khóa. Không sửa code.
argument-hint: "[ghi chú, vd phần nào đang chạy ổn không được động vào]"
disable-model-invocation: true
---

# /onboard

Nguyên tắc: **chỉ đọc code, không sửa code.** Chỉ được tạo hoặc sửa các file tài liệu nêu dưới đây.

Ghi chú từ người dùng: $ARGUMENTS

## Bước 1 – An toàn trước
- `git status`. Chưa phải git repo → dừng, đề xuất: kiểm tra `.gitignore` chặn secret/dữ liệu, `git init`, commit toàn bộ hiện trạng. Có thay đổi chưa commit → đề nghị người dùng commit trước và chờ trả lời.
- Đã có `CLAUDE.md` hoặc file trong `docs/` → đọc trước. Khi cập nhật chỉ bổ sung, không xóa nội dung người dùng đã viết.

## Bước 2 – Tìm hiểu dự án
Đọc theo thứ tự, đủ hiểu thì dừng:
1. README, file khai báo gói (`pyproject.toml`, `requirements*.txt`, `package.json`...), điểm chạy (`main.py`, `app.py`, Dockerfile, script).
2. Cây thư mục, bỏ qua `.git`, `.venv`, `node_modules`, `dist`, `build`, thư mục dữ liệu.
3. Từng module chính: đọc lướt đủ để biết vai trò và hàm vào chính.
4. Test có sẵn, cách chạy test và lint.

Dự án lớn (khoảng > 50 file code) → giao việc đọc từng thư mục cho sub-agent tìm kiếm (`scout` nếu đã có, không thì `Explore`), chỉ nhận lại tóm tắt.
Không mở file secret (`.env`...) hay file dữ liệu (`*.xlsx`, `*.csv`...).

## Bước 3 – Tạo file khung còn thiếu
```
node "$HOME/.claude/templates/scaffold.mjs" . --name "<Tên dự án>"
```
Script không ghi đè file đã có, chỉ thêm dòng còn thiếu vào `.gitignore` và `.gitattributes`. Sau đó chạy `git status`:
- Nhiều file code bị báo "modified" dù chưa đụng tới → do `.gitattributes` mới đổi cách xuống dòng. Nếu file này vừa được tạo thì xóa nó đi và ghi vào danh sách vấn đề; nếu là file cũ được thêm dòng thì hoàn tác phần thêm (`git checkout -- .gitattributes`).
- `.gitignore` mới chặn file đang được track (vd `*.csv` đã commit) → không tự xóa khỏi git, ghi vào danh sách vấn đề.

## Bước 4 – Viết tài liệu
- `CLAUDE.md`: mục tiêu suy ra từ code (chỗ nào đoán thì ghi "(cần xác nhận)"), stack thật đang dùng (khác mặc định thì ghi rõ, không đề xuất chuyển), lệnh cài/chạy/test/lint thực tế.
- `docs/CODEMAP.md`: luồng chính và bảng tính năng → thư mục → điểm vào. Chỉ ghi những gì đã thấy trong code.
- `docs/DECISIONS.md`: thay D-001 mặc định bằng các quyết định suy ra từ code (stack, cách tổ chức, CSDL), mỗi mục ghi "(suy ra khi onboard)".
- `docs/PROGRESS.md`: "Đã xong" = "Onboard vào claude-team". "Việc tiếp theo" = 3–5 vấn đề quan trọng nhất ở Bước 5.
- Chạy thử lệnh test/lint nếu chạy được mà không cần secret. Không chạy được thì ghi rõ lý do.

## Bước 5 – Báo cáo (không sửa code)
Trình bày cho người dùng:
1. Tóm tắt dự án 3–5 dòng.
2. Danh sách vấn đề, xếp theo mức độ: bảo mật (secret trong code, SQL nối chuỗi, dữ liệu thật đã commit...), lỗi tiềm ẩn, thiếu test, file quá lớn, lệch stack. Mỗi vấn đề: `file:dòng` và một câu mô tả. Không tự sửa.
3. Đề xuất vùng khóa: phần đang chạy ổn hoặc nhạy cảm nên đưa vào `.claude/protected`, viết thành khối pattern để người dùng tự dán vào file (Claude không được sửa file này).
4. Đề xuất commit `Onboard project into claude-team workflow` (chỉ gồm tài liệu). Chỉ commit khi người dùng đồng ý. Không push.
