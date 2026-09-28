# Kiến trúc "AI Dev Team" cho các dự án vibe code với Claude Code

## Context
Anh muốn có một bộ quy tắc (.md) dùng chung cho mọi dự án, cộng với một đội sub-agent giống team dev thật (PM, UI, BE, DB, QA, Security, Business, SQL, AI-app), mỗi agent tự chọn model hợp lý, có dashboard theo dõi, và áp dụng cho sản phẩm cụ thể như chatbot nội bộ. Hiện tại chưa có gì: `E:\Claude\Code\DataHub` trống, `~/.claude/` chưa có CLAUDE.md và chưa có agents. Tài liệu này là **bản thảo để thảo luận**, chưa phải lệnh triển khai.

---

## 1. Phản biện: những chỗ trong ý tưởng cần điều chỉnh

**(A) Anh đang gộp 2 hệ thống khác nhau thành 1 — đây là điểm quan trọng nhất.**
- **Hệ 1: Đội dev (build-time)**, chạy trong Claude Code để *viết code*: PM, UI, BE, DB, QA, Security.
- **Hệ 2: Agent trong sản phẩm (run-time)**, chạy *bên trong app chatbot*, phục vụ nhân viên: agent hiểu câu hỏi, Business, SQL, vẽ biểu đồ.
- Mục 7 thuộc Hệ 2. Hệ 2 **không chạy bằng sub-agent của Claude Code**, mà bằng Claude API / Agent SDK, deploy thành server. Nhân viên của anh không mở Claude Code để hỏi chatbot.
- Hai hệ chỉ dùng chung một thứ: **kho tri thức công ty** (từ điển nghiệp vụ, từ điển dữ liệu). Đây mới là tài sản cốt lõi.

**(B) Agent không được "đào tạo".** Không có fine-tune ở đây. Muốn agent "hiểu business" thì phải làm 3 việc:
1. Viết tài liệu tri thức: thuật ngữ, quy trình, ý nghĩa từng bảng/cột, các join chuẩn, các KPI được tính thế nào.
2. Có ví dụ mẫu: bộ câu hỏi và câu SQL đúng.
3. Có bộ đánh giá (eval): chấm xem agent trả lời đúng bao nhiêu %.

Phần 1 **chỉ anh (hoặc người hiểu nghiệp vụ) viết được**. Chất lượng agent Business/SQL = chất lượng tài liệu này. Phần lớn công sức của cả dự án nằm ở đây, không nằm ở việc tạo agent.

**(C) Mô hình CEO → PM → team không làm được đúng nghĩa đen trong Claude Code.**
- Sub-agent **không gọi được sub-agent khác**. Chỉ phiên chính (main session) gọi được sub-agent.
- Sub-agent **không có trí nhớ giữa các lần gọi**, và không chạy nền thường trực kiểu "nhân viên".
- Không có agent "CEO toàn tài khoản" chạy liên tục.
- Mỗi tầng trung gian làm **mất ngữ cảnh và tốn token gấp đôi**.
- → Đề xuất: **phiên chính đóng vai PM/Orchestrator**, các chuyên gia là sub-agent một tầng (flat). "CEO" chỉ là bộ quy tắc global (`~/.claude/CLAUDE.md`), không phải một agent.

**(D) 10+ agent ngay từ đầu là quá nhiều.**
- Mỗi lần giao việc qua lại là một lần mất ngữ cảnh.
- Tách UI / BE / DB cho một dự án solo thường sinh lỗi ở chỗ nối (API contract lệch nhau).
- → Nên bắt đầu với ~5 agent, và chỉ thêm agent khi có bằng chứng là cần.

**(E) Mục 4 "Claude không tự ý sửa": file .md chỉ là lời khuyên, không phải khóa.** Phải có cơ chế cứng:
- Git commit trước mỗi task để luôn rollback được.
- `permissions.deny` trong settings.json.
- Hook `PreToolUse` chặn sửa các file/thư mục được bảo vệ.
- Plan mode cho thay đổi lớn.
- Quy tắc "diff tối thiểu", thêm review agent kiểm tra phạm vi thay đổi.

**(F) Mục 3 "biết chính xác chỗ sửa" làm được, nhưng sơ đồ sẽ lỗi thời nếu không bảo trì.**
- Dùng `CODEMAP.md` kèm cấu trúc thư mục theo feature và file nhỏ.
- Bắt buộc: task nào đổi cấu trúc thì phải cập nhật CODEMAP (ghi trong Definition of Done, reviewer kiểm tra).

**(G) Mục 7, pipeline chatbot, có 3 chỗ tôi phản đối:**
1. **Dịch Việt → Anh → Việt:** Claude hiểu tiếng Việt tốt. Dịch thêm một bước làm tăng độ trễ và chi phí, và dễ làm lệch thuật ngữ nội bộ (tên KPI, tên phòng ban). Thay vào đó, bước đầu nên chuyển câu hỏi thành **ý định có cấu trúc (JSON)**: chỉ số gì, kỳ nào, lọc theo gì. Phần prompt hệ thống viết bằng tiếng Anh, còn trả lời thì trả thẳng bằng tiếng Việt.
2. **"PM hỏi người dùng muốn dạng gì" mỗi lần:** gây phiền. Nên tự suy ra: một con số thì trả text, xu hướng/so sánh thì trả biểu đồ, danh sách thì trả bảng. Người dùng muốn dạng khác thì nói thêm.
3. **Python tự vẽ biểu đồ = chạy code tùy ý = rủi ro bảo mật.** Nên để agent trả về *dữ liệu + spec biểu đồ* (JSON cho Plotly/ECharts) rồi frontend tự render. Chỉ dùng sandbox Python khi thật sự cần phân tích phức tạp.
- Ngoài ra, Text-to-SQL bắt buộc có các lớp an toàn: user DB **chỉ đọc**, chỉ truy cập các view đã duyệt, giới hạn số dòng, che dữ liệu cá nhân (PII), log mọi câu SQL, và có bộ câu hỏi chuẩn để đo độ chính xác.

**(H) Dashboard "xem nhân viên làm việc":** làm được bằng hook `SubagentStart/SubagentStop/PreToolUse` ghi log vào SQLite, cộng một trang web đọc log đó. Tuy nhiên đây là phần "đẹp", không tạo ra giá trị cốt lõi → để giai đoạn sau.

---

## 2. Kiến trúc tổng thể đề xuất

```
~/.claude/                       ← "CEO": luật chung cho MỌI dự án
├── CLAUDE.md                    ← quy tắc global (<150 dòng): phạm vi sửa, workflow, git, ngôn ngữ
├── settings.json                ← permissions deny + hooks (bảo vệ file, ghi log agent)
├── agents/                      ← đội dev dùng chung
│   ├── architect.md      (opus)   – PM/kiến trúc: phân tích yêu cầu, chia task, đề xuất team
│   ├── reviewer.md       (opus)   – review code + kiểm tra phạm vi sửa + bảo mật
│   ├── tester.md         (sonnet) – viết/chạy test
│   ├── ui-builder.md     (sonnet) – frontend theo design system
│   └── scout.md          (haiku)  – tìm kiếm/đọc code nhanh, cập nhật CODEMAP
├── skills/                      ← quy trình lặp lại: /new-project, /kickoff, /update-codemap
└── templates/project/           ← khung dự án chuẩn

E:\Claude\Knowledge\             ← KHO TRI THỨC CÔNG TY (git repo riêng, dùng chung)
├── business/glossary.md         ← thuật ngữ, quy trình, KPI định nghĩa
├── data/sources.md              ← nguồn dữ liệu, kết nối
├── data/tables/*.md             ← mỗi bảng 1 file: cột, ý nghĩa, join, lưu ý
└── data/golden_queries.md       ← câu hỏi mẫu + SQL đúng (dùng làm ví dụ + eval)

<mỗi dự án>/
├── CLAUDE.md                    ← chỉ phần riêng của dự án (stack, lệnh chạy, lưu ý)
├── docs/CODEMAP.md              ← sơ đồ: feature → file → hàm chính
├── docs/DECISIONS.md            ← các quyết định kiến trúc (ADR ngắn)
├── .claude/agents/              ← agent riêng dự án (vd: business-analyst, sql-expert trỏ vào Knowledge)
└── src/<feature>/...            ← cấu trúc theo feature, file nhỏ
```

**Chọn model (tiết kiệm):** Opus cho việc cần suy luận sâu (kiến trúc, bảo mật, SQL phức tạp); Sonnet cho việc viết code hằng ngày; Haiku cho tìm kiếm, định dạng, tóm tắt. Khai báo trong frontmatter `model:` của từng agent.

**Hệ 2 (chatbot, run-time), bản MVP:** chỉ **1 agent + nhiều tool**, chưa cần nhiều agent:
`câu hỏi → agent (system prompt có glossary + schema) → tool run_sql (read-only) → tool make_chart_spec → trả lời tiếng Việt`
Chỉ tách thành nhiều agent khi đo được là 1 agent không đủ tốt.

---

## 2b. Các quyết định đã chốt
- **Stack mặc định: Python-centric.** Python 3.13 + venv/pip, FastAPI, SQLAlchemy, pytest, ruff. (2026-09-28: bỏ `uv` vì máy công ty không vào được PyPI; chuẩn hóa 3.13 để dùng chung wheel offline.) Frontend dùng Streamlit cho công cụ nội bộ; chỉ chuyển sang Next.js khi thật sự cần UI đẹp (ghi lý do vào DECISIONS.md).
- **Phạm vi: bắt đầu gọn.** Phiên chính làm PM, 5 agent lõi, chatbot MVP gồm 1 agent + tools.
- **Nguồn dữ liệu: SQL Server + Excel/Google Sheets + ERP/Cloud DW.**

### Phản biện thêm: "Agent SQL tự gom data từ nhiều nguồn"
Không nên để agent join trực tiếp giữa SQL Server, file Excel và ERP mỗi khi có câu hỏi, vì sẽ chậm, dễ sai, khó kiểm soát và không tái lập được kết quả. Nên làm như sau:
- Xây **một lớp dữ liệu trung gian** (ETL đơn giản bằng Python, chạy theo lịch) để đổ Excel/Sheets/ERP vào **một schema `analytics` trên SQL Server**.
- Tạo sẵn các **view đã làm sạch**.
- Agent SQL **chỉ đọc các view này**. Toàn bộ "gom nhặt nhiều nguồn" nằm trong code ETL có test, không nằm trong suy luận của AI.

### Thảo luận: API key cho chatbot nhóm nhỏ
1. **Tách 2 loại chi phí.** Gói Claude Code (Pro/Max) chỉ dùng cho đội dev. Chatbot cần **API key riêng** từ Anthropic Console, tính tiền theo token.
2. **API key chỉ nằm trên server backend**, trong `.env` (không commit) hoặc secret store. Không bao giờ để ở frontend hay trên máy người dùng. Dùng **2 key riêng cho dev và prod**, và xoay vòng key định kỳ.
3. **Người dùng không cầm key.** Họ đăng nhập app (công ty có Microsoft 365 → dùng SSO Entra ID). Backend nhận diện user rồi gọi Claude thay cho họ.
4. **Kiểm soát chi phí:**
   - Đặt spend limit cho workspace trên Console.
   - Đặt quota mỗi user/ngày trong app, và log token theo user.
   - Dùng prompt caching cho phần glossary/schema (phần lặp lại lớn nhất).
   - Dùng Haiku cho bước phân loại câu hỏi, Sonnet cho bước sinh SQL.
   - Đo chi phí thật trong giai đoạn pilot trước khi mở rộng.
5. **Rủi ro lớn hơn key là phân quyền dữ liệu.** Dù nhóm nhỏ, dữ liệu như bảng lương không phải ai cũng được xem. Vì vậy:
   - Mỗi vai trò map với một **DB login read-only riêng**, chỉ được cấp các view tương ứng (hoặc dùng row-level security).
   - Quyền được kiểm tra ở tầng database, **không dựa vào prompt**.
   - Log mọi câu hỏi và câu SQL kèm user id để audit.

---

## 3. Roadmap

| Giai đoạn | Nội dung | Kết quả kiểm chứng |
|---|---|---|
| **0. Nền móng** (1–2 ngày) | Chốt stack mặc định. Viết `~/.claude/CLAUDE.md` global, `settings.json` (deny + hook chặn sửa file bảo vệ). Mọi dự án bắt buộc dùng git. | Thử yêu cầu Claude sửa file bị bảo vệ → bị chặn |
| **1. Khung dự án** (2–3 ngày) | Template: cấu trúc thư mục, CLAUDE.md dự án, CODEMAP, DECISIONS. Skill `/new-project`. | Tạo 1 dự án nhỏ từ template, sửa 1 tính năng chỉ dựa vào CODEMAP |
| **2. Đội dev lõi** (1 tuần) | 5 agent: architect, reviewer, tester, ui-builder, scout. Skill `/kickoff` để PM trình bày team và kế hoạch cho dự án mới. | Chạy 1 dự án thật và ghi lại agent nào hữu ích, agent nào thừa |
| **3a. Lớp dữ liệu** (1–2 tuần) | ETL Python: Excel/Sheets/ERP → schema `analytics` trên SQL Server. Tạo view sạch và DB login read-only theo vai trò. | Các view đã trả đúng số liệu khi đối chiếu với báo cáo hiện có |
| **3b. Kho tri thức** (2–4 tuần, **việc của anh là chính**) | Glossary, mô tả từng view, 30–50 golden queries. Agent `business-analyst` và `sql-expert`. | sql-expert trả lời đúng ≥ 80% bộ golden queries |
| **4. Chatbot MVP** (2–3 tuần) | Claude API + FastAPI + Streamlit: 1 agent + tool SQL read-only + chart spec. SSO Microsoft 365, quota theo user, key chỉ nằm trên server. | Nhóm nhỏ dùng thử; log câu sai để bổ sung kho tri thức; đo chi phí/câu hỏi |
| **5. Quan sát** (3–5 ngày) | Hook ghi log agent vào SQLite + dashboard (agent nào, dự án nào, đang làm gì, tốn bao nhiêu). | Dashboard hiển thị hoạt động thời gian thực |
| **6. Mở rộng** | Thêm agent chuyên biệt (DB, AI-app builder, security riêng) **khi có bằng chứng cần**. Chatbot tách multi-agent nếu cần. | Quyết định dựa trên log ở giai đoạn 5 |

Nguyên tắc xuyên suốt: **làm xong và kiểm chứng giai đoạn trước rồi mới sang giai đoạn sau.**

---

## 3b. Quy trình sử dụng hằng ngày (cần 2 skill: `/kickoff`, `/onboard`)
- **Dự án mới:** `git init` → `/kickoff "<mô tả>"` → architect hỏi lại, đề xuất team + kế hoạch → anh duyệt → làm từng task nhỏ, mỗi task 1 commit.
- **Dự án cũ:** commit/backup trước → `/onboard` → scout (haiku) đọc code, sinh CLAUDE.md + CODEMAP + danh sách vấn đề (chỉ đọc, không sửa) → anh duyệt → khóa vùng code đang chạy ổn → chỉ refactor dần khi chạm vào.

## 3c. Làm việc trên nhiều máy (nhà + công ty)
- Ngữ cảnh phải nằm trong **file trong git**, không nằm trong lịch sử chat (lịch sử chat và auto-memory chỉ lưu local ở `~/.claude/projects/`).
- Nơi lưu: **GitHub private cá nhân** (anh tự chịu trách nhiệm xác nhận chính sách công ty cho `company-knowledge` và code dự án; bật 2FA; tuyệt đối không commit dữ liệu thật/secret — thêm hook chặn commit file `.env`, `*.xlsx`).
- 3 repo private: `claude-config` (CLAUDE.md, agents, skills, settings + script `install.ps1` copy vào `~/.claude`), `company-knowledge`, và từng repo dự án.
- Mỗi dự án có `docs/PROGRESS.md` (đang làm gì, bước tiếp theo, quyết định dở dang). Skill `/handoff` cập nhật file này + commit + push khi kết thúc phiên; đầu phiên mới: `git pull` → Claude đọc PROGRESS.md.
- Không đưa vào git: `.env`, key, file Excel dữ liệu thật. Mỗi máy tự có `.env` riêng.
- Đường dẫn trong config dùng tương đối hoặc biến môi trường, không hardcode `E:\...`.

## 3d. Đặt tên và vị trí thư mục
**Đã chốt:** đổi `claude-config` → **`claude-team`** (các chỗ ghi `claude-config` ở trên hiểu là `claude-team`) và giữ `DataHub` cho dự án chatbot/dữ liệu (tên hợp với nó).
```
E:\Claude\Code\
├── claude-team\         ← đội ngũ dùng chung: luật, agents, skills, hooks, install (repo 1)
├── company-knowledge\   ← tri thức nghiệp vụ + mô tả dữ liệu, nhạy cảm (repo 2)
├── DataHub\             ← dự án chatbot/dữ liệu (repo 3)
└── <dự án khác>\
```
- Không đặt team bên trong một dự án, và không gộp tri thức công ty vào repo team (khác mức nhạy cảm, khác nhịp thay đổi).
- Việc cần làm khi duyệt: đổi tên thư mục, sửa README, cập nhật memory; mở `claude-team` trong VS Code khi làm việc với đội ngũ. Cấu hình đã cài trong `~/.claude` không bị ảnh hưởng (install không phụ thuộc đường dẫn).

## 4. Việc tiếp theo ngay khi anh duyệt
Triển khai **Giai đoạn 0**: tạo `~/.claude/CLAUDE.md`, cập nhật `~/.claude/settings.json` (giữ nguyên nội dung hiện có, chỉ thêm), rồi thử nghiệm cơ chế chặn sửa file.
