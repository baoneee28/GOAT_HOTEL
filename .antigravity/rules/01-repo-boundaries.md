# 01 — Ranh Giới Repo

## Mục Đích
Định nghĩa ranh giới vật lý của repo, thư mục nào editable, thư mục nào cấm, và từng tầng có trách nhiệm gì.

## Áp Dụng Khi Nào
Mỗi phiên làm việc.

---

## Thư Mục Editable Hợp Lệ

```
backend/src/main/java/com/hotel/     ← Java source (editable)
  controller/api/                    ← REST endpoints (tầng chính đang dùng)
  controller/admin/                  ← Admin MVC cũ (có thể vẫn active)
  controller/                        ← MVC Thymeleaf cũ
  service/                           ← XỬ LÝ NGHIỆP VỤ — đặt logic ở đây
  repository/                        ← Truy cập DB — chỉ query, không logic nghiệp vụ
  entity/                            ← JPA entities — định nghĩa schema thực tế
  config/                            ← WebConfig, WebMvcConfig, CORS
  interceptor/                       ← Auth interceptor — bảo vệ route

backend/src/main/resources/          ← Config và static
  application.properties
  application-sqlserver.properties
  static/                            ← File tĩnh, ảnh upload

backend/pom.xml                      ← Maven dependencies

frontend/src/                        ← React source (editable)
  components/                        ← Layout components dùng chung
  pages/                             ← Public pages
  pages/admin/                       ← Admin pages

frontend/index.html
frontend/package.json
frontend/vite.config.js
.antigravity/                        ← Rules system
```

---

## Trách Nhiệm Từng Tầng Backend

| Tầng | Trách Nhiệm | Không Được |
|------|-------------|-----------|
| `controller/api/` | Nhận request, trả response, gọi service | Query DB trực tiếp, viết business logic |
| `service/` | Toàn bộ nghiệp vụ, validation có thẩm quyền, tính toán | Query DB trực tiếp (dùng repository) |
| `repository/` | Truy cập DB thông qua Spring Data JPA | Viết business logic, tính toán |
| `entity/` | Định nghĩa model persistence | Viết logic nghiệp vụ |
| `interceptor/` | Kiểm tra auth/session trước khi vào controller | |
| `config/` | Cấu hình Spring, CORS, web | |

> **Quy tắc:** Controller gầy — chỉ gọi service. Service béo — chứa toàn bộ nghiệp vụ.

---

## Ranh Giới Frontend / Backend

```
frontend/src/   →  chỉ UI, không có business logic
backend/src/    →  toàn bộ nghiệp vụ, data, bảo mật
```

- Frontend không query DB. Không có ngoại lệ.
- Frontend không tính toán giá trị nghiệp vụ cuối cùng.
- Frontend không kiểm soát quyền truy cập thực sự.

---

## Quy Tắc Bắt Buộc

- [ ] File tôi sắp sửa có nằm trong thư mục editable không?
- [ ] Tôi có đang chạm vào `target/`, `node_modules/`, `dist/` không? → Dừng lại.
- [ ] Tôi có đang vượt tầng không cần thiết không?

---

## Sai Lầm Thường Gặp

| Sai lầm | Đúng là |
|---------|---------|
| Query DB ngay trong controller | Gọi service, để service gọi repository |
| Viết business rule trong repository | business rule thuộc service |
| Thêm business logic vào React component | Gọi API, nhận kết quả từ backend |
