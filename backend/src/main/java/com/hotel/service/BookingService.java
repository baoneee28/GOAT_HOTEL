package com.hotel.service;

import com.hotel.entity.Booking;
import com.hotel.entity.BookingDetail;
import com.hotel.entity.Room;
import com.hotel.entity.User;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class BookingService {

    private static final DateTimeFormatter HOLD_UNTIL_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    @Value("${booking.pending-hold-seconds:180}")
    private long pendingHoldSeconds;

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private BookingDetailRepository bookingDetailRepository;

    @Autowired
    private RoomRepository roomRepository;

    public long calculateStayNights(LocalDateTime checkIn, LocalDateTime checkOut) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            return 0;
        }

        long nights = ChronoUnit.DAYS.between(checkIn.toLocalDate(), checkOut.toLocalDate());
        return Math.max(1, nights);
    }

    public long calculatePriceIndex(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerNight) {
        long nights = calculateStayNights(checkIn, checkOut);
        return Math.round(nights * pricePerNight);
    }

    public double calculateHours(LocalDateTime checkIn, LocalDateTime checkOut) {
        long totalSeconds = ChronoUnit.SECONDS.between(checkIn, checkOut);
        double hours = totalSeconds / 3600.0;
        return Math.round(hours * 100.0) / 100.0;
    }

    public Map<String, Double> calculateBookingPriceAdmin(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerNight) {
        if (!checkOut.isAfter(checkIn)) {
            Map<String, Double> zero = new HashMap<>();
            zero.put("hours", 0.0);
            zero.put("nights", 0.0);
            zero.put("total", 0.0);
            return zero;
        }

        double totalHours = calculateHours(checkIn, checkOut);
        long totalNights = calculateStayNights(checkIn, checkOut);

        Map<String, Double> result = new HashMap<>();
        result.put("hours", totalHours);
        result.put("nights", (double) totalNights);
        result.put("total", totalNights * pricePerNight);
        return result;
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
            total += calculatePriceIndex(detail.getCheckIn(), detail.getCheckOut(), detail.getPriceAtBooking());
        }
        return total;
    }

    public Booking normalizeBookingFinancials(Booking booking) {
        if (booking == null) {
            return null;
        }

        if (synchronizeBookingState(booking)) {
            bookingRepository.save(booking);
        }

        if (booking.getDetails() != null) {
            for (BookingDetail detail : booking.getDetails()) {
                if (detail == null || detail.getCheckIn() == null || detail.getCheckOut() == null) {
                    continue;
                }

                double recalculatedHours = calculateHours(detail.getCheckIn(), detail.getCheckOut());
                if (detail.getTotalHours() == null || Math.abs(detail.getTotalHours() - recalculatedHours) > 0.01) {
                    detail.setTotalHours(recalculatedHours);
                }
            }
        }

        double recalculatedTotal = calculateBookingTotal(booking);
        if (recalculatedTotal > 0 && (booking.getTotalPrice() == null || Math.abs(booking.getTotalPrice() - recalculatedTotal) > 0.01)) {
            booking.setTotalPrice(recalculatedTotal);
        }

        return booking;
    }

    public List<Booking> normalizeBookingFinancials(List<Booking> bookings) {
        if (bookings == null) {
            return List.of();
        }
        bookings.forEach(this::normalizeBookingFinancials);
        return bookings;
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

        boolean hasPaidPayment = booking.getPayments() != null
                && booking.getPayments().stream().anyMatch(payment ->
                payment != null && ("paid".equalsIgnoreCase(payment.getStatus())
                        || "completed".equalsIgnoreCase(payment.getStatus())));

        if (hasPaidPayment || "completed".equalsIgnoreCase(booking.getStatus())) {
            return "paid";
        }

        return "unpaid";
    }

    @Transactional
    public Booking createBooking(User user, Integer roomId, LocalDateTime checkIn, LocalDateTime checkOut, String paymentFlow) {
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

        // Không cho phép đặt phòng với ngày nhận trong quá khứ
        if (checkIn.isBefore(LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0))) {
            throw new IllegalArgumentException("Ngày nhận phòng không thể ở trong quá khứ!");
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

        long overlapCount = bookingRepository.countOverlappingBookings(roomId, checkIn, checkOut, LocalDateTime.now());
        if (overlapCount > 0) {
            throw new IllegalArgumentException("Phòng đã có người đặt trong thời gian này!");
        }

        double pricePerNight = room.getRoomType().getPricePerNight();
        long totalPrice = calculatePriceIndex(checkIn, checkOut, pricePerNight);
        double totalHours = calculateHours(checkIn, checkOut);

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setTotalPrice((double) totalPrice);
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
        detail.setTotalHours(totalHours);
        bookingDetailRepository.save(detail);

        return booking;
    }

    @Transactional
    public String bookRoom(User user, Integer roomId, LocalDateTime checkIn, LocalDateTime checkOut) {
        try {
            createBooking(user, roomId, checkIn, checkOut, "standard_request");
            return null;
        } catch (IllegalArgumentException ex) {
            return ex.getMessage();
        }
    }

    @Transactional
    public boolean cancelBooking(Integer bookingId, Integer userId) {
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) return false;

        Booking booking = bookingOpt.get();
        if (synchronizeBookingState(booking)) {
            bookingRepository.save(booking);
        }
        if (!booking.getUser().getId().equals(userId)) return false;
        if (!"pending".equals(booking.getStatus())) return false;

        booking.setStatus("cancelled");
        if (!"paid".equalsIgnoreCase(booking.getPaymentStatus())) {
            booking.setPaymentStatus("unpaid");
        }
        bookingRepository.save(booking);

        return true;
    }

    public Page<Booking> getHistory(Integer userId, String status, int page) {
        expirePendingBookingsForUser(userId);
        Page<Booking> historyPage = bookingRepository.findByUserIdAndStatus(userId, status, PageRequest.of(page - 1, 5));
        normalizeBookingFinancials(historyPage.getContent());
        return historyPage;
    }

    public double getTotalSpent(Integer userId) {
        List<Booking> paidBookings = bookingRepository.findAllByUserIdAndPaymentStatus(userId, "paid");
        normalizeBookingFinancials(paidBookings);
        return paidBookings.stream()
                .mapToDouble(booking -> booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0)
                .sum();
    }
}
