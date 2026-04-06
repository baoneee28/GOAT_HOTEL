# 🔍 GOAT HOTEL — Báo Cáo Audit Kỹ Thuật Toàn Diện (Phase 2)

> **Ngày audit:** 2026-04-06  
> **Phiên bản:** Phase 2 — Deep-Dive Analysis  
> **Phạm vi:** Toàn bộ Backend (Java/Spring Boot) + Frontend (React/Vite) + Database (SQL Server)

---

## Tổng Quan Phân Loại

| Mức độ | Số lượng | Mô tả |
|--------|----------|-------|
| 🔴 **BLOCKER** | 5 | Bắt buộc sửa trước khi demo/nộp — trực tiếp gây lỗi hoặc bị khai thác |
| 🟠 **HIGH** | 11 | Giảng viên rất dễ phát hiện khi review code — thiếu tính chuyên nghiệp |
| 🟡 **MEDIUM** | 14 | Ảnh hưởng chất lượng tổng thể, cần cải thiện nếu có thời gian |
| 🔵 **LOW** | 8 | Cải tiến tốt nhưng không ảnh hưởng demo |

---

## I. BẢO MẬT — 🔴 CRITICAL ZONE

### BUG-001 🔴 BLOCKER — Mật khẩu lưu dạng plaintext (KHÔNG hash)

> [!CAUTION]
> Đây là lỗi bảo mật nghiêm trọng nhất. Bất kỳ giảng viên nào nhìn vào DB đều thấy password dạng text thuần.

**Vị trí:**
- [AuthService.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/service/AuthService.java) — `login()` method, line ~45: so sánh `password.equals(user.getPassword())`
- [AuthApiController.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/api/AuthApiController.java) — `verifyReset()` line 179: `user.setPassword(newPassword)` lưu thẳng plaintext
- [AdminDemoDataSeedRunner.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/config/AdminDemoDataSeedRunner.java) — seed data line 107: `user.setPassword(seed.password())`

**Phân tích:** Toàn bộ chuỗi xử lý mật khẩu (đăng ký, đăng nhập, reset password, seed data) đều không dùng bất kỳ thuật toán hash nào. Password lưu thẳng vào DB.

**Remediation:**
```java
// Thêm BCryptPasswordEncoder bean trong SecurityConfig hoặc AppConfig:
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}

// AuthService.login():
if (!passwordEncoder.matches(password, user.getPassword())) { return null; }

// AuthService.register():
user.setPassword(passwordEncoder.encode(password));
```

---

### BUG-002 🔴 BLOCKER — OTP reset password dùng `java.util.Random` (không an toàn)

**Vị trí:** [AuthApiController.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/api/AuthApiController.java) — line 121

```java
String otp = String.format("%06d", new Random().nextInt(1000000));
```

**Vấn đề:** `java.util.Random` dùng seed có thể đoán được (predictable). Trong bối cảnh security (OTP), phải dùng `SecureRandom`.

**Remediation:**
```java
String otp = String.format("%06d", new SecureRandom().nextInt(1000000));
```

---

### BUG-003 🔴 BLOCKER — GlobalExceptionHandler ghi stacktrace chứa thông tin nhạy cảm ra file

**Vị trí:** [GlobalExceptionHandler.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/GlobalExceptionHandler.java)

**Vấn đề kép:**
1. **Log toàn bộ request parameters** (line 29-33) — bao gồm có thể chứa `password`, `otp`, `newPassword`. Đây là lỗi **information disclosure** nghiêm trọng.
2. **Ghi ra file cố định `error_debug.log`** thay vì dùng SLF4J/Logback. File này nằm ở working directory, dễ bị đọc.
3. **`throw new RuntimeException(ex)`** (line 39) — re-throw exception trả về Whitelabel Error Page với full stacktrace cho client.

**Remediation:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
    log.error("Unhandled exception", ex); // dùng SLF4J
    Map<String, Object> body = new HashMap<>();
    body.put("success", false);
    body.put("message", "Có lỗi hệ thống. Vui lòng thử lại.");
    return ResponseEntity.status(500).body(body);
}
```

---

### BUG-004 🟠 HIGH — Admin/Staff endpoints thiếu auth check trực tiếp trong controller

**Vị trí:** [BookingApiController.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/api/BookingApiController.java)
- `checkInAdmin()` (line 504) — không check session, không verify role
- `checkoutAdmin()` (line 426) — không check session
- `approveAdminBooking()` (line 562) — không check session
- `collectCashPayment()` (line 596) — không check session
- `deleteAdminBooking()` (line 614) — không check session

**Phân tích:** Dù có `AdminInterceptor` trên path `/api/admin/**`, nhưng:
1. Interceptor có thể bị bypass nếu cấu hình path sai
2. Thiếu **defense-in-depth** — không có `@PreAuthorize` hoặc explicit session check ở controller level
3. So sánh với `saveAdminBooking()` (line 293) — method này CÓ check `authService.isAdmin(currentUser)`, chứng tỏ team đã nhận ra cần check nhưng không áp dụng nhất quán

**Remediation:** Thêm `getSessionUser()` + role check vào mỗi admin endpoint, hoặc tạo utility method chung.

---

### BUG-005 🟠 HIGH — VNPay secret key và credential SMTP nằm trong source code

**Vị trí:** [application.properties](file:///e:/GOAT_HOTEL/backend/src/main/resources/application.properties)

```properties
vnp.hashSecret=YOUR_HASH_SECRET_HERE
spring.mail.password=...
spring.datasource.password=...
```

**Vấn đề:** Credentials commit thẳng vào Git. Giảng viên sẽ chỉ ra đây là anti-pattern cơ bản.

**Remediation:** Dùng `application-local.properties` (gitignored) hoặc biến môi trường.

---

## II. KIẾN TRÚC & THIẾT KẾ

### BUG-006 🟠 HIGH — Frontend tự tính toán giá (duplicate business logic)

> [!WARNING]
> Đây là lỗi kiến trúc mà giảng viên CNPM rất hay hỏi: "Tại sao logic tính tiền lại nằm ở Frontend?"

**Vị trí:**
- [config.js](file:///e:/GOAT_HOTEL/frontend/src/config.js) — `calculateBookingDisplayTotal()`, `calculateStayNights()`
- [OrderDetail.jsx](file:///e:/GOAT_HOTEL/frontend/src/pages/OrderDetail.jsx) — line 307-351: tự tính `nights`, `baseTotal`, `grandTotal`, `depositAmount`, `remainingAmount`

**Phân tích:**
- Backend đã có `BookingService.normalizeBookingFinancials()` trả về đúng các trường `totalPrice`, `finalAmount`, `depositAmount`, `paidAmount`, `remainingAmount`
- Frontend lại tự tính lại: `depositAmount = Math.round(grandTotal * 0.3)` (line 349) — đây là **hardcode 30%** ở FE, nếu backend đổi tỷ lệ thì FE sẽ hiển thị sai

**Remediation:** Frontend chỉ nên **hiển thị** giá trị backend trả về, không tự tính lại. Xóa các hàm tính toán tài chính ở FE.

---

### BUG-007 🟠 HIGH — Truyền booking data qua `location.state` thay vì fetch từ API

**Vị trí:** [OrderDetail.jsx](file:///e:/GOAT_HOTEL/frontend/src/pages/OrderDetail.jsx) — line 197

```jsx
const [booking, setBooking] = useState(location.state?.booking || null);
```

**Vấn đề:**
1. Nếu user refresh trang → `location.state` bị mất → `booking` = null → phải fallback fetch
2. Data có thể stale (cũ) nếu booking bị thay đổi từ admin
3. Vi phạm nguyên tắc Single Source of Truth

**Ghi nhận tốt:** Component có fallback `fetchBookingDetail()` (line 205-228). Tuy nhiên, vẫn nên fetch-first thay vì state-first.

---

### BUG-008 🟡 MEDIUM — `pom.xml` khai báo cả MySQL lẫn SQL Server driver

**Vị trí:** [pom.xml](file:///e:/GOAT_HOTEL/backend/pom.xml) — line 47-60

```xml
<!-- MySQL Connector -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
</dependency>

<!-- SQL Server JDBC Driver -->
<dependency>
    <groupId>com.microsoft.sqlserver</groupId>
    <artifactId>mssql-jdbc</artifactId>
</dependency>
```

**Vấn đề:** Project chỉ dùng SQL Server nhưng vẫn kéo MySQL connector. Giảng viên sẽ hỏi: "Tại sao lại có dependency MySQL?"

**Remediation:** Xóa `mysql-connector-j`.

---

### BUG-009 🟡 MEDIUM — `pom.xml` khai báo Thymeleaf nhưng không dùng

**Vị trí:** [pom.xml](file:///e:/GOAT_HOTEL/backend/pom.xml) — line 36-39

**Phân tích:** Project là REST API + React SPA, không có file `.html` Thymeleaf nào trong `templates/`. Dependency thừa.

---

### BUG-010 🟡 MEDIUM — Không có DTO layer — Entity trực tiếp serialize ra JSON

**Vị trí:** Toàn bộ controller trả về `Booking`, `User`, `Room` trực tiếp.

**Vấn đề:**
1. Trường `password` của `User` có thể bị leak ra JSON (chỉ chặn nhờ `@JsonIgnoreProperties` rải rác)
2. `@Transient` fields trên `Booking` (line 40-68 trong Booking.java) làm entity vừa là domain model vừa là view model — vi phạm SoC
3. Mỗi lần thêm field mới cho API → phải sửa Entity

**Remediation tối thiểu (cho project đồ án):** Tạo ít nhất `BookingResponse` và `UserResponse` DTO.

---

## III. LOGIC NGHIỆP VỤ & WORKFLOW

### BUG-011 🔴 BLOCKER — Checkout sửa trạng thái phòng thành `available` cứng, không check booking chồng chéo

**Vị trí:** [BookingApiController.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/api/BookingApiController.java) — `checkoutAdmin()` line 489-492

```java
if(room != null) {
    room.setStatus("available");
    roomRepository.save(room);
}
```

**Vấn đề:** Khi checkout phòng, code set cứng `available` mà không kiểm tra liệu phòng này đã có booking confirmed khác trong tương lai chưa. Điều này mâu thuẫn với ghi chú ở các chỗ khác: `// KHÔNG CẬP NHẬT TRẠNG THÁI BOOKED VẬT LÝ, HỆ THỐNG DÙNG DATE OVERLAP`.

**Tác động:** Nếu phòng đang ở trạng thái `maintenance` và bị checkout → bị chuyển sang `available` sai.

---

### BUG-012 🔴 BLOCKER — Race condition ở `expirePendingBookings` gọi trực tiếp trong controller

**Vị trí:** [BookingApiController.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/api/BookingApiController.java) — line 235

```java
bookingService.expirePendingBookings();
```

**Vấn đề:** Mỗi lần admin mở trang quản lý booking, method `expirePendingBookings()` được gọi đồng bộ. Nếu có nhiều admin mở cùng lúc → race condition khi update trạng thái.

**Ghi nhận tốt:** Backend cũng có `@Scheduled` cho việc này. Nhưng việc gọi thêm ở controller tạo ra duplicate execution paths.

---

### BUG-013 🟠 HIGH — `cancelBooking()` cho phép hủy booking đã có `deposit_paid`

**Vị trí:** [BookingService.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/service/BookingService.java) — `cancelBooking()` method

**Phân tích:** Khi khách đã đặt cọc 30% (paymentStatus = `deposit_paid`) và booking vẫn ở trạng thái `pending`, khách có thể tự hủy booking qua API. Tuy nhiên:
1. Không có logic **hoàn tiền** (refund)
2. Không có thông báo cho admin về booking đã cọc bị hủy
3. Coupon đã dùng sẽ bị release lại — nhưng tiền cọc thì mất

---

### BUG-014 🟠 HIGH — Công thức tính giá không nhất quán giữa `calculateBookingPriceAdmin` và `calculatePriceIndex`

**Vị trí:** [BookingService.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/service/BookingService.java)

**Phân tích:** Có **nhiều methods** tính giá:
- `calculatePriceIndex()` — dùng khi tạo booking
- `calculateBookingPriceAdmin()` — dùng khi admin edit
- `calculateSubtotal()` trong CouponService — dùng khi preview coupon

Mỗi method có logic tính khác nhau (tính theo giờ vs theo đêm). Nếu cùng một khoảng thời gian mà kết quả khác nhau → **sai tiền**.

---

### BUG-015 🟡 MEDIUM — Review entity không validate rating range

**Vị trí:** [Review.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/entity/Review.java) — line 25

```java
@Column(name = "rating", nullable = false)
private Integer rating;
```

**Vấn đề:** Không có `@Min(1) @Max(5)` hoặc validation logic. Client có thể gửi rating = -999 hoặc 0.

---

### BUG-016 🟡 MEDIUM — `parseDate()` xử lý date format thiếu chuẩn hóa

**Vị trí:** [BookingApiController.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/api/BookingApiController.java) — line 72-78

```java
if (dateStr.length() == 10) { dateStr += " 12:00"; }
```

**Vấn đề:** Nếu input chỉ có date (10 ký tự), default check-in time là **12:00 trưa**. Không rõ đây là convention của khách sạn hay chỉ là workaround. Giảng viên sẽ hỏi tại sao.

---

## IV. DATABASE & SCHEMA

### BUG-017 🟠 HIGH — Sử dụng `ddl-auto=update` trong production-like config

**Vị trí:** [application.properties](file:///e:/GOAT_HOTEL/backend/src/main/resources/application.properties)

**Vấn đề:**
1. `ddl-auto=update` sẽ tự alter table — không kiểm soát được thay đổi schema
2. Không có migration tool (Flyway/Liquibase) → không track schema version
3. SQL setup script (`goat_hotel_sqlserver_full_setup.sql`) và entity JPA có thể drift

---

### BUG-018 🟡 MEDIUM — Schema SQL vs Entity JPA không đồng bộ ở bảng `user_coupons`

**Vị trí:**
- SQL script (`goat_hotel_sqlserver_full_setup.sql` line 273-286): columns = `is_used`, `granted_at`
- [UserCoupon.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/entity/UserCoupon.java): columns = `status`, `source`, `note`, `assigned_at`, `expires_at`, `assigned_by_user_id`, `booking_id`

**Phân tích:** Entity Java có **nhiều columns hơn** so với SQL script. Vì dùng `ddl-auto=update`, JPA sẽ tự thêm columns khi chạy. Nhưng nếu dùng SQL script để init DB → **thiếu columns** → runtime error.

---

### BUG-019 🟡 MEDIUM — Schema SQL vs Entity JPA: bảng `bookings` thiếu nhiều columns

**Phân tích tương tự:**
- SQL script: columns = `id, user_id, total_price, status, payment_status, created_at, expires_at`
- Entity Java `Booking.java`: thêm `coupon_code`, `discount_amount`, `final_amount`

→ Init DB bằng SQL script sẽ thiếu 3 columns quan trọng cho tài chính.

---

### BUG-020 🟡 MEDIUM — Schema SQL vs Entity JPA: bảng `coupons` khác nhau

- SQL: `max_uses`, `current_uses`, `min_booking_value`
- Entity: `usage_limit`, `min_order_value`, `name`, `max_discount_amount`

→ Column names không khớp → `ddl-auto=update` sẽ tạo duplicate columns.

---

### BUG-021 🟡 MEDIUM — Dùng `FLOAT` cho tiền tệ

**Vị trí:** Toàn bộ columns tài chính (`price_per_night`, `total_price`, `amount`, `discount_value`...)

**Vấn đề:** `FLOAT` là floating-point, bị lỗi precision khi tính toán tiền. Ví dụ: `0.1 + 0.2 ≠ 0.3`.

**Chuẩn practice:** Dùng `DECIMAL(15,2)` cho tiền VND.

---

## V. API DESIGN

### BUG-022 🟠 HIGH — Không dùng typed DTO cho request body — dùng `Map<String, String>`

**Vị trí:** **Tất cả API endpoints** đều nhận `@RequestBody Map<String, String> payload`

```java
@PostMapping("/bookings")
public ResponseEntity<Map<String, Object>> bookRoom(@RequestBody Map<String, String> payload, HttpSession session)
```

**Vấn đề:**
1. Không có compile-time type safety
2. Không có Bean Validation (`@Valid`, `@NotBlank`, `@Size`)
3. Swagger/OpenAPI không thể generate docs chính xác
4. Phải parse thủ công mỗi field → boilerplate code, dễ NullPointerException

**Remediation:**
```java
public record BookRoomRequest(
    @NotNull Integer roomId,
    @NotBlank String checkIn,
    @NotBlank String checkOut,
    String paymentFlow,
    String couponCode
) {}
```

---

### BUG-023 🟡 MEDIUM — API response format không nhất quán

**Ví dụ:**
- `POST /api/bookings` → trả `{ success, message, bookingId, bookingStatus, ... }` (flat)
- `GET /api/bookings/{id}` → trả `{ success, booking: {...} }` (nested)
- `GET /api/admin/bookings` → trả `{ bookings: [...], totalPages, currentPage }` (no success field)

**Vấn đề:** Frontend phải xử lý 3+ format khác nhau → code khó maintain.

---

### BUG-024 🟡 MEDIUM — Pagination dùng page 1-based ở controller nhưng 0-based ở Spring Data

**Vị trí:** [BookingApiController.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/api/BookingApiController.java) — line 280

```java
PageRequest.of(page - 1, 5)  // convert từ 1-based sang 0-based
```

**Vấn đề:** Hardcode page size = 5. Không có tham số `pageSize` từ client. Nếu client gửi `page=0` → `PageRequest.of(-1, 5)` → Exception.

---

### BUG-025 🟡 MEDIUM — Admin admin booking filter fetch ALL rồi filter trong Java

**Vị trí:** [BookingApiController.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/api/BookingApiController.java) — line 260-264

```java
List<Booking> filteredBookings = bookingRepository.findAllAdminBookings(status.isBlank() ? null : status)
    .stream()
    .filter(booking -> overlapsBookingWindow(booking, from, to))
    .map(bookingService::normalizeBookingFinancials)
    .toList();
```

**Vấn đề:** Khi filter theo date range, code fetch **toàn bộ** bookings rồi filter in-memory. Với DB lớn → performance rất kém. Nên dùng query SQL `WHERE check_in < :to AND check_out > :from`.

---

## VI. FRONTEND & UI/UX

### BUG-026 🟠 HIGH — `OrderDetail.jsx` quá dài (1264 dòng) — vi phạm Single Responsibility

**Vị trí:** [OrderDetail.jsx](file:///e:/GOAT_HOTEL/frontend/src/pages/OrderDetail.jsx) — 1264 lines, 65KB

**Vấn đề:** Một file chứa:
- Status metadata (line 72-164)
- Timeline logic (line 166-187)
- Date formatting utils (line 12-70)
- API call handlers (line 205-527)
- Print layout CSS (line 531-640)
- Main render JSX (line 643-1264)

**Remediation:** Tách thành:
- `utils/dateFormat.js`
- `constants/bookingStatus.js`
- `components/BookingTimeline.jsx`
- `components/BookingPrintView.jsx`

---

### BUG-027 🟡 MEDIUM — Inline CSS trong JSX (670+ dòng `<style>`)

**Vị trí:** [OrderDetail.jsx](file:///e:/GOAT_HOTEL/frontend/src/pages/OrderDetail.jsx) — line 531-640

**Vấn đề:** 110 dòng CSS nằm trong `<style>` tag bên trong component render. Mỗi lần re-render → style tag được inject lại.

---

### BUG-028 🟡 MEDIUM — Sử dụng `window.Swal` global thay vì import chính thức

**Vị trí:** [OrderDetail.jsx](file:///e:/GOAT_HOTEL/frontend/src/pages/OrderDetail.jsx) — line 376, 447, 480, 501, etc.

```jsx
if (window.Swal) {
    window.Swal.fire({ ... });
}
```

**Vấn đề:**
1. SweetAlert2 được load qua CDN `<script>` tag thay vì `npm install sweetalert2`
2. Không có TypeScript typing → `window.Swal` có thể undefined
3. Giảng viên sẽ hỏi: "Tại sao không import qua package manager?"

---

### BUG-029 🟡 MEDIUM — `config.js` chứa 252 dòng — đang là "God File"

**Vị trí:** [config.js](file:///e:/GOAT_HOTEL/frontend/src/config.js)

**Nội dung thực tế:**
- API base URL
- Hàm tính số đêm
- Hàm tính tổng tiền booking
- Hàm resolve room type specs
- Hàm resolve image URL
- Hàm format icon

→ Nên tách thành `api.js`, `priceUtils.js`, `imageUtils.js`, `roomTypeSpecs.js`.

---

### BUG-030 🔵 LOW — Không có loading skeleton / error boundary

**Phân tích:** Khi API timeout hoặc trả lỗi, user thấy trang trắng hoặc spinner vĩnh viễn. Không có React Error Boundary nào.

---

## VII. TESTING & QUALITY

### BUG-031 🟠 HIGH — Không có unit tests

**Phân tích:** 
- `backend/src/test/` — không tìm thấy file test nào có nội dung
- `frontend/` — không có `__tests__/` hay file `.test.jsx`

**Tác động:** Giảng viên CNPM sẽ hỏi: "Nhóm dùng phương pháp test nào?". Không có test → không thể chứng minh code chạy đúng.

**Remediation tối thiểu:** Viết 5-10 unit test cho `BookingService` (tính giá, validate trạng thái, expire logic).

---

### BUG-032 🟠 HIGH — Password plaintext trong seed data & SQL script

**Vị trí:**
- `goat_hotel_sqlserver_full_setup.sql` line 352: `N'admin123'`
- `AdminDemoDataSeedRunner.java` line 90: `"admin123"`, `"demo123"`

**Vấn đề:** Khi đã fix BUG-001 (BCrypt), seed data cũng phải dùng hash. Nếu không → login sẽ fail.

---

### BUG-033 🟡 MEDIUM — `AdminDemoDataSeedRunner` chạy mỗi lần khởi động server

**Vị trí:** [AdminDemoDataSeedRunner.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/config/AdminDemoDataSeedRunner.java) — `implements CommandLineRunner`

**Vấn đề:** Mỗi lần `mvn spring-boot:run` → seed data lại chạy → có thể overwrite data đã thay đổi. Nên thêm flag `@ConditionalOnProperty(name = "app.seed-demo-data", havingValue = "true")`.

---

## VIII. CÁC VẤN ĐỀ KHÁC

### BUG-034 🔵 LOW — Comment code tiếng Việt không dấu xen lẫn có dấu, không nhất quán

**Ví dụ:**
- `BookingApiController.java` line 191: `"Da ghi nhan dat coc 30% va xac nhan booking."` (không dấu)
- `BookingApiController.java` line 219: `"Hủy phòng thành công"` (có dấu)

---

### BUG-035 🔵 LOW — CORS config hardcode localhost ports

**Vị trí:** [WebConfig.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/config/WebConfig.java)

```java
.allowedOrigins("http://localhost:5173", "http://localhost:3000")
```

**Ghi chú:** Đây là điều đã biết và chấp nhận cho môi trường dev.

---

### BUG-036 🔵 LOW — Booking entity dùng `@Transient` fields cho tài chính

**Vị trí:** [Booking.java](file:///e:/GOAT_HOTEL/backend/src/main/java/com/hotel/entity/Booking.java)

**Phân tích:** Các trường `depositAmount`, `paidAmount`, `remainingAmount` là `@Transient` — chỉ tồn tại trong memory, được tính bởi `normalizeBookingFinancials()`. Cách này hoạt động nhưng:
1. Nếu quên gọi `normalize` → trả về null/0
2. Không thể query trong DB (vì không có column)

---

### BUG-037 🔵 LOW — Upload file lưu trong `src/main/resources/static/` — sẽ mất khi build JAR

**Phân tích:** File upload (ảnh phòng, ảnh user) được lưu trong `classpath:/static/uploads/`. Khi đóng gói JAR → thư mục này nằm trong JAR → không thể write.

**Remediation:** Chuyển sang external directory (ví dụ: `./uploads/`) với `WebMvcConfig` serve static.

---

### BUG-038 🔵 LOW — `package.json` tên project là generic `"frontend"`

**Vị trí:** [package.json](file:///e:/GOAT_HOTEL/frontend/package.json) — line 2

```json
"name": "frontend"
```

**Remediation:** Đổi thành `"goat-hotel-frontend"`.

---

## 📋 Bảng Tổng Hợp — Sắp Xếp Theo Ưu Tiên Sửa

| # | Mức | Tóm tắt | File chính | Effort |
|---|-----|---------|-----------|--------|
| 001 | 🔴 | Plaintext password | AuthService | ~2h |
| 002 | 🔴 | Random thay vì SecureRandom | AuthApiController | ~5min |
| 003 | 🔴 | GlobalExceptionHandler leak info | GlobalExceptionHandler | ~30min |
| 011 | 🔴 | Checkout set available cứng | BookingApiController | ~30min |
| 012 | 🔴 | Race condition expire | BookingApiController | ~15min |
| 004 | 🟠 | Admin endpoints thiếu auth check | BookingApiController | ~1h |
| 005 | 🟠 | Credentials trong source | application.properties | ~30min |
| 006 | 🟠 | FE tự tính giá | config.js + OrderDetail | ~2h |
| 013 | 🟠 | Cancel booking đã cọc không refund | BookingService | ~1h |
| 014 | 🟠 | Tính giá không nhất quán | BookingService | ~2h |
| 017 | 🟠 | ddl-auto=update | application.properties | ~15min |
| 022 | 🟠 | Map<String,String> thay vì DTO | All controllers | ~4h |
| 031 | 🟠 | Không có unit tests | N/A | ~4h |
| 032 | 🟠 | Password trong seed data | SeedRunner + SQL | ~30min |
| 026 | 🟠 | OrderDetail.jsx 1264 dòng | OrderDetail.jsx | ~3h |
| 007 | 🟠 | location.state thay fetch | OrderDetail.jsx | ~30min |
| 008-009 | 🟡 | Dependency thừa | pom.xml | ~10min |
| 010 | 🟡 | Không có DTO | All entities | ~4h |
| 015 | 🟡 | Rating không validate | Review.java | ~10min |
| 016 | 🟡 | parseDate default 12:00 | BookingApiController | ~15min |
| 018-020 | 🟡 | SQL vs Entity drift | SQL + Entities | ~3h |
| 021 | 🟡 | FLOAT cho tiền | All tables | ~2h |
| 023-025 | 🟡 | API design issues | Controllers | ~2h |
| 027-029 | 🟡 | FE code quality | Frontend files | ~2h |
| 033 | 🟡 | Seed chạy mọi lần | SeedRunner | ~10min |
| 030,034-038 | 🔵 | Misc improvements | Various | ~2h |

---

## 🎯 Khuyến Nghị Ưu Tiên Cho Demo

Nếu chỉ có **1 ngày** trước demo, hãy sửa theo thứ tự này:

1. **BUG-001** — BCrypt password (bắt buộc — giảng viên sẽ kiểm tra DB)
2. **BUG-002** — SecureRandom (1 dòng sửa)
3. **BUG-003** — Fix GlobalExceptionHandler (không leak stacktrace)
4. **BUG-008/009** — Xóa dependency MySQL + Thymeleaf (2 dòng xóa)
5. **BUG-032** — Update seed data dùng BCrypt hash
6. **BUG-005** — Tách credentials ra `application-local.properties`
7. **BUG-031** — Viết 3-5 unit tests cơ bản cho `BookingService`

> [!IMPORTANT]
> Tất cả BLOCKER bugs nên được fix trước khi nộp. Các HIGH bugs nên được fix hoặc ít nhất **giải thích được** khi bị hỏi. MEDIUM/LOW có thể document lại như "Known limitations & future improvements" trong báo cáo.
