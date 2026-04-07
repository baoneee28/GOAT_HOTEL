package com.hotel.controller.api;

import com.hotel.dto.CouponApplyRequest;
import com.hotel.dto.CouponAssignmentRequest;
import com.hotel.dto.CouponEventTypeCreateRequest;
import com.hotel.dto.CouponUpsertRequest;
import com.hotel.entity.Coupon;
import com.hotel.entity.CouponEventType;
import com.hotel.entity.User;
import com.hotel.repository.CouponEventTypeRepository;
import com.hotel.service.AuthService;
import com.hotel.service.CouponService;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class CouponApiController {

    private final CouponService couponService;
    private final AuthService authService;
    private final CouponEventTypeRepository eventTypeRepository;
    private static final LocalTime DEFAULT_CHECK_IN_TIME = LocalTime.of(14, 0);
    private static final LocalTime DEFAULT_CHECK_OUT_TIME = LocalTime.of(12, 0);

    public CouponApiController(CouponService couponService, AuthService authService, CouponEventTypeRepository eventTypeRepository) {
        this.couponService = couponService;
        this.authService = authService;
        this.eventTypeRepository = eventTypeRepository;
    }

    @PostConstruct
    public void seedDefaultEventTypes() {
        seedEventIfMissing("DEFAULT", "Mặc định (Cấp thủ công)", "loyalty", "#6b7280", 0, true);
        seedEventIfMissing("ON_REVIEW", "Tự động tặng sau Review", "reviews", "#f59e0b", 1, true);
        seedEventIfMissing("WEEKEND", "Khuyến mãi Cuối tuần", "weekend", "#3b82f6", 2, true);
    }

    private void seedEventIfMissing(String key, String label, String icon, String color, int order, boolean isSystem) {
        Optional<CouponEventType> opt = eventTypeRepository.findByEventKeyIgnoreCase(key);
        CouponEventType e = opt.orElse(new CouponEventType());
        e.setEventKey(key);
        e.setLabel(label);
        e.setIcon(icon);
        e.setColor(color);
        if (e.getId() == null) {
            e.setSortOrder(order);
        }
        e.setIsSystem(isSystem);
        eventTypeRepository.save(e);
    }

    @GetMapping("/coupons")
    public ResponseEntity<Map<String, Object>> listCoupons(
            @RequestParam(defaultValue = "active") String status) {
        Map<String, Object> response = new HashMap<>(couponService.buildPublicCouponResponse(status));
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/coupons/my")
    public ResponseEntity<Map<String, Object>> listMyCoupons(
            @RequestParam(defaultValue = "available") String status,
            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }
        Map<String, Object> response = new HashMap<>(couponService.buildMyCouponResponse(currentUser, status));
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/coupons/apply")
    public ResponseEntity<Map<String, Object>> applyCoupon(@Valid @RequestBody CouponApplyRequest request, HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        try {
            LocalDateTime checkIn = parseStayDate(request.checkIn(), DEFAULT_CHECK_IN_TIME, "Ngay nhan phong");
            LocalDateTime checkOut = parseStayDate(request.checkOut(), DEFAULT_CHECK_OUT_TIME, "Ngay tra phong");
            User currentUser = getSessionUser(session);
            boolean couponRequired = request.userCouponId() != null
                    || (request.couponCode() != null && !request.couponCode().isBlank());

            CouponService.CouponPricingResult result = couponService.previewCouponSelection(
                    currentUser,
                    request.roomId(),
                    checkIn,
                    checkOut,
                    request.userCouponId(),
                    request.couponCode(),
                    couponRequired
            );
            response.put("success", true);
            response.put("valid", result.valid());
            response.put("message", result.message());
            response.put("subtotal", result.subtotal());
            response.put("discountAmount", result.discountAmount());
            response.put("finalAmount", result.finalAmount());
            response.put("coupon", result.coupon());
            response.put("userCouponId", result.userCouponId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            response.put("success", false);
            response.put("message", ex.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/admin/coupons")
    public ResponseEntity<Map<String, Object>> listAdminCoupons(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "1") int page) {
        Map<String, Object> response = new HashMap<>(couponService.buildAdminCouponPage(q, status, Math.max(1, page), 8));
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/coupons/{id}")
    public ResponseEntity<Map<String, Object>> getAdminCoupon(@PathVariable @NonNull Integer id) {
        return couponService.getCouponById(id)
                .map(coupon -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "coupon", coupon
                )))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of(
                        "success", false,
                        "message", "Khong tim thay coupon."
                )));
    }

    @GetMapping("/admin/coupons/{id}/holders")
    public ResponseEntity<Map<String, Object>> getCouponHolders(
            @PathVariable @NonNull Integer id,
            @RequestParam(defaultValue = "all") String status) {
        try {
            return ResponseEntity.ok(couponService.buildCouponHolderResponse(id, status));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }

    @GetMapping("/admin/coupons/users/search")
    public ResponseEntity<Map<String, Object>> searchAssignableUsers(
            @RequestParam(defaultValue = "") String q,
            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isBackoffice(currentUser)) {
            return forbiddenResponse("Ban khong co quyen cap coupon ca nhan.");
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "users", couponService.searchAssignableUsers(q)
        ));
    }

    @PostMapping("/admin/coupons/{id}/assignments")
    public ResponseEntity<Map<String, Object>> assignCouponToUser(
            @PathVariable @NonNull Integer id,
            @Valid @RequestBody CouponAssignmentRequest request,
            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isBackoffice(currentUser)) {
            return forbiddenResponse("Ban khong co quyen cap coupon ca nhan.");
        }

        try {
            LocalDateTime expiresAt = parseOptionalDate(request.expiresAt());
            var assignedCoupon = couponService.assignCouponToUser(id, request.userId(), currentUser, expiresAt, request.note());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Da cap coupon ca nhan cho nguoi dung.");
            response.put("userCouponId", assignedCoupon.getId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }

    @PostMapping("/admin/coupons")
    public ResponseEntity<Map<String, Object>> createCoupon(@Valid @RequestBody CouponUpsertRequest request,
                                                            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isAdmin(currentUser)) {
            return forbiddenResponse("Chi admin moi duoc tao coupon mau.");
        }
        return saveCoupon(request, null, true);
    }

    @PutMapping("/admin/coupons/{id}")
    public ResponseEntity<Map<String, Object>> updateCoupon(@PathVariable @NonNull Integer id,
                                                            @Valid @RequestBody CouponUpsertRequest request,
                                                            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isAdmin(currentUser)) {
            return forbiddenResponse("Chi admin moi duoc cap nhat coupon mau.");
        }
        return saveCoupon(request, id, false);
    }

    @PatchMapping("/admin/coupons/{id}/toggle-active")
    public ResponseEntity<Map<String, Object>> toggleActive(@PathVariable @NonNull Integer id,
                                                            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isAdmin(currentUser)) {
            return forbiddenResponse("Chi admin moi duoc bat hoac tat coupon mau.");
        }
        try {
            Coupon coupon = couponService.toggleActive(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", Boolean.TRUE.equals(coupon.getIsActive()) ? "Da bat coupon." : "Da tat coupon.",
                    "coupon", coupon
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }

    @DeleteMapping("/admin/coupons/{id}")
    public ResponseEntity<Map<String, Object>> deleteCoupon(@PathVariable @NonNull Integer id,
                                                            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isAdmin(currentUser)) {
            return forbiddenResponse("Chi admin moi duoc xoa coupon mau.");
        }
        try {
            couponService.deleteCoupon(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Da xoa coupon."
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }

    private ResponseEntity<Map<String, Object>> saveCoupon(CouponUpsertRequest request, Integer id, boolean createMode) {
        try {
            Coupon coupon = couponService.saveCoupon(toCouponPayload(request), id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", createMode ? "Da tao coupon thanh cong." : "Da cap nhat coupon.",
                    "coupon", coupon
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }

    private User getSessionUser(HttpSession session) {
        Object userObj = session.getAttribute("user");
        return userObj instanceof User ? (User) userObj : null;
    }

    private ResponseEntity<Map<String, Object>> authRequiredResponse() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "success", false,
                "message", "Vui long dang nhap de tiep tuc."
        ));
    }

    private ResponseEntity<Map<String, Object>> forbiddenResponse(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "success", false,
                "message", message
        ));
    }

    private LocalDateTime parseStayDate(String raw, LocalTime defaultTime, String label) {
        String normalized = raw == null ? "" : raw.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException(label + " khong hop le.");
        }
        try {
            if (normalized.length() == 10) {
                return LocalDate.parse(normalized).atTime(defaultTime);
            }
            if (normalized.contains(" ")) {
                normalized = normalized.replace(" ", "T");
            }
            return LocalDateTime.parse(normalized);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(label + " khong hop le.");
        }
    }

    private LocalDateTime parseDate(String raw) {
        return parseStayDate(raw, LocalTime.of(12, 0), "Thoi diem");
    }

    private LocalDateTime parseOptionalDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return parseDate(raw);
    }

    // ── COUPON EVENT TYPES ──

    @GetMapping("/admin/coupon-events")
    public ResponseEntity<Map<String, Object>> listEventTypes() {
        List<CouponEventType> events = eventTypeRepository.findAllByOrderBySortOrderAscIdAsc();
        return ResponseEntity.ok(Map.of("success", true, "events", events));
    }

    @PostMapping("/admin/coupon-events")
    public ResponseEntity<Map<String, Object>> createEventType(@Valid @RequestBody CouponEventTypeCreateRequest request, HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isAdmin(currentUser)) {
            return forbiddenResponse("Chi admin moi duoc tao nhom su kien.");
        }
        String label = request.label().trim();
        String key = request.eventKey();
        if (key == null || key.isBlank()) {
            key = label.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_").replaceAll("^_|_$", "");
        } else {
            key = key.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_");
        }
        if (eventTypeRepository.findByEventKeyIgnoreCase(key).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Ma nhom su kien da ton tai: " + key));
        }
        String icon = request.icon().trim();
        String color = request.color().trim();
        int maxOrder = eventTypeRepository.findAllByOrderBySortOrderAscIdAsc().stream().mapToInt(e -> e.getSortOrder() == null ? 0 : e.getSortOrder()).max().orElse(0);

        CouponEventType eventType = new CouponEventType();
        eventType.setEventKey(key);
        eventType.setLabel(label.trim());
        eventType.setIcon(icon.trim());
        eventType.setColor(color.trim());
        eventType.setSortOrder(maxOrder + 1);
        eventType.setIsSystem(false);
        eventTypeRepository.save(eventType);
        return ResponseEntity.ok(Map.of("success", true, "message", "Da tao nhom su kien moi.", "event", eventType));
    }

    @DeleteMapping("/admin/coupon-events/{id}")
    public ResponseEntity<Map<String, Object>> deleteEventType(@PathVariable @NonNull Integer id, HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isAdmin(currentUser)) {
            return forbiddenResponse("Chi admin moi duoc xoa nhom su kien.");
        }
        CouponEventType eventType = eventTypeRepository.findById(id).orElse(null);
        if (eventType == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Khong tim thay nhom su kien."));
        }
        if (Boolean.TRUE.equals(eventType.getIsSystem())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Khong the xoa nhom he thong."));
        }
        eventTypeRepository.delete(eventType);
        return ResponseEntity.ok(Map.of("success", true, "message", "Da xoa nhom su kien."));
    }

    private Map<String, Object> toCouponPayload(CouponUpsertRequest request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("code", request.code());
        payload.put("name", request.name());
        payload.put("description", request.description());
        payload.put("discountType", request.discountType());
        payload.put("targetEvent", request.targetEvent());
        payload.put("discountValue", request.discountValue());
        payload.put("minOrderValue", request.minOrderValue());
        payload.put("maxDiscountAmount", request.maxDiscountAmount());
        payload.put("startDate", request.startDate());
        payload.put("endDate", request.endDate());
        payload.put("usageLimit", request.usageLimit());
        payload.put("isActive", request.isActive());
        return payload;
    }
}
