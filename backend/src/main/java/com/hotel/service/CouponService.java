package com.hotel.service;

import com.hotel.entity.Booking;
import com.hotel.entity.Coupon;
import com.hotel.entity.Room;
import com.hotel.entity.User;
import com.hotel.entity.UserCoupon;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.CouponRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.UserCouponRepository;
import com.hotel.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class CouponService {

    private static final Set<String> ALLOWED_DISCOUNT_TYPES = Set.of("FIXED", "PERCENT");
    private static final Set<String> MY_COUPON_FILTERS = Set.of("all", "available", "reserved", "used", "expired");
    private static final Set<String> HOLDER_FILTERS = Set.of("all", "available", "reserved", "used", "expired");

    private final CouponRepository couponRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final UserCouponRepository userCouponRepository;

    public CouponService(CouponRepository couponRepository,
                         RoomRepository roomRepository,
                         BookingRepository bookingRepository,
                         UserRepository userRepository,
                         UserCouponRepository userCouponRepository) {
        this.couponRepository = couponRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.userCouponRepository = userCouponRepository;
    }

    public record CouponPricingResult(
            boolean valid,
            String message,
            double subtotal,
            double discountAmount,
            double finalAmount,
            Coupon coupon,
            Integer userCouponId
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

    public Map<String, Object> buildMyCouponResponse(User currentUser, String status) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new IllegalArgumentException("Phien nguoi dung khong hop le.");
        }

        LocalDateTime now = LocalDateTime.now();
        String normalizedStatus = normalizeFilter(status, MY_COUPON_FILTERS);
        List<UserCoupon> coupons = synchronizeUserCoupons(userCouponRepository.findAllByUserIdWithCoupon(currentUser.getId()), now);

        Map<String, Long> summary = new HashMap<>();
        summary.put("all", 0L);
        summary.put("available", 0L);
        summary.put("reserved", 0L);
        summary.put("used", 0L);
        summary.put("expired", 0L);

        List<Map<String, Object>> mappedCoupons = new ArrayList<>();
        for (UserCoupon userCoupon : coupons) {
            String resolvedStatus = resolveDisplayUserCouponStatus(userCoupon, now);
            summary.put("all", summary.get("all") + 1);
            if (summary.containsKey(resolvedStatus)) {
                summary.put(resolvedStatus, summary.get(resolvedStatus) + 1);
            }
            if (!"all".equals(normalizedStatus) && !normalizedStatus.equals(resolvedStatus)) {
                continue;
            }
            mappedCoupons.add(toUserCouponResponse(userCoupon, now));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("coupons", mappedCoupons);
        response.put("summary", summary);
        response.put("status", normalizedStatus);
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

    public Map<String, Object> buildCouponHolderResponse(Integer couponId, String status) {
        Coupon coupon = couponRepository.findById(couponId)
                .map(this::enrichCoupon)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay coupon."));

        LocalDateTime now = LocalDateTime.now();
        String normalizedStatus = normalizeFilter(status, HOLDER_FILTERS);
        List<UserCoupon> holders = synchronizeUserCoupons(userCouponRepository.findAllByCouponIdWithHolder(couponId), now);

        Map<String, Long> summary = new HashMap<>();
        summary.put("all", 0L);
        summary.put("available", 0L);
        summary.put("reserved", 0L);
        summary.put("used", 0L);
        summary.put("expired", 0L);

        List<Map<String, Object>> rows = new ArrayList<>();
        for (UserCoupon holder : holders) {
            String resolvedStatus = resolveDisplayUserCouponStatus(holder, now);
            summary.put("all", summary.get("all") + 1);
            if (summary.containsKey(resolvedStatus)) {
                summary.put(resolvedStatus, summary.get(resolvedStatus) + 1);
            }
            if (!"all".equals(normalizedStatus) && !normalizedStatus.equals(resolvedStatus)) {
                continue;
            }
            rows.add(toCouponHolderResponse(holder, now));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("coupon", coupon);
        response.put("holders", rows);
        response.put("summary", summary);
        response.put("status", normalizedStatus);
        return response;
    }

    public List<Map<String, Object>> searchAssignableUsers(String search) {
        return userRepository.findWithSearch(search == null ? "" : search.trim(), PageRequest.of(0, 8))
                .getContent()
                .stream()
                .map(this::toMinimalUserResponse)
                .toList();
    }

    public Optional<Coupon> getCouponById(Integer id) {
        return couponRepository.findById(id).map(this::enrichCoupon);
    }

    public Coupon saveCoupon(Map<String, Object> payload, Integer couponId) {
        Coupon coupon;
        if (couponId != null) {
            coupon = couponRepository.findById(couponId)
                    .orElseThrow(() -> new IllegalArgumentException("Khong tim thay coupon."));
        } else {
            coupon = new Coupon();
        }

        String normalizedCode = normalizeCode(payload.get("code"));
        String name = requireText(payload.get("name"), "Ten coupon");
        String discountType = normalizeDiscountType(payload.get("discountType"));
        double discountValue = parsePositiveDouble(payload.get("discountValue"), "Gia tri giam");
        double minOrderValue = parseNonNegativeDouble(payload.get("minOrderValue"), "Don toi thieu");
        Double maxDiscountAmount = parseNullableNonNegativeDouble(payload.get("maxDiscountAmount"), "Giam toi da");
        LocalDateTime startDate = parseRequiredDateTime(payload.get("startDate"), "Thoi diem bat dau");
        LocalDateTime endDate = parseRequiredDateTime(payload.get("endDate"), "Thoi diem ket thuc");
        Integer usageLimit = parseNullablePositiveInteger(payload.get("usageLimit"), "Gioi han su dung");
        boolean isActive = parseBoolean(payload.get("isActive"), true);
        String description = payload.get("description") == null ? "" : payload.get("description").toString().trim();

        if (endDate.isBefore(startDate) || endDate.isEqual(startDate)) {
            throw new IllegalArgumentException("Thoi gian ket thuc phai sau thoi gian bat dau.");
        }

        if ("PERCENT".equals(discountType) && discountValue > 100) {
            throw new IllegalArgumentException("Coupon phan tram khong duoc vuot qua 100%.");
        }

        if ("FIXED".equals(discountType)) {
            maxDiscountAmount = null;
        } else if (maxDiscountAmount != null && maxDiscountAmount <= 0) {
            maxDiscountAmount = null;
        }

        Optional<Coupon> codeOwner = couponRepository.findByCodeIgnoreCase(normalizedCode);
        if (codeOwner.isPresent() && (coupon.getId() == null || !codeOwner.get().getId().equals(coupon.getId()))) {
            throw new IllegalArgumentException("Ma coupon nay da ton tai.");
        }

        if (coupon.getId() != null) {
            String existingCode = coupon.getCode();
            boolean hasBookings = existingCode != null && bookingRepository.countAllCouponUsages(existingCode) > 0;
            boolean hasAssignments = userCouponRepository.countByCoupon_Id(coupon.getId()) > 0;
            if (existingCode != null
                    && !existingCode.equalsIgnoreCase(normalizedCode)
                    && (hasBookings || hasAssignments)) {
                throw new IllegalArgumentException("Coupon da phat sinh du lieu nen khong the doi ma.");
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

        String targetEvent = payload.get("targetEvent") == null ? "DEFAULT" : payload.get("targetEvent").toString().trim().toUpperCase(Locale.ROOT);
        if (targetEvent.isBlank()) targetEvent = "DEFAULT";
        coupon.setTargetEvent(targetEvent);

        return enrichCoupon(couponRepository.save(coupon));
    }

    public Coupon toggleActive(Integer couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay coupon."));
        coupon.setIsActive(!Boolean.TRUE.equals(coupon.getIsActive()));
        return enrichCoupon(couponRepository.save(coupon));
    }

    public void deleteCoupon(Integer couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay coupon."));

        if (bookingRepository.countAllCouponUsages(coupon.getCode()) > 0 || userCouponRepository.countByCoupon_Id(couponId) > 0) {
            throw new IllegalArgumentException("Coupon da phat sinh booking hoac duoc cap cho nguoi dung nen khong the xoa.");
        }

        couponRepository.delete(coupon);
    }

    public UserCoupon assignCouponToUser(Integer couponId,
                                         Integer targetUserId,
                                         User assignedBy,
                                         LocalDateTime requestedExpiry,
                                         String note) {
        Coupon coupon = couponRepository.findById(couponId)
                .map(this::enrichCoupon)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay coupon."));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay nguoi dung."));

        LocalDateTime now = LocalDateTime.now();
        if (coupon.getEndDate() != null && !coupon.getEndDate().isAfter(now)) {
            throw new IllegalArgumentException("Coupon nay da het han nen khong the cap them.");
        }

        LocalDateTime effectiveExpiry = resolveAssignedExpiry(coupon, requestedExpiry, now);

        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setUser(targetUser);
        userCoupon.setCoupon(coupon);
        userCoupon.setAssignedBy(assignedBy);
        userCoupon.setSource("manual");
        userCoupon.setStatus("available");
        userCoupon.setNote(note == null ? null : note.trim());
        userCoupon.setAssignedAt(now);
        userCoupon.setExpiresAt(effectiveExpiry);
        userCoupon.setUsedAt(null);
        userCoupon.setBooking(null);
        return userCouponRepository.save(userCoupon);
    }

    public CouponPricingResult previewCoupon(Integer roomId,
                                             LocalDateTime checkIn,
                                             LocalDateTime checkOut,
                                             String couponCode) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Phong khong ton tai."));
        return evaluatePricing(room, checkIn, checkOut, null, null, couponCode, LocalDateTime.now(), true);
    }

    public CouponPricingResult previewCouponSelection(User user,
                                                      Integer roomId,
                                                      LocalDateTime checkIn,
                                                      LocalDateTime checkOut,
                                                      Integer userCouponId,
                                                      String couponCode) {
        return previewCouponSelection(user, roomId, checkIn, checkOut, userCouponId, couponCode, true);
    }

    public CouponPricingResult previewCouponSelection(User user,
                                                      Integer roomId,
                                                      LocalDateTime checkIn,
                                                      LocalDateTime checkOut,
                                                      Integer userCouponId,
                                                      String couponCode,
                                                      boolean couponRequired) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Phong khong ton tai."));
        return evaluatePricing(room, checkIn, checkOut, user, userCouponId, couponCode, LocalDateTime.now(), couponRequired);
    }

    public CouponPricingResult evaluatePricing(Room room,
                                               LocalDateTime checkIn,
                                               LocalDateTime checkOut,
                                               String couponCode,
                                               LocalDateTime now,
                                               boolean couponRequired) {
        return evaluatePricing(room, checkIn, checkOut, null, null, couponCode, now, couponRequired);
    }

    public CouponPricingResult evaluatePricing(Room room,
                                               LocalDateTime checkIn,
                                               LocalDateTime checkOut,
                                               User user,
                                               Integer userCouponId,
                                               String couponCode,
                                               LocalDateTime now,
                                               boolean couponRequired) {
        if (room == null || room.getRoomType() == null || room.getRoomType().getPricePerNight() == null) {
            throw new IllegalArgumentException("Phong chua co gia hop le de ap dung coupon.");
        }
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Khoang thoi gian booking khong hop le.");
        }

        double subtotal = calculateSubtotal(checkIn, checkOut, room.getRoomType().getPricePerNight());
        if (userCouponId != null) {
            if (user == null || user.getId() == null) {
                return new CouponPricingResult(false, "Vui long dang nhap de su dung coupon ca nhan.", subtotal, 0.0, subtotal, null, null);
            }

            UserCoupon userCoupon = userCouponRepository.findOwnedCoupon(userCouponId, user.getId())
                    .orElse(null);
            if (userCoupon == null) {
                return new CouponPricingResult(false, "Khong tim thay coupon ca nhan duoc chon.", subtotal, 0.0, subtotal, null, null);
            }

            userCoupon = synchronizeUserCoupon(userCoupon, now);
            Coupon coupon = enrichCoupon(userCoupon.getCoupon());
            userCoupon.setCoupon(coupon);

            String invalidUserCouponReason = resolveUserCouponInvalidReason(userCoupon, now);
            if (invalidUserCouponReason != null) {
                return new CouponPricingResult(false, invalidUserCouponReason, subtotal, 0.0, subtotal, coupon, null);
            }

            String invalidCouponReason = resolveCouponInvalidReason(coupon, subtotal, now);
            if (invalidCouponReason != null) {
                return new CouponPricingResult(false, invalidCouponReason, subtotal, 0.0, subtotal, coupon, null);
            }

            double discountAmount = calculateDiscountAmount(coupon, subtotal);
            double finalAmount = Math.max(0.0, subtotal - discountAmount);
            return new CouponPricingResult(true, "Ap dung coupon ca nhan thanh cong.", subtotal, discountAmount, finalAmount, coupon, userCoupon.getId());
        }

        String normalizedCode = normalizeOptionalCode(couponCode);
        if (normalizedCode == null) {
            if (couponRequired) {
                return new CouponPricingResult(false, "Vui long chon coupon truoc khi ap dung.", subtotal, 0.0, subtotal, null, null);
            }
            return new CouponPricingResult(true, "Khong ap dung ma giam gia.", subtotal, 0.0, subtotal, null, null);
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(normalizedCode)
                .orElse(null);
        if (coupon == null) {
            return new CouponPricingResult(false, "Ma giam gia khong ton tai.", subtotal, 0.0, subtotal, null, null);
        }

        coupon = enrichCoupon(coupon);
        String invalidReason = resolveCouponInvalidReason(coupon, subtotal, now);
        if (invalidReason != null) {
            return new CouponPricingResult(false, invalidReason, subtotal, 0.0, subtotal, coupon, null);
        }

        double discountAmount = calculateDiscountAmount(coupon, subtotal);
        double finalAmount = Math.max(0.0, subtotal - discountAmount);
        return new CouponPricingResult(true, "Ap dung ma giam gia thanh cong.", subtotal, discountAmount, finalAmount, coupon, null);
    }

    public void reserveUserCouponForBooking(Integer userCouponId, Booking booking, Integer currentUserId) {
        if (userCouponId == null || booking == null || booking.getId() == null || currentUserId == null) {
            return;
        }

        UserCoupon userCoupon = userCouponRepository.findOwnedCoupon(userCouponId, currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Coupon ca nhan khong ton tai hoac khong thuoc ve ban."));
        userCoupon = synchronizeUserCoupon(userCoupon, LocalDateTime.now());

        String invalidReason = resolveUserCouponInvalidReason(userCoupon, LocalDateTime.now());
        if (invalidReason != null) {
            throw new IllegalArgumentException(invalidReason);
        }

        userCoupon.setStatus("reserved");
        userCoupon.setBooking(booking);
        userCoupon.setUsedAt(null);
        userCouponRepository.save(userCoupon);
    }

    public void synchronizeCouponAssignments(List<Booking> bookings) {
        if (bookings == null || bookings.isEmpty()) {
            return;
        }
        for (Booking booking : bookings) {
            synchronizeCouponAssignment(booking);
        }
    }

    public void synchronizeCouponAssignment(Booking booking) {
        if (booking == null || booking.getId() == null) {
            return;
        }

        Optional<UserCoupon> linkedCouponOpt = userCouponRepository.findByBookingId(booking.getId());
        if (linkedCouponOpt.isEmpty()) {
            return;
        }

        UserCoupon linkedCoupon = linkedCouponOpt.get();
        String bookingStatus = normalizeBookingStatus(booking.getStatus());
        String paymentStatus = normalizePaymentStatus(booking.getPaymentStatus());

        if ("paid".equals(paymentStatus) || "deposit_paid".equals(paymentStatus) || "completed".equals(bookingStatus)) {
            linkedCoupon.setStatus("used");
            linkedCoupon.setBooking(booking);
            if (linkedCoupon.getUsedAt() == null) {
                linkedCoupon.setUsedAt(LocalDateTime.now());
            }
            userCouponRepository.save(linkedCoupon);
            return;
        }

        if ("cancelled".equals(bookingStatus) || "expired".equals(bookingStatus)) {
            linkedCoupon.setStatus("available");
            linkedCoupon.setBooking(null);
            linkedCoupon.setUsedAt(null);
            if (isExpiredByTime(linkedCoupon, LocalDateTime.now())) {
                linkedCoupon.setStatus("expired");
            }
            userCouponRepository.save(linkedCoupon);
            return;
        }

        if ("pending".equals(bookingStatus) || "confirmed".equals(bookingStatus)) {
            linkedCoupon.setStatus("reserved");
            linkedCoupon.setBooking(booking);
            linkedCoupon.setUsedAt(null);
            userCouponRepository.save(linkedCoupon);
        }
    }

    public Coupon enrichCoupon(Coupon coupon) {
        if (coupon == null) {
            return null;
        }
        coupon.setCode(normalizeCode(coupon.getCode()));
        coupon.setUsedCount(bookingRepository.countActiveCouponUsages(coupon.getCode()));
        coupon.setAssignedCount(userCouponRepository.countByCoupon_Id(coupon.getId()));
        coupon.setAvailableAssignedCount(userCouponRepository.countByCoupon_IdAndStatusIgnoreCase(coupon.getId(), "available"));
        coupon.setUsedAssignedCount(userCouponRepository.countByCoupon_IdAndStatusIgnoreCase(coupon.getId(), "used"));
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
            return "Ma giam gia nay hien dang tam tat.";
        }
        if (coupon.getStartDate() != null && coupon.getStartDate().isAfter(now)) {
            return "Ma giam gia chua den thoi gian ap dung.";
        }
        if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(now)) {
            return "Ma giam gia da het han.";
        }
        if (coupon.getUsageLimit() != null
                && coupon.getUsageLimit() > 0
                && (coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) >= coupon.getUsageLimit()) {
            return "Ma giam gia da het luot su dung.";
        }
        if (subtotal < (coupon.getMinOrderValue() == null ? 0.0 : coupon.getMinOrderValue())) {
            return "Don dat phong chua dat gia tri toi thieu de ap dung ma.";
        }
        return null;
    }

    private String resolveUserCouponInvalidReason(UserCoupon userCoupon, LocalDateTime now) {
        if (userCoupon == null) {
            return "Khong tim thay coupon ca nhan.";
        }

        String status = normalizeUserCouponStatus(userCoupon.getStatus());
        if ("used".equals(status)) {
            return "Coupon ca nhan nay da duoc su dung truoc do.";
        }
        if ("reserved".equals(status)) {
            return "Coupon ca nhan nay dang gan voi mot booking khac.";
        }
        if ("revoked".equals(status)) {
            return "Coupon ca nhan nay da bi thu hoi.";
        }
        if ("expired".equals(status) || isExpiredByTime(userCoupon, now)) {
            return "Coupon ca nhan nay da het han.";
        }
        if (!"available".equals(status)) {
            return "Coupon ca nhan nay hien khong san sang de su dung.";
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
            throw new IllegalArgumentException("Ma coupon khong duoc de trong.");
        }
        return normalized;
    }

    private double calculateSubtotal(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerNight) {
        return BookingPricingCalculator.summarize(checkIn, checkOut, pricePerNight).total();
    }

    private long calculateStayNights(LocalDateTime checkIn, LocalDateTime checkOut) {
        return BookingPricingCalculator.calculateStayNights(checkIn, checkOut);
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
            throw new IllegalArgumentException("Loai coupon khong hop le.");
        }
        return normalized;
    }

    private String requireText(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException(label + " khong duoc de trong.");
        }
        return value.toString().trim();
    }

    private double parsePositiveDouble(Object value, String label) {
        double parsed = parseNonNegativeDouble(value, label);
        if (parsed <= 0) {
            throw new IllegalArgumentException(label + " phai lon hon 0.");
        }
        return parsed;
    }

    private double parseNonNegativeDouble(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException(label + " khong duoc de trong.");
        }
        try {
            double parsed = Double.parseDouble(value.toString());
            if (parsed < 0) {
                throw new IllegalArgumentException(label + " khong duoc am.");
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(label + " khong hop le.");
        }
    }

    private Double parseNullableNonNegativeDouble(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            double parsed = Double.parseDouble(value.toString());
            if (parsed < 0) {
                throw new IllegalArgumentException(label + " khong duoc am.");
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(label + " khong hop le.");
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
            throw new IllegalArgumentException(label + " khong hop le.");
        }
    }

    private LocalDateTime parseRequiredDateTime(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException(label + " khong duoc de trong.");
        }
        try {
            return LocalDateTime.parse(value.toString().trim().replace(" ", "T"));
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(label + " khong hop le.");
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

    private String normalizeFilter(String value, Set<String> allowedValues) {
        String normalized = value == null || value.isBlank()
                ? "all"
                : value.trim().toLowerCase(Locale.ROOT);
        return allowedValues.contains(normalized) ? normalized : "all";
    }

    private List<UserCoupon> synchronizeUserCoupons(List<UserCoupon> coupons, LocalDateTime now) {
        List<UserCoupon> changedCoupons = new ArrayList<>();
        for (UserCoupon coupon : coupons) {
            if (synchronizeUserCouponInMemory(coupon, now)) {
                changedCoupons.add(coupon);
            }
        }
        if (!changedCoupons.isEmpty()) {
            userCouponRepository.saveAll(changedCoupons);
        }
        return coupons;
    }

    private UserCoupon synchronizeUserCoupon(UserCoupon coupon, LocalDateTime now) {
        if (coupon == null) {
            return null;
        }
        if (synchronizeUserCouponInMemory(coupon, now)) {
            return userCouponRepository.save(coupon);
        }
        return coupon;
    }

    private boolean synchronizeUserCouponInMemory(UserCoupon coupon, LocalDateTime now) {
        if (coupon == null) {
            return false;
        }

        boolean changed = false;
        String currentStatus = normalizeUserCouponStatus(coupon.getStatus());
        if ("available".equals(currentStatus) && isExpiredByTime(coupon, now)) {
            coupon.setStatus("expired");
            coupon.setBooking(null);
            changed = true;
        }
        if ("reserved".equals(currentStatus) && coupon.getBooking() == null) {
            coupon.setStatus("available");
            changed = true;
        }
        if ("used".equals(currentStatus) && coupon.getUsedAt() == null) {
            coupon.setUsedAt(now);
            changed = true;
        }
        return changed;
    }

    private boolean isExpiredByTime(UserCoupon userCoupon, LocalDateTime now) {
        LocalDateTime effectiveExpiry = resolveEffectiveUserCouponExpiry(userCoupon);
        return effectiveExpiry != null && !effectiveExpiry.isAfter(now);
    }

    private LocalDateTime resolveEffectiveUserCouponExpiry(UserCoupon userCoupon) {
        if (userCoupon == null) {
            return null;
        }
        LocalDateTime personalExpiry = userCoupon.getExpiresAt();
        LocalDateTime templateExpiry = userCoupon.getCoupon() != null ? userCoupon.getCoupon().getEndDate() : null;
        if (personalExpiry == null) {
            return templateExpiry;
        }
        if (templateExpiry == null) {
            return personalExpiry;
        }
        return personalExpiry.isBefore(templateExpiry) ? personalExpiry : templateExpiry;
    }

    private String resolveDisplayUserCouponStatus(UserCoupon userCoupon, LocalDateTime now) {
        String status = normalizeUserCouponStatus(userCoupon.getStatus());
        if ("available".equals(status) && isExpiredByTime(userCoupon, now)) {
            return "expired";
        }
        return status;
    }

    private String normalizeUserCouponStatus(String status) {
        return status == null ? "available" : status.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeBookingStatus(String status) {
        return status == null ? "pending" : status.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePaymentStatus(String status) {
        return status == null ? "unpaid" : status.trim().toLowerCase(Locale.ROOT);
    }

    private LocalDateTime resolveAssignedExpiry(Coupon coupon, LocalDateTime requestedExpiry, LocalDateTime now) {
        LocalDateTime baseExpiry = coupon.getEndDate();
        LocalDateTime effectiveExpiry = requestedExpiry == null ? baseExpiry : requestedExpiry;
        if (effectiveExpiry == null) {
            throw new IllegalArgumentException("Coupon phai co han su dung hop le de cap cho nguoi dung.");
        }
        if (!effectiveExpiry.isAfter(now)) {
            throw new IllegalArgumentException("Han su dung coupon ca nhan phai nam trong tuong lai.");
        }
        if (baseExpiry != null && effectiveExpiry.isAfter(baseExpiry)) {
            return baseExpiry;
        }
        return effectiveExpiry;
    }

    private Map<String, Object> toUserCouponResponse(UserCoupon userCoupon, LocalDateTime now) {
        Coupon coupon = enrichCoupon(userCoupon.getCoupon());
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> couponPayload = new HashMap<>();
        couponPayload.put("id", coupon.getId());
        couponPayload.put("code", coupon.getCode());
        couponPayload.put("name", coupon.getName());
        couponPayload.put("description", coupon.getDescription() == null ? "" : coupon.getDescription());
        couponPayload.put("discountType", coupon.getDiscountType());
        couponPayload.put("discountValue", coupon.getDiscountValue());
        couponPayload.put("minOrderValue", coupon.getMinOrderValue());
        couponPayload.put("maxDiscountAmount", coupon.getMaxDiscountAmount());
        couponPayload.put("startDate", coupon.getStartDate());
        couponPayload.put("endDate", coupon.getEndDate());
        couponPayload.put("isActive", coupon.getIsActive());
        response.put("id", userCoupon.getId());
        response.put("status", resolveDisplayUserCouponStatus(userCoupon, now));
        response.put("source", userCoupon.getSource());
        response.put("note", userCoupon.getNote());
        response.put("assignedAt", userCoupon.getAssignedAt());
        response.put("expiresAt", resolveEffectiveUserCouponExpiry(userCoupon));
        response.put("usedAt", userCoupon.getUsedAt());
        response.put("bookingId", userCoupon.getBooking() != null ? userCoupon.getBooking().getId() : null);
        response.put("coupon", couponPayload);
        response.put("assignedBy", userCoupon.getAssignedBy() == null ? null : toMinimalUserResponse(userCoupon.getAssignedBy()));
        return response;
    }

    private Map<String, Object> toCouponHolderResponse(UserCoupon userCoupon, LocalDateTime now) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", userCoupon.getId());
        response.put("status", resolveDisplayUserCouponStatus(userCoupon, now));
        response.put("source", userCoupon.getSource());
        response.put("note", userCoupon.getNote());
        response.put("assignedAt", userCoupon.getAssignedAt());
        response.put("expiresAt", resolveEffectiveUserCouponExpiry(userCoupon));
        response.put("usedAt", userCoupon.getUsedAt());
        response.put("bookingId", userCoupon.getBooking() != null ? userCoupon.getBooking().getId() : null);
        response.put("user", toMinimalUserResponse(userCoupon.getUser()));
        response.put("assignedBy", userCoupon.getAssignedBy() == null ? null : toMinimalUserResponse(userCoupon.getAssignedBy()));
        return response;
    }

    private Map<String, Object> toMinimalUserResponse(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("fullName", user.getFullName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole());
        response.put("image", user.getImage());
        return response;
    }
}
