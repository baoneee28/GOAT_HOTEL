package com.hotel.service;

import com.hotel.entity.Coupon;
import com.hotel.entity.Room;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.CouponRepository;
import com.hotel.repository.RoomRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class CouponService {

    private static final Set<String> ALLOWED_DISCOUNT_TYPES = Set.of("FIXED", "PERCENT");

    private final CouponRepository couponRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;

    public CouponService(CouponRepository couponRepository,
                         RoomRepository roomRepository,
                         BookingRepository bookingRepository) {
        this.couponRepository = couponRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
    }

    public record CouponPricingResult(
            boolean valid,
            String message,
            double subtotal,
            double discountAmount,
            double finalAmount,
            Coupon coupon
    ) {
    }

    public Map<String, Object> buildPublicCouponResponse(String status) {
        LocalDateTime now = LocalDateTime.now();
        List<Coupon> coupons = enrichCoupons(couponRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));

        List<Coupon> filtered = coupons.stream()
                .filter(coupon -> matchesPublicStatusFilter(coupon, status, now))
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("coupons", filtered);
        response.put("status", status == null ? "all" : status);
        return response;
    }

    public Map<String, Object> buildAdminCouponPage(String search, String status, int page, int pageSize) {
        LocalDateTime now = LocalDateTime.now();
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<Coupon> coupons = enrichCoupons(couponRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))).stream()
                .filter(coupon -> normalizedSearch.isBlank() || matchesSearch(coupon, normalizedSearch))
                .filter(coupon -> matchesAdminStatusFilter(coupon, status, now))
                .toList();

        int safePageSize = Math.max(1, pageSize);
        int totalPages = Math.max(1, (int) Math.ceil((double) coupons.size() / safePageSize));
        int safePage = Math.min(Math.max(1, page), totalPages);
        int fromIndex = Math.min((safePage - 1) * safePageSize, coupons.size());
        int toIndex = Math.min(fromIndex + safePageSize, coupons.size());

        Map<String, Object> response = new HashMap<>();
        response.put("coupons", coupons.subList(fromIndex, toIndex));
        response.put("totalPages", totalPages);
        response.put("currentPage", safePage);
        response.put("search", search == null ? "" : search);
        response.put("status", status == null ? "all" : status);
        return response;
    }

    public Optional<Coupon> getCouponById(Integer id) {
        return couponRepository.findById(id).map(this::enrichCoupon);
    }

    public Coupon saveCoupon(Map<String, Object> payload, Integer couponId) {
        Coupon coupon;
        if (couponId != null) {
            coupon = couponRepository.findById(couponId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy coupon."));
        } else {
            coupon = new Coupon();
        }

        String normalizedCode = normalizeCode(payload.get("code"));
        String name = requireText(payload.get("name"), "Tên coupon");
        String discountType = normalizeDiscountType(payload.get("discountType"));
        double discountValue = parsePositiveDouble(payload.get("discountValue"), "Giá trị giảm");
        double minOrderValue = parseNonNegativeDouble(payload.get("minOrderValue"), "Đơn tối thiểu");
        Double maxDiscountAmount = parseNullableNonNegativeDouble(payload.get("maxDiscountAmount"), "Giảm tối đa");
        LocalDateTime startDate = parseRequiredDateTime(payload.get("startDate"), "Thời điểm bắt đầu");
        LocalDateTime endDate = parseRequiredDateTime(payload.get("endDate"), "Thời điểm kết thúc");
        Integer usageLimit = parseNullablePositiveInteger(payload.get("usageLimit"), "Giới hạn sử dụng");
        boolean isActive = parseBoolean(payload.get("isActive"), true);
        String description = payload.get("description") == null ? "" : payload.get("description").toString().trim();

        if (endDate.isBefore(startDate) || endDate.isEqual(startDate)) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }

        if ("PERCENT".equals(discountType) && discountValue > 100) {
            throw new IllegalArgumentException("Coupon phần trăm không được vượt quá 100%.");
        }

        if ("FIXED".equals(discountType)) {
            maxDiscountAmount = null;
        } else if (maxDiscountAmount != null && maxDiscountAmount <= 0) {
            maxDiscountAmount = null;
        }

        Optional<Coupon> codeOwner = couponRepository.findByCodeIgnoreCase(normalizedCode);
        if (codeOwner.isPresent() && (coupon.getId() == null || !codeOwner.get().getId().equals(coupon.getId()))) {
            throw new IllegalArgumentException("Mã coupon này đã tồn tại.");
        }

        if (coupon.getId() != null) {
            String existingCode = coupon.getCode();
            if (existingCode != null
                    && !existingCode.equalsIgnoreCase(normalizedCode)
                    && bookingRepository.countAllCouponUsages(existingCode) > 0) {
                throw new IllegalArgumentException("Coupon đã phát sinh booking nên không thể đổi mã.");
            }
        }

        coupon.setCode(normalizedCode);
        coupon.setName(name);
        coupon.setDescription(description);
        coupon.setDiscountType(discountType);
        coupon.setDiscountValue(discountValue);
        coupon.setMinOrderValue(minOrderValue);
        coupon.setMaxDiscountAmount(maxDiscountAmount);
        coupon.setStartDate(startDate);
        coupon.setEndDate(endDate);
        coupon.setUsageLimit(usageLimit);
        coupon.setIsActive(isActive);

        return enrichCoupon(couponRepository.save(coupon));
    }

    public Coupon toggleActive(Integer couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy coupon."));
        coupon.setIsActive(!Boolean.TRUE.equals(coupon.getIsActive()));
        return enrichCoupon(couponRepository.save(coupon));
    }

    public void deleteCoupon(Integer couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy coupon."));

        if (bookingRepository.countAllCouponUsages(coupon.getCode()) > 0) {
            throw new IllegalArgumentException("Coupon đã phát sinh booking nên không thể xóa.");
        }

        couponRepository.delete(coupon);
    }

    public CouponPricingResult previewCoupon(Integer roomId,
                                             LocalDateTime checkIn,
                                             LocalDateTime checkOut,
                                             String couponCode) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng không tồn tại."));
        return evaluatePricing(room, checkIn, checkOut, couponCode, LocalDateTime.now(), true);
    }

    public CouponPricingResult evaluatePricing(Room room,
                                               LocalDateTime checkIn,
                                               LocalDateTime checkOut,
                                               String couponCode,
                                               LocalDateTime now,
                                               boolean couponRequired) {
        if (room == null || room.getRoomType() == null || room.getRoomType().getPricePerNight() == null) {
            throw new IllegalArgumentException("Phòng chưa có giá hợp lệ để áp dụng coupon.");
        }
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Khoảng thời gian booking không hợp lệ.");
        }

        double subtotal = calculateSubtotal(checkIn, checkOut, room.getRoomType().getPricePerNight());
        String normalizedCode = normalizeOptionalCode(couponCode);
        if (normalizedCode == null) {
            if (couponRequired) {
                return new CouponPricingResult(false, "Vui lòng nhập mã giảm giá.", subtotal, 0.0, subtotal, null);
            }
            return new CouponPricingResult(true, "Không áp dụng mã giảm giá.", subtotal, 0.0, subtotal, null);
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(normalizedCode)
                .orElse(null);
        if (coupon == null) {
            return new CouponPricingResult(false, "Mã giảm giá không tồn tại.", subtotal, 0.0, subtotal, null);
        }

        coupon = enrichCoupon(coupon);
        String invalidReason = resolveCouponInvalidReason(coupon, subtotal, now);
        if (invalidReason != null) {
            return new CouponPricingResult(false, invalidReason, subtotal, 0.0, subtotal, coupon);
        }

        double discountAmount = calculateDiscountAmount(coupon, subtotal);
        double finalAmount = Math.max(0.0, subtotal - discountAmount);

        return new CouponPricingResult(
                true,
                "Áp dụng mã giảm giá thành công.",
                subtotal,
                discountAmount,
                finalAmount,
                coupon
        );
    }

    public Coupon enrichCoupon(Coupon coupon) {
        if (coupon == null) {
            return null;
        }
        coupon.setCode(normalizeCode(coupon.getCode()));
        coupon.setUsedCount(bookingRepository.countActiveCouponUsages(coupon.getCode()));
        return coupon;
    }

    public List<Coupon> enrichCoupons(List<Coupon> coupons) {
        return coupons.stream().map(this::enrichCoupon).toList();
    }

    private boolean matchesSearch(Coupon coupon, String search) {
        return containsIgnoreCase(coupon.getCode(), search)
                || containsIgnoreCase(coupon.getName(), search)
                || containsIgnoreCase(coupon.getDescription(), search);
    }

    private boolean containsIgnoreCase(String value, String search) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(search);
    }

    private boolean matchesPublicStatusFilter(Coupon coupon, String status, LocalDateTime now) {
        String normalizedStatus = status == null ? "all" : status.trim().toLowerCase(Locale.ROOT);
        String couponState = resolveCouponState(coupon, now);
        return switch (normalizedStatus) {
            case "", "all" -> true;
            case "active" -> "active".equals(couponState);
            case "expiring" -> isExpiringSoon(coupon, now);
            default -> true;
        };
    }

    private boolean matchesAdminStatusFilter(Coupon coupon, String status, LocalDateTime now) {
        String normalizedStatus = status == null ? "all" : status.trim().toLowerCase(Locale.ROOT);
        String couponState = resolveCouponState(coupon, now);
        return switch (normalizedStatus) {
            case "", "all" -> true;
            case "active" -> "active".equals(couponState);
            case "inactive" -> "inactive".equals(couponState);
            case "expired" -> "expired".equals(couponState);
            case "scheduled" -> "scheduled".equals(couponState);
            default -> true;
        };
    }

    private String resolveCouponState(Coupon coupon, LocalDateTime now) {
        if (coupon == null) {
            return "inactive";
        }
        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            return "inactive";
        }
        long usedCount = coupon.getUsedCount() == null ? 0 : coupon.getUsedCount();
        if (coupon.getUsageLimit() != null && coupon.getUsageLimit() > 0 && usedCount >= coupon.getUsageLimit()) {
            return "exhausted";
        }
        if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(now)) {
            return "expired";
        }
        if (coupon.getStartDate() != null && coupon.getStartDate().isAfter(now)) {
            return "scheduled";
        }
        return "active";
    }

    private boolean isExpiringSoon(Coupon coupon, LocalDateTime now) {
        return "active".equals(resolveCouponState(coupon, now))
                && coupon.getEndDate() != null
                && !coupon.getEndDate().isBefore(now)
                && coupon.getEndDate().isBefore(now.plusDays(7));
    }

    private String resolveCouponInvalidReason(Coupon coupon, double subtotal, LocalDateTime now) {
        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            return "Mã giảm giá này hiện đang tạm tắt.";
        }
        if (coupon.getStartDate() != null && coupon.getStartDate().isAfter(now)) {
            return "Mã giảm giá chưa đến thời gian áp dụng.";
        }
        if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(now)) {
            return "Mã giảm giá đã hết hạn.";
        }
        if (coupon.getUsageLimit() != null
                && coupon.getUsageLimit() > 0
                && (coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) >= coupon.getUsageLimit()) {
            return "Mã giảm giá đã hết lượt sử dụng.";
        }
        if (subtotal < (coupon.getMinOrderValue() == null ? 0.0 : coupon.getMinOrderValue())) {
            return "Đơn đặt phòng chưa đạt giá trị tối thiểu để áp dụng mã.";
        }
        return null;
    }

    private double calculateDiscountAmount(Coupon coupon, double subtotal) {
        if (coupon == null) {
            return 0.0;
        }

        double discountAmount;
        if ("PERCENT".equalsIgnoreCase(coupon.getDiscountType())) {
            discountAmount = subtotal * (coupon.getDiscountValue() == null ? 0.0 : coupon.getDiscountValue()) / 100.0;
            if (coupon.getMaxDiscountAmount() != null && coupon.getMaxDiscountAmount() > 0) {
                discountAmount = Math.min(discountAmount, coupon.getMaxDiscountAmount());
            }
        } else {
            discountAmount = coupon.getDiscountValue() == null ? 0.0 : coupon.getDiscountValue();
        }

        discountAmount = Math.max(0.0, discountAmount);
        return Math.min(subtotal, discountAmount);
    }

    private String normalizeCode(Object value) {
        String normalized = normalizeOptionalCode(value);
        if (normalized == null) {
            throw new IllegalArgumentException("Mã coupon không được để trống.");
        }
        return normalized;
    }

    private double calculateSubtotal(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerNight) {
        long nights = calculateStayNights(checkIn, checkOut);
        return Math.round(nights * pricePerNight);
    }

    private long calculateStayNights(LocalDateTime checkIn, LocalDateTime checkOut) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            return 0;
        }

        long nights = java.time.temporal.ChronoUnit.DAYS.between(checkIn.toLocalDate(), checkOut.toLocalDate());
        return Math.max(1, nights);
    }

    private String normalizeOptionalCode(Object value) {
        if (value == null) {
            return null;
        }
        String normalized = value.toString().trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "");
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeDiscountType(Object value) {
        String normalized = value == null ? "" : value.toString().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_DISCOUNT_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Loại coupon không hợp lệ.");
        }
        return normalized;
    }

    private String requireText(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException(label + " không được để trống.");
        }
        return value.toString().trim();
    }

    private double parsePositiveDouble(Object value, String label) {
        double parsed = parseNonNegativeDouble(value, label);
        if (parsed <= 0) {
            throw new IllegalArgumentException(label + " phải lớn hơn 0.");
        }
        return parsed;
    }

    private double parseNonNegativeDouble(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException(label + " không được để trống.");
        }
        try {
            double parsed = Double.parseDouble(value.toString());
            if (parsed < 0) {
                throw new IllegalArgumentException(label + " không được âm.");
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(label + " không hợp lệ.");
        }
    }

    private Double parseNullableNonNegativeDouble(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            double parsed = Double.parseDouble(value.toString());
            if (parsed < 0) {
                throw new IllegalArgumentException(label + " không được âm.");
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(label + " không hợp lệ.");
        }
    }

    private Integer parseNullablePositiveInteger(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            int parsed = Integer.parseInt(value.toString());
            if (parsed <= 0) {
                return null;
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(label + " không hợp lệ.");
        }
    }

    private LocalDateTime parseRequiredDateTime(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException(label + " không được để trống.");
        }
        try {
            return LocalDateTime.parse(value.toString().trim().replace(" ", "T"));
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(label + " không hợp lệ.");
        }
    }

    private boolean parseBoolean(Object value, boolean fallback) {
        if (value == null) {
            return fallback;
        }
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        return Boolean.parseBoolean(value.toString());
    }
}
