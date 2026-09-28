# CODEMAP – {{PROJECT_NAME}}

Cập nhật: {{DATE}}

Bản đồ để tìm đúng chỗ sửa mà không phải quét cả repo. Task nào thêm, xóa, đổi tên file, module hoặc API thì cập nhật file này trong cùng task. Chỉ ghi những gì đang có thật trong code.

## Luồng chính
- (1–5 dòng: request/dữ liệu đi qua những đâu, vd `trang Streamlit → service → repository → view analytics.v_sales`)

## Tính năng
| Tính năng | Thư mục | Điểm vào chính | Ghi chú |
|---|---|---|---|
| _(ví dụ) sales-report_ | `src/sales_report/` | `service.py: build_report()` | đọc view `analytics.v_sales` |

## Dùng chung
| Thành phần | File | Vai trò |
|---|---|---|

## Dữ liệu và hệ thống bên ngoài
| Nguồn | Truy cập ở đâu | Ghi chú |
|---|---|---|
