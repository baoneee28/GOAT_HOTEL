package com.hotel.controller.api;

import com.hotel.entity.Coupon;
import com.hotel.service.CouponService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CouponApiController {

    private final CouponService couponService;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public CouponApiController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping("/coupons")
    public ResponseEntity<Map<String, Object>> listCoupons(
            @RequestParam(defaultValue = "active") String status) {
        return ResponseEntity.ok(couponService.buildPublicCouponResponse(status));
    }

    @PostMapping("/coupons/apply")
    public ResponseEntity<Map<String, Object>> applyCoupon(@RequestBody Map<String, String> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer roomId = Integer.parseInt(requireField(payload, "roomId", "Phòng"));
            LocalDateTime checkIn = parseDate(requireField(payload, "checkIn", "Ngày nhận phòng"));
            LocalDateTime checkOut = parseDate(requireField(payload, "checkOut", "Ngày trả phòng"));
            String couponCode = requireField(payload, "couponCode", "Mã coupon");

            CouponService.CouponPricingResult result = couponService.previewCoupon(roomId, checkIn, checkOut, couponCode);
            response.put("success", true);
            response.put("valid", result.valid());
            response.put("message", result.message());
            response.put("subtotal", result.subtotal());
            response.put("discountAmount", result.discountAmount());
            response.put("finalAmount", result.finalAmount());
            response.put("coupon", result.coupon());
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
                        "message", "Không tìm thấy coupon."
                )));
    }

    @PostMapping("/admin/coupons")
    public ResponseEntity<Map<String, Object>> createCoupon(@RequestBody Map<String, Object> payload) {
        return saveCoupon(payload, null, true);
    }

    @PutMapping("/admin/coupons/{id}")
    public ResponseEntity<Map<String, Object>> updateCoupon(@PathVariable Integer id,
                                                            @RequestBody Map<String, Object> payload) {
        return saveCoupon(payload, id, false);
    }

    @PatchMapping("/admin/coupons/{id}/toggle-active")
    public ResponseEntity<Map<String, Object>> toggleActive(@PathVariable Integer id) {
        try {
            Coupon coupon = couponService.toggleActive(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", Boolean.TRUE.equals(coupon.getIsActive()) ? "Đã bật coupon." : "Đã tắt coupon.",
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
    public ResponseEntity<Map<String, Object>> deleteCoupon(@PathVariable Integer id) {
        try {
            couponService.deleteCoupon(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã xóa coupon."
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
                    "message", createMode ? "Đã tạo coupon thành công." : "Đã cập nhật coupon.",
                    "coupon", coupon
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }

    private String requireField(Map<String, String> payload, String key, String label) {
        String value = payload.get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " không được để trống.");
        }
        return value.trim();
    }

    private LocalDateTime parseDate(String raw) {
        String normalized = raw.contains("T") ? raw.replace("T", " ") : raw;
        if (normalized.length() == 10) {
            normalized += " 12:00";
        }
        return LocalDateTime.parse(normalized, formatter);
    }
}
