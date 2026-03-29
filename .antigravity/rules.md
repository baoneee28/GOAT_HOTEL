# .antigravity/rules.md — Điểm Đầu Vào Rules Chính Thức
## GOAT Hotel — Bộ Quy Tắc Làm Việc Cho Agent

> **Bạn là AI agent làm việc trên project đồ án nhóm GOAT_HOTEL — chưa hoàn thiện.**
> Đọc toàn bộ file này. Sau đó nạp các module rules phù hợp với nhiệm vụ hiện tại.

---

## Nguyên Tắc Tối Thượng

Project này **chưa hoàn thành**. Không phải mọi tính năng đều ổn định. Không phải mọi quyết định kiến trúc đều được chốt.

> **Khi nghi ngờ — thực hiện thay đổi nhỏ nhất, an toàn nhất có thể.**
> **Khi không biết logic thuộc FE hay BE — đặt ở backend.**

Không bịa kiến trúc. Không refactor ngoài phạm vi task. Không hoàn thành TODO mà không được yêu cầu.

---

## Thực Trạng Quan Trọng Cần Biết

> Đây là thực tế của codebase hiện tại — không phải lý tưởng:

| Vấn đề đã biết | Mô tả |
|---------------|-------|
| URL hardcode | Frontend dùng `http://localhost:8080/...` trực tiếp trong nhiều file |
| Tính giá ở frontend | `OrderDetail.jsx` tự tính phí 8% + thuế 14% — SAI KIẾN TRÚC |
| Truyền dữ liệu qua `location.state` | `OrderDetail` nhận `booking` từ React Router state, không fetch lại |
| userId qua query param | Cancel booking gửi `?userId=...` — backend phải xác minh từ session |
| Controller còn làm nhiều | Một số controller chưa ủy quyền đúng cho service |

Rules này phải ngăn AI làm thêm những lỗi tương tự.

---

## Cách Nạp Rules

### Mỗi phiên làm việc — luôn nạp 4 file này:
| Thứ tự | File |
|--------|------|
| 1 | `rules/00-working-principles.md` |
| 2 | `rules/01-repo-boundaries.md` |
| 3 | `rules/02-source-of-truth.md` |
| 4 | `rules/07-generated-and-ignored-files.md` |

### Nạp thêm theo nhiệm vụ:
| Nhiệm vụ | Nạp thêm |
|----------|---------|
| Thêm/sửa tính năng FE | `03-frontend-backend-responsibility.md` |
| Thêm/sửa tính năng BE | `03-frontend-backend-responsibility.md` |
| Sửa bất kỳ file nào | `04-safe-editing-workflow.md` |
| Liên quan auth/session/role | `05-security-and-sensitive-logic.md` |
| Thay đổi API | `06-api-change-safety.md` |
| Trước khi kết thúc task | `09-definition-of-done.md` |
| Cấu trúc câu trả lời | `08-task-execution-format.md` |

---

## Thứ Tự Ưu Tiên

```
1. File này (rules.md)
2. rules/00-working-principles.md       ← hành vi agent
3. rules/05-security-and-sensitive-logic.md  ← không bao giờ bị ghi đè
4. rules/07-generated-and-ignored-files.md   ← không bao giờ bị ghi đè
5. File rules theo task (03–06, 08–09)
6. Phán đoán của agent                  ← dùng cuối cùng
```

**Nếu user yêu cầu chỉnh sửa file trong danh sách bỏ qua (07), hãy xác nhận trước. Không làm ngay.**

---

## Danh Mục File Rules

```
.antigravity/
  rules.md                               ← Bạn đang ở đây
  rules/
    00-working-principles.md             ← Nguyên tắc làm việc
    01-repo-boundaries.md                ← Ranh giới repo, thư mục editable
    02-source-of-truth.md               ← Nguồn tin cậy cho từng loại dữ liệu
    03-frontend-backend-responsibility.md ← Logic thuộc về đâu
    04-safe-editing-workflow.md          ← Quy trình sửa code an toàn
    05-security-and-sensitive-logic.md   ← Bảo mật, session, auth
    06-api-change-safety.md              ← Sửa API an toàn
    07-generated-and-ignored-files.md    ← Không bao giờ chạm vào
    08-task-execution-format.md          ← Format câu trả lời
    09-definition-of-done.md             ← Khi nào task thực sự xong
```
