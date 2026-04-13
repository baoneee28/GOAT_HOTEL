package com.hotel.service;

import com.hotel.entity.Booking;
import com.hotel.entity.BookingDetail;
import com.hotel.entity.Coupon;
import com.hotel.entity.Room;
import com.hotel.entity.User;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.PaymentRepository;
import com.hotel.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class BookingService {

    private static final DateTimeFormatter HOLD_UNTIL_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
    private static final int HISTORY_PAGE_SIZE = 5;

    @Value("${booking.pending-hold-seconds:180}")
    private long pendingHoldSeconds;

    @Value("${booking.deposit-ratio:0.3}")
    private double bookingDepositRatio;

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private BookingDetailRepository bookingDetailRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CouponService couponService;

    public long calculateStayNights(LocalDateTime checkIn, LocalDateTime checkOut) {
        return BookingPricingCalculator.calculateStayNights(checkIn, checkOut);
    }

    public long calculatePriceIndex(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerNight) {
        return Math.round(calculateBookingSubtotal(checkIn, checkOut, pricePerNight));
    }

    public double calculateHours(LocalDateTime checkIn, LocalDateTime checkOut) {
        return BookingPricingCalculator.calculateHours(checkIn, checkOut);
    }

    public double calculateBookingSubtotal(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerNight) {
        return BookingPricingCalculator.summarize(checkIn, checkOut, pricePerNight).total();
    }

    public Map<String, Double> calculateBookingPriceAdmin(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerNight) {
        BookingPricingCalculator.BookingPricingSummary pricingSummary =
                BookingPricingCalculator.summarize(checkIn, checkOut, pricePerNight);

        Map<String, Double> result = new HashMap<>();
        result.put("hours", pricingSummary.hours());
        result.put("nights", (double) pricingSummary.nights());
        result.put("total", pricingSummary.total());
        return result;
    }

    public double calculateDepositAmount(double bookingAmount) {
        if (bookingAmount <= 0 || bookingDepositRatio <= 0) {
            return 0.0;
        }
        return Math.round(bookingAmount * bookingDepositRatio);
    }

    public double resolveDepositRequiredAmount(Booking booking) {
        if (booking == null) {
            return 0.0;
        }

        double baseAmount = booking.getFinalAmount() != null && booking.getFinalAmount() > 0
                ? booking.getFinalAmount()
                : Math.max(0.0, (booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0)
                - (booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount()));

        double computedDepositAmount = calculateDepositAmount(baseAmount);
        if (computedDepositAmount > 0) {
            return computedDepositAmount;
        }

        return booking.getDepositAmount() == null ? 0.0 : booking.getDepositAmount();
    }

    public double resolvePaidAmount(Booking booking) {
        if (booking == null || booking.getId() == null) {
            return 0.0;
        }

        Double paidAmount = paymentRepository.sumPaidRevenueByBookingId(booking.getId());
        return paidAmount != null ? paidAmount : 0.0;
    }

    public double resolveRemainingAmount(Booking booking) {
        if (booking == null) {
            return 0.0;
        }

        double finalAmount = booking.getFinalAmount() != null && booking.getFinalAmount() > 0
                ? booking.getFinalAmount()
                : Math.max(0.0, (booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0)
                - (booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount()));
        return Math.max(0.0, finalAmount - resolvePaidAmount(booking));
    }

    public double resolveDepositOutstandingAmount(Booking booking) {
        return Math.max(0.0, resolveDepositRequiredAmount(booking) - resolvePaidAmount(booking));
    }

    public String determinePaymentStatus(Booking booking, double paidAmount) {
        if (booking == null) {
            return "unpaid";
        }

        double normalizedPaidAmount = Math.max(0.0, paidAmount);
        double finalAmount = booking.getFinalAmount() != null && booking.getFinalAmount() > 0
                ? booking.getFinalAmount()
                : Math.max(0.0, (booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0)
                - (booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount()));
        if (normalizedPaidAmount <= 0.01) {
            return "unpaid";
        }
        if (finalAmount > 0 && normalizedPaidAmount + 0.01 >= finalAmount) {
            return "paid";
        }
        if (normalizedPaidAmount + 0.01 >= resolveDepositRequiredAmount(booking)) {
            return "deposit_paid";
        }
        return "unpaid";
    }

    public LocalDateTime createPendingExpiry() {
        return LocalDateTime.now().plusSeconds(pendingHoldSeconds);
    }

    public String getPendingHoldDisplayText() {
        if (pendingHoldSeconds <= 0) {
            return "ngay lập tức";
        }
        if (pendingHoldSeconds < 60) {
            return pendingHoldSeconds + " giây";
        }
        if (pendingHoldSeconds % 60 == 0) {
            return (pendingHoldSeconds / 60) + " phút";
        }

        long minutes = pendingHoldSeconds / 60;
        long seconds = pendingHoldSeconds % 60;
        return minutes + " phút " + seconds + " giây";
    }

    public void preparePendingBooking(Booking booking, String previousStatus) {
        if (booking == null || !"pending".equalsIgnoreCase(booking.getStatus())) {
            return;
        }

        if (booking.getExpiresAt() == null || !"pending".equalsIgnoreCase(previousStatus)) {
            booking.setExpiresAt(createPendingExpiry());
        }
    }

    public String normalizeManagedBookingStatus(String status) {
        String normalized = status == null ? "" : status.trim().toLowerCase();
        return switch (normalized) {
            case "pending", "confirmed", "completed", "cancelled", "expired" -> normalized;
            default -> throw new IllegalArgumentException("Trạng thái booking không hợp lệ.");
        };
    }

    public String validateAdminCreateStatus(String requestedStatus) {
        String normalizedStatus = normalizeManagedBookingStatus(requestedStatus);
        if (!"pending".equals(normalizedStatus) && !"confirmed".equals(normalizedStatus)) {
            throw new IllegalArgumentException("Booking mới chỉ có thể tạo ở trạng thái chờ hoặc đã xác nhận.");
        }
        return normalizedStatus;
    }

    public String validateAdminEditableStatus(String currentStatus, String requestedStatus) {
        String normalizedCurrentStatus = normalizeManagedBookingStatus(currentStatus);
        String normalizedRequestedStatus = normalizeManagedBookingStatus(requestedStatus);

        if (normalizedCurrentStatus.equals(normalizedRequestedStatus)) {
            return normalizedCurrentStatus;
        }

        return switch (normalizedCurrentStatus) {
            case "pending" -> {
                if ("confirmed".equals(normalizedRequestedStatus) || "cancelled".equals(normalizedRequestedStatus)) {
                    yield normalizedRequestedStatus;
                }
                throw new IllegalArgumentException("Đơn chờ chỉ được chuyển sang đã xác nhận hoặc đã hủy.");
            }
            case "confirmed" -> {
                if ("cancelled".equals(normalizedRequestedStatus)) {
                    yield normalizedRequestedStatus;
                }
                throw new IllegalArgumentException("Đơn đã xác nhận chỉ có thể đổi sang đã hủy trong form sửa. Trạng thái hoàn thành phải đi qua check-in và checkout.");
            }
            case "completed", "cancelled", "expired" ->
                    throw new IllegalArgumentException("Booking ở trạng thái cuối không thể đổi lại bằng form sửa.");
            default -> throw new IllegalArgumentException("Trạng thái booking không hợp lệ.");
        };
    }

    public String normalizeAdminPaymentStatus(String currentPaymentStatus, String bookingStatus) {
        String normalizedBookingStatus = normalizeManagedBookingStatus(bookingStatus);
        String normalizedPaymentStatus = currentPaymentStatus == null ? "" : currentPaymentStatus.trim().toLowerCase();

        if (!"pending".equals(normalizedBookingStatus) && "pending_payment".equals(normalizedPaymentStatus)) {
            return "unpaid";
        }

        if ("deposit_paid".equals(normalizedPaymentStatus)) {
            return "deposit_paid";
        }
        if ("paid".equals(normalizedPaymentStatus)) {
            return "paid";
        }
        if ("failed".equals(normalizedPaymentStatus)) {
            return "failed";
        }

        if ("expired".equals(normalizedBookingStatus)) {
            return "pending_payment".equals(normalizedPaymentStatus) ? "failed" : "unpaid";
        }

        return "unpaid";
    }

    public void validateAdminCheckInTime(BookingDetail detail, LocalDateTime now) {
        if (detail == null || detail.getCheckIn() == null) {
            throw new IllegalArgumentException("Đơn chưa có thời gian nhận phòng hợp lệ.");
        }
        
        // Chỉ được check-in từ thời điểm checkIn trở đi (có thể du di sớm 1-2 tiếng nhưng theo user yêu cầu chặt, ta dùng đúng giờ)
        if (now.isBefore(detail.getCheckIn())) {
            String checkInDateStr = detail.getCheckIn()
                    .format(java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"));
            throw new IllegalArgumentException(
                    "Chưa đến giờ nhận phòng. Chỉ có thể check-in từ " + checkInDateStr + " trở đi."
            );
        }

        // Sau 1 ngày (24h) từ ngày dự kiến thì không được phép nhận phòng nữa, coi như no-show (mất cọc)
        LocalDateTime checkInDeadline = detail.getCheckIn().plusDays(1);
        if (now.isAfter(checkInDeadline)) {
            throw new IllegalArgumentException(
                    "Đơn đã quá hạn check-in 1 ngày. Khách không đến nên mất cọc và không thể nhận phòng."
            );
        }
    }

    private LocalDateTime resolvePendingExpiry(Booking booking, LocalDateTime now) {
        if (booking == null) {
            return now;
        }
        if (booking.getExpiresAt() != null) {
            return booking.getExpiresAt();
        }
        if (booking.getCreatedAt() == null) {
            return now;
        }
        return booking.getCreatedAt().plusSeconds(pendingHoldSeconds);
    }

    public boolean synchronizeBookingState(Booking booking) {
        return synchronizeBookingState(booking, LocalDateTime.now());
    }

    public boolean synchronizeBookingState(Booking booking, LocalDateTime now) {
        if (booking == null) {
            return false;
        }

        boolean changed = false;
        if (booking.getPaymentStatus() == null || booking.getPaymentStatus().isBlank()) {
            booking.setPaymentStatus(inferLegacyPaymentStatus(booking));
            changed = true;
        }

        if ("pending".equalsIgnoreCase(booking.getStatus())) {
            LocalDateTime effectiveExpiry = resolvePendingExpiry(booking, now);
            if (booking.getExpiresAt() == null || !effectiveExpiry.equals(booking.getExpiresAt())) {
                booking.setExpiresAt(effectiveExpiry);
                changed = true;
            }

            if (!effectiveExpiry.isAfter(now)) {
                booking.setStatus("expired");
                if ("pending_payment".equalsIgnoreCase(booking.getPaymentStatus())) {
                    booking.setPaymentStatus("failed");
                } else if (!"paid".equalsIgnoreCase(booking.getPaymentStatus())) {
                    booking.setPaymentStatus("unpaid");
                }
                changed = true;
            }
        }

        return changed;
    }

    private int synchronizeAndPersist(List<Booking> bookings, LocalDateTime now) {
        if (bookings == null || bookings.isEmpty()) {
            return 0;
        }

        List<Booking> changedBookings = new ArrayList<>();
        for (Booking booking : bookings) {
            if (synchronizeBookingState(booking, now)) {
                changedBookings.add(booking);
            }
        }

        if (!changedBookings.isEmpty()) {
            bookingRepository.saveAll(changedBookings);
            couponService.synchronizeCouponAssignments(changedBookings);
        }

        return changedBookings.size();
    }

    @Transactional
    public int expirePendingBookings() {
        LocalDateTime now = LocalDateTime.now();
        int changedCount = synchronizeAndPersist(bookingRepository.findByStatusAndExpiresAtIsNull("pending"), now);
        changedCount += synchronizeAndPersist(bookingRepository.findByStatusAndExpiresAtLessThanEqual("pending", now), now);
        return changedCount;
    }

    @Transactional
    public int expirePendingBookingsForUser(Integer userId) {
        if (userId == null) {
            return 0;
        }
        return synchronizeAndPersist(bookingRepository.findAllByUserIdAndStatus(userId, "pending"), LocalDateTime.now());
    }

    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void expirePendingBookingsOnSchedule() {
        expirePendingBookings();
    }

    public Booking getActiveBooking(Integer userId) {
        if (userId == null) {
            return null;
        }

        expirePendingBookingsForUser(userId);
        List<Booking> list = bookingRepository.findActivePendingBookingByUserId(userId, LocalDateTime.now());
        return list.isEmpty() ? null : normalizeBookingFinancials(list.get(0));
    }

    public double calculateBookingTotal(Booking booking) {
        if (booking == null || booking.getDetails() == null || booking.getDetails().isEmpty()) {
            return booking != null && booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0;
        }

        double total = 0.0;
        for (BookingDetail detail : booking.getDetails()) {
            if (detail == null
                    || detail.getPriceAtBooking() == null
                    || detail.getCheckIn() == null
                    || detail.getCheckOut() == null) {
                continue;
            }
            total += calculateBookingSubtotal(detail.getCheckIn(), detail.getCheckOut(), detail.getPriceAtBooking());
        }
        return total;
    }

    public Booking normalizeBookingFinancials(Booking booking) {
        if (booking == null) {
            return null;
        }

        boolean changed = synchronizeBookingState(booking);

        if (booking.getDetails() != null) {
            for (BookingDetail detail : booking.getDetails()) {
                if (detail == null || detail.getCheckIn() == null || detail.getCheckOut() == null) {
                    continue;
                }

                double recalculatedHours = calculateHours(detail.getCheckIn(), detail.getCheckOut());
                if (detail.getTotalHours() == null || Math.abs(detail.getTotalHours() - recalculatedHours) > 0.01) {
                    detail.setTotalHours(recalculatedHours);
                    changed = true;
                }
            }
        }

        double recalculatedTotal = calculateBookingTotal(booking);
        if (recalculatedTotal > 0 && (booking.getTotalPrice() == null || Math.abs(booking.getTotalPrice() - recalculatedTotal) > 0.01)) {
            booking.setTotalPrice(recalculatedTotal);
            changed = true;
        }

        double discountAmount = booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount();
        double finalAmount = Math.max(0.0, recalculatedTotal - discountAmount);
        if (recalculatedTotal > 0 && (booking.getFinalAmount() == null || Math.abs(booking.getFinalAmount() - finalAmount) > 0.01)) {
            booking.setFinalAmount(finalAmount);
            changed = true;
        } else if (booking.getFinalAmount() == null && booking.getTotalPrice() != null) {
            booking.setFinalAmount(Math.max(0.0, booking.getTotalPrice() - discountAmount));
            changed = true;
        }

        double depositAmount = resolveDepositRequiredAmount(booking);
        if (booking.getDepositAmount() == null || Math.abs(booking.getDepositAmount() - depositAmount) > 0.01) {
            booking.setDepositAmount(depositAmount);
            changed = true;
        }

        double paidAmount = resolvePaidAmount(booking);
        if (paidAmount > 0.01) {
            String derivedPaymentStatus = determinePaymentStatus(booking, paidAmount);
            if (!derivedPaymentStatus.equalsIgnoreCase(booking.getPaymentStatus())) {
                booking.setPaymentStatus(derivedPaymentStatus);
                changed = true;
            }
        }

        if (changed) {
            bookingRepository.save(booking);
            couponService.synchronizeCouponAssignment(booking);
        }

        booking.setPaidAmount(paidAmount);
        booking.setRemainingAmount(Math.max(0.0, (booking.getFinalAmount() == null ? 0.0 : booking.getFinalAmount()) - paidAmount));
        booking.setDepositOutstandingAmount(Math.max(0.0, booking.getDepositAmount() == null ? 0.0 : booking.getDepositAmount() - paidAmount));
        return booking;
    }

    public List<Booking> normalizeBookingFinancials(List<Booking> bookings) {
        if (bookings == null) {
            return List.of();
        }
        bookings.forEach(this::normalizeBookingFinancials);
        return bookings;
    }

    public void synchronizeCouponAssignment(Booking booking) {
        couponService.synchronizeCouponAssignment(booking);
    }

    public String resolveInitialPaymentStatus(String paymentFlow) {
        if ("vnpay".equalsIgnoreCase(paymentFlow) || "vnpay_demo".equalsIgnoreCase(paymentFlow)) {
            return "pending_payment";
        }
        return "unpaid";
    }

    public String inferLegacyPaymentStatus(Booking booking) {
        if (booking == null) {
            return "unpaid";
        }

        if (booking.getPaymentStatus() != null && !booking.getPaymentStatus().isBlank()) {
            return booking.getPaymentStatus().trim().toLowerCase();
        }

        double paidAmount = resolvePaidAmount(booking);
        if (paidAmount > 0.01) {
            return determinePaymentStatus(booking, paidAmount);
        }

        if ("completed".equalsIgnoreCase(booking.getStatus())) {
            return "paid";
        }

        return "unpaid";
    }

    @Transactional
    public Booking createBooking(User user, Integer roomId, LocalDateTime checkIn, LocalDateTime checkOut, String paymentFlow) {
        return createBooking(user, roomId, checkIn, checkOut, paymentFlow, null, null, null);
    }

    @Transactional
    public Booking createBooking(User user,
                                 Integer roomId,
                                 LocalDateTime checkIn,
                                 LocalDateTime checkOut,
                                 String paymentFlow,
                                 String couponCode) {
        return createBooking(user, roomId, checkIn, checkOut, paymentFlow, couponCode, null, null);
    }

    @Transactional
    public Booking createBooking(User user,
                                 Integer roomId,
                                 LocalDateTime checkIn,
                                 LocalDateTime checkOut,
                                 String paymentFlow,
                                 String couponCode,
                                 Integer userCouponId) {
        return createBooking(user, roomId, checkIn, checkOut, paymentFlow, couponCode, userCouponId, null);
    }

    @Transactional
    public Booking createBooking(User user,
                                 Integer roomId,
                                 LocalDateTime checkIn,
                                 LocalDateTime checkOut,
                                 String paymentFlow,
                                 String couponCode,
                                 Integer userCouponId,
                                 Integer guestCount) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("Phiên người dùng không hợp lệ.");
        }

        Booking activeBooking = getActiveBooking(user.getId());
        if (activeBooking != null) {
            String holdUntil = activeBooking.getExpiresAt() != null
                    ? activeBooking.getExpiresAt().format(HOLD_UNTIL_FORMATTER)
                    : null;
            throw new IllegalArgumentException(
                    "Bạn đang có một yêu cầu đặt phòng đang chờ xử lý"
                            + (holdUntil != null ? " đến " + holdUntil : "")
                            + ". Vui lòng hoàn tất hoặc chờ yêu cầu hiện tại hết hiệu lực trước khi tạo booking mới."
            );
        }

        LocalDateTime now = LocalDateTime.now();

        if (!checkIn.isAfter(now)) {
            throw new IllegalArgumentException("Ngày nhận phòng phải nằm trong tương lai.");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Thời gian ra phải lớn hơn thời gian vào!");
        }

        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            throw new IllegalArgumentException("Phòng không tồn tại!");
        }

        Room room = roomOpt.get();
        if ("maintenance".equalsIgnoreCase(room.getStatus())) {
            throw new IllegalArgumentException("Phòng này đang được bảo trì nên chưa thể nhận booking mới.");
        }

        int resolvedGuestCount = resolveRequestedGuestCount(guestCount, room);

        long overlapCount = bookingRepository.countOverlappingBookings(roomId, checkIn, checkOut, now);
        if (overlapCount > 0) {
            throw new IllegalArgumentException("Phòng đã có người đặt trong thời gian này!");
        }

        double pricePerNight = room.getRoomType().getPricePerNight();
        long totalPrice = calculatePriceIndex(checkIn, checkOut, pricePerNight);
        double totalHours = calculateHours(checkIn, checkOut);
        CouponService.CouponPricingResult couponPricing = couponService.evaluatePricing(
                room,
                checkIn,
                checkOut,
                user,
                userCouponId,
                couponCode,
                LocalDateTime.now(),
                false
        );
        if (((couponCode != null && !couponCode.isBlank()) || userCouponId != null) && !couponPricing.valid()) {
            throw new IllegalArgumentException(couponPricing.message());
        }
        Coupon appliedCoupon = couponPricing.coupon();

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setTotalPrice((double) totalPrice);
        booking.setDiscountAmount(couponPricing.discountAmount());
        booking.setFinalAmount(couponPricing.finalAmount());
        booking.setDepositAmount(calculateDepositAmount(couponPricing.finalAmount()));
        booking.setCouponCode(appliedCoupon != null ? appliedCoupon.getCode() : null);
        booking.setStatus("pending");
        booking.setPaymentStatus(resolveInitialPaymentStatus(paymentFlow));
        booking.setExpiresAt(createPendingExpiry());
        booking = bookingRepository.save(booking);

        BookingDetail detail = new BookingDetail();
        detail.setBooking(booking);
        detail.setRoom(room);
        detail.setPriceAtBooking(pricePerNight);
        detail.setCheckIn(checkIn);
        detail.setCheckOut(checkOut);
        detail.setGuestCount(resolvedGuestCount);
        detail.setTotalHours(totalHours);
        bookingDetailRepository.save(detail);
        couponService.reserveUserCouponForBooking(couponPricing.userCouponId(), booking, user.getId());

        return booking;
    }

    @Transactional
    public String bookRoom(User user, Integer roomId, LocalDateTime checkIn, LocalDateTime checkOut) {
        try {
            createBooking(user, roomId, checkIn, checkOut, "standard_request", null, null, null);
            return null;
        } catch (IllegalArgumentException ex) {
            return ex.getMessage();
        }
    }

    private int resolveRequestedGuestCount(Integer guestCount, Room room) {
        int resolvedGuestCount = guestCount != null && guestCount > 0
                ? guestCount
                : Math.max(1, room != null && room.getRoomType() != null && room.getRoomType().getCapacity() != null
                ? room.getRoomType().getCapacity()
                : 1);

        int capacity = room != null && room.getRoomType() != null && room.getRoomType().getCapacity() != null
                ? room.getRoomType().getCapacity()
                : 0;
        if (capacity > 0 && resolvedGuestCount > capacity) {
            throw new IllegalArgumentException("Số khách vượt quá sức chứa hiện tại của phòng.");
        }

        return resolvedGuestCount;
    }

    @Transactional
    public void cancelBooking(Integer bookingId, Integer userId) {
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy đơn đặt phòng.");
        }

        Booking booking = bookingOpt.get();
        if (synchronizeBookingState(booking)) {
            bookingRepository.save(booking);
        }
        if (booking.getUser() == null || !booking.getUser().getId().equals(userId)) {
            throw new SecurityException("Bạn không có quyền hủy đơn đặt phòng này.");
        }
        if (!"pending".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalStateException("Chỉ có thể hủy booking đang chờ xác nhận. Sau khi đơn đã được xác nhận, vui lòng liên hệ khách sạn để được hỗ trợ.");
        }
        if (hasRecordedPayment(booking)) {
            throw new IllegalStateException("Booking đã có thanh toán hoặc đặt cọc, vui lòng liên hệ khách sạn để được hỗ trợ.");
        }

        booking.setStatus("cancelled");
        if (!"paid".equalsIgnoreCase(booking.getPaymentStatus())) {
            booking.setPaymentStatus("unpaid");
        }
        bookingRepository.save(booking);
        couponService.synchronizeCouponAssignment(booking);
    }

    private boolean hasRecordedPayment(Booking booking) {
        if (booking == null) {
            return false;
        }

        double paidAmount = resolvePaidAmount(booking);
        if (paidAmount > 0.01) {
            return true;
        }

        String paymentStatus = booking.getPaymentStatus() == null
                ? ""
                : booking.getPaymentStatus().trim().toLowerCase();
        return "deposit_paid".equals(paymentStatus) || "paid".equals(paymentStatus);
    }

    public Page<Booking> getHistory(Integer userId, String status, int page) {
        expirePendingBookingsForUser(userId);
        String normalizedFilter = normalizeHistoryFilter(status);
        List<Booking> allBookings = bookingRepository.findAllHistoryByUserId(userId);
        normalizeBookingFinancials(allBookings);

        List<Booking> filteredBookings = allBookings.stream()
                .filter(booking -> matchesHistoryFilter(booking, normalizedFilter))
                .toList();

        int totalItems = filteredBookings.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) totalItems / HISTORY_PAGE_SIZE));
        int safePage = Math.min(Math.max(1, page), totalPages);
        int fromIndex = Math.min((safePage - 1) * HISTORY_PAGE_SIZE, totalItems);
        int toIndex = Math.min(fromIndex + HISTORY_PAGE_SIZE, totalItems);

        return new PageImpl<>(
                filteredBookings.subList(fromIndex, toIndex),
                PageRequest.of(safePage - 1, HISTORY_PAGE_SIZE),
                totalItems
        );
    }

    public Map<String, Long> countHistoryStatuses(Integer userId) {
        expirePendingBookingsForUser(userId);
        List<Booking> allBookings = bookingRepository.findAllHistoryByUserId(userId);
        normalizeBookingFinancials(allBookings);
        Map<String, Long> summary = new LinkedHashMap<>();
        summary.put("all", 0L);
        summary.put("pending", 0L);
        summary.put("deposit_paid", 0L);
        summary.put("confirmed", 0L);
        summary.put("staying", 0L);
        summary.put("completed", 0L);
        summary.put("cancelled", 0L);
        summary.put("expired", 0L);

        for (Booking booking : allBookings) {
            String historyStatus = resolveHistoryStatus(booking);
            summary.put("all", summary.get("all") + 1);
            if (summary.containsKey(historyStatus)) {
                summary.put(historyStatus, summary.get(historyStatus) + 1);
            }
        }
        return summary;
    }

    private String normalizeHistoryFilter(String status) {
        if (status == null || status.isBlank()) {
            return "all";
        }
        return status.trim().toLowerCase();
    }

    private boolean matchesHistoryFilter(Booking booking, String filter) {
        if ("all".equalsIgnoreCase(filter)) {
            return true;
        }
        return resolveHistoryStatus(booking).equalsIgnoreCase(filter);
    }

    private String resolveHistoryStatus(Booking booking) {
        String normalizedStatus = booking == null || booking.getStatus() == null
                ? "pending"
                : booking.getStatus().trim().toLowerCase();
        if (!"confirmed".equals(normalizedStatus)) {
            return normalizedStatus;
        }

        BookingDetail primaryDetail = booking.getDetails() == null || booking.getDetails().isEmpty()
                ? null
                : booking.getDetails().get(0);
        if (primaryDetail != null
                && primaryDetail.getCheckInActual() != null
                && primaryDetail.getCheckOutActual() == null) {
            return "staying";
        }

        if ("deposit_paid".equalsIgnoreCase(booking.getPaymentStatus())) {
            return "deposit_paid";
        }

        return normalizedStatus;
    }

    public double getTotalSpent(Integer userId) {
        List<Booking> paidBookings = bookingRepository.findAllByUserIdAndPaymentStatus(userId, "paid");
        normalizeBookingFinancials(paidBookings);
        return paidBookings.stream()
                .mapToDouble(booking -> booking.getFinalAmount() != null
                        ? booking.getFinalAmount()
                        : (booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0))
                .sum();
    }
}
