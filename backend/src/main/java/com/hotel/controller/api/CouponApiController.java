package com.hotel.controller.api;

import com.hotel.entity.Coupon;
import com.hotel.entity.CouponEventType;
import com.hotel.entity.User;
import com.hotel.repository.CouponEventTypeRepository;
import com.hotel.service.AuthService;
import com.hotel.service.CouponService;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

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
        return ResponseEntity.ok(couponService.buildPublicCouponResponse(status));
    }

    @GetMapping("/coupons/my")
    public ResponseEntity<Map<String, Object>> listMyCoupons(
            @RequestParam(defaultValue = "available") String status,
            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }
        return ResponseEntity.ok(couponService.buildMyCouponResponse(currentUser, status));
    }

    @PostMapping("/coupons/apply")
    public ResponseEntity<Map<String, Object>> applyCoupon(@RequestBody Map<String, String> payload, HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer roomId = Integer.parseInt(requireField(payload, "roomId", "Phong"));
            LocalDateTime checkIn = parseDate(requireField(payload, "checkIn", "Ngay nhan phong"));
            LocalDateTime checkOut = parseDate(requireField(payload, "checkOut", "Ngay tra phong"));
            Integer userCouponId = parseOptionalInteger(payload.get("userCouponId"));
            String couponCode = payload.get("couponCode");
            User currentUser = getSessionUser(session);

            CouponService.CouponPricingResult result = couponService.previewCouponSelection(
                    currentUser,
                    roomId,
                    checkIn,
                    checkOut,
                    userCouponId,
                    couponCode
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
        return ResponseEntity.ok(couponService.buildAdminCouponPage(q, status, Math.max(1, page), 8));
    }

    @GetMapping("/admin/coupons/{id}")
    public ResponseEntity<Map<String, Object>> getAdminCoupon(@PathVariable Integer id) {
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
            @PathVariable Integer id,
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
            @PathVariable Integer id,
            @RequestBody Map<String, String> payload,
            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isBackoffice(currentUser)) {
            return forbiddenResponse("Ban khong co quyen cap coupon ca nhan.");
        }

        try {
            Integer userId = Integer.parseInt(requireField(payload, "userId", "Nguoi dung"));
            LocalDateTime expiresAt = parseOptionalDate(payload.get("expiresAt"));
            String note = payload.get("note");
            var assignedCoupon = couponService.assignCouponToUser(id, userId, currentUser, expiresAt, note);

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
    public ResponseEntity<Map<String, Object>> createCoupon(@RequestBody Map<String, Object> payload,
                                                            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isAdmin(currentUser)) {
            return forbiddenResponse("Chi admin moi duoc tao coupon mau.");
        }
        return saveCoupon(payload, null, true);
    }

    @PutMapping("/admin/coupons/{id}")
    public ResponseEntity<Map<String, Object>> updateCoupon(@PathVariable Integer id,
                                                            @RequestBody Map<String, Object> payload,
                                                            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isAdmin(currentUser)) {
            return forbiddenResponse("Chi admin moi duoc cap nhat coupon mau.");
        }
        return saveCoupon(payload, id, false);
    }

    @PatchMapping("/admin/coupons/{id}/toggle-active")
    public ResponseEntity<Map<String, Object>> toggleActive(@PathVariable Integer id,
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
    public ResponseEntity<Map<String, Object>> deleteCoupon(@PathVariable Integer id,
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

    private ResponseEntity<Map<String, Object>> saveCoupon(Map<String, Object> payload, Integer id, boolean createMode) {
        try {
            Coupon coupon = couponService.saveCoupon(payload, id);
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

    private String requireField(Map<String, String> payload, String key, String label) {
        String value = payload.get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " khong duoc de trong.");
        }
        return value.trim();
    }

    private Integer parseOptionalInteger(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Ma coupon ca nhan khong hop le.");
        }
    }

    private LocalDateTime parseDate(String raw) {
        String normalized = raw.contains("T") ? raw.replace("T", " ") : raw;
        if (normalized.length() == 10) {
            normalized += " 12:00";
        }
        return LocalDateTime.parse(normalized, formatter);
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
    public ResponseEntity<Map<String, Object>> createEventType(@RequestBody Map<String, String> payload, HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isAdmin(currentUser)) {
            return forbiddenResponse("Chi admin moi duoc tao nhom su kien.");
        }
        String label = payload.get("label");
        if (label == null || label.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Ten nhom khong duoc de trong."));
        }
        String key = payload.get("eventKey");
        if (key == null || key.isBlank()) {
            key = label.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_").replaceAll("^_|_$", "");
        } else {
            key = key.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_");
        }
        if (eventTypeRepository.findByEventKeyIgnoreCase(key).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Ma nhom su kien da ton tai: " + key));
        }
        String icon = payload.getOrDefault("icon", "category");
        String color = payload.getOrDefault("color", "#6b7280");
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
    public ResponseEntity<Map<String, Object>> deleteEventType(@PathVariable Integer id, HttpSession session) {
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
}
