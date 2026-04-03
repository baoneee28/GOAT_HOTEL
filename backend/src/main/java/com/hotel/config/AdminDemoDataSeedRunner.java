package com.hotel.config;

import com.hotel.entity.Booking;
import com.hotel.entity.BookingDetail;
import com.hotel.entity.ContactMessage;
import com.hotel.entity.Coupon;
import com.hotel.entity.Payment;
import com.hotel.entity.Room;
import com.hotel.entity.RoomType;
import com.hotel.entity.User;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.ContactMessageRepository;
import com.hotel.repository.CouponRepository;
import com.hotel.repository.PaymentRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.RoomTypeRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.BookingService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Component
public class AdminDemoDataSeedRunner implements CommandLineRunner {

    @Value("${booking.pending-hold-seconds:180}")
    private long pendingHoldSeconds;

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final CouponRepository couponRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final PaymentRepository paymentRepository;
    private final BookingService bookingService;

    public AdminDemoDataSeedRunner(UserRepository userRepository,
                                   RoomRepository roomRepository,
                                   RoomTypeRepository roomTypeRepository,
                                   CouponRepository couponRepository,
                                   ContactMessageRepository contactMessageRepository,
                                   BookingRepository bookingRepository,
                                   BookingDetailRepository bookingDetailRepository,
                                   PaymentRepository paymentRepository,
                                   BookingService bookingService) {
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.couponRepository = couponRepository;
        this.contactMessageRepository = contactMessageRepository;
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.paymentRepository = paymentRepository;
        this.bookingService = bookingService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<RoomType> roomTypes = roomTypeRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        if (roomTypes.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);
        Map<String, User> users = ensureUsers(now);
        Map<String, Room> rooms = ensureRooms(roomTypes);
        Map<String, Coupon> coupons = ensureCoupons(now);
        ensureContactMessages(now);
        ensureBookings(now, users, rooms, coupons);
    }

    private Map<String, User> ensureUsers(LocalDateTime now) {
        List<UserSeed> seeds = List.of(
                new UserSeed("demo_admin", "GOAT Demo Admin", "demo.admin@goathotel.local", "0909000100", "admin", "admin123", now.minusDays(40)),
                new UserSeed("customer_a", "Nguyen Bao An", "bao.an.demo@goathotel.local", "0909000101", "customer", "demo123", now.minusDays(30)),
                new UserSeed("customer_b", "Tran Minh Binh", "minh.binh.demo@goathotel.local", "0909000102", "customer", "demo123", now.minusDays(26)),
                new UserSeed("customer_c", "Le Thu Chi", "thu.chi.demo@goathotel.local", "0909000103", "customer", "demo123", now.minusDays(22)),
                new UserSeed("customer_d", "Pham Hoang Duong", "hoang.duong.demo@goathotel.local", "0909000104", "customer", "demo123", now.minusDays(18)),
                new UserSeed("customer_e", "Vo Anh Em", "anh.em.demo@goathotel.local", "0909000105", "customer", "demo123", now.minusDays(12)),
                new UserSeed("customer_f", "Dang Gia Huy", "gia.huy.demo@goathotel.local", "0909000106", "customer", "demo123", now.minusDays(8))
        );

        Map<String, User> users = new LinkedHashMap<>();
        for (UserSeed seed : seeds) {
            User user = userRepository.findByEmailIgnoreCase(seed.email()).orElseGet(User::new);
            user.setFullName(seed.fullName());
            user.setEmail(seed.email());
            user.setPhone(seed.phone());
            user.setRole(seed.role());
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                user.setPassword(seed.password());
            }
            if (user.getCreatedAt() == null) {
                user.setCreatedAt(seed.createdAt());
            }
            user = userRepository.save(user);
            users.put(seed.key(), user);
        }
        return users;
    }

    private Map<String, Room> ensureRooms(List<RoomType> roomTypes) {
        List<RoomSeed> seeds = List.of(
                new RoomSeed("available_main", "GD1001", 0, "available"),
                new RoomSeed("expired_room", "GD1002", 1, "available"),
                new RoomSeed("reserved_room", "GD1003", 2, "available"),
                new RoomSeed("occupied_room", "GD1004", 3, "available"),
                new RoomSeed("pending_room", "GD1005", 0, "available"),
                new RoomSeed("maintenance_room", "GDMT01", 1, "maintenance")
        );

        Map<String, Room> rooms = new LinkedHashMap<>();
        for (RoomSeed seed : seeds) {
            Room room = roomRepository.findByRoomNumber(seed.roomNumber()).orElseGet(Room::new);
            room.setRoomNumber(seed.roomNumber());
            room.setRoomType(resolveRoomType(roomTypes, seed.roomTypeIndex()));
            room.setStatus(seed.status());
            room = roomRepository.save(room);
            rooms.put(seed.key(), room);
        }
        return rooms;
    }

    private Map<String, Coupon> ensureCoupons(LocalDateTime now) {
        List<CouponSeed> seeds = List.of(
                new CouponSeed("GOAT50", "Ưu đãi đặt phòng trực tiếp", "Giảm thẳng 50.000đ cho booking từ 800.000đ.", "FIXED", 50000, 800000, null, now.minusDays(20), now.plusDays(30), 30, true),
                new CouponSeed("HOTEL10", "Giảm 10% gần kỳ nghỉ", "Giảm 10% cho booking đủ điều kiện, mức giảm tối đa 180.000đ.", "PERCENT", 10, 1200000, 180000.0, now.minusDays(7), now.plusDays(5), 20, true),
                new CouponSeed("FIRSTBOOK", "Ưu đãi khách đặt lần đầu", "Áp dụng cho booking demo đầu tiên, giới hạn đúng 1 lượt để admin thấy trạng thái hết lượt.", "FIXED", 70000, 900000, null, now.minusDays(40), now.plusDays(40), 1, true),
                new CouponSeed("SUMMER100", "Ưu đãi hè sắp mở", "Coupon đã cấu hình sẵn nhưng chưa tới ngày chạy chiến dịch.", "FIXED", 100000, 1500000, null, now.plusDays(10), now.plusDays(40), 15, true),
                new CouponSeed("WEEKDAY70", "Ưu đãi giữa tuần", "Coupon demo đang tạm tắt để màn admin có trạng thái inactive.", "FIXED", 70000, 900000, null, now.minusDays(10), now.plusDays(20), null, false),
                new CouponSeed("EXPIRED15", "Coupon hết hạn", "Coupon demo đã quá hạn để test bộ lọc quản trị và trang public.", "PERCENT", 15, 1000000, 200000.0, now.minusDays(40), now.minusDays(5), 10, true)
        );

        Map<String, Coupon> coupons = new LinkedHashMap<>();
        for (CouponSeed seed : seeds) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(seed.code()).orElseGet(Coupon::new);
            coupon.setCode(seed.code());
            coupon.setName(seed.name());
            coupon.setDescription(seed.description());
            coupon.setDiscountType(seed.discountType());
            coupon.setDiscountValue(seed.discountValue());
            coupon.setMinOrderValue(seed.minOrderValue());
            coupon.setMaxDiscountAmount(seed.maxDiscountAmount());
            coupon.setStartDate(seed.startDate());
            coupon.setEndDate(seed.endDate());
            coupon.setUsageLimit(seed.usageLimit());
            coupon.setIsActive(seed.isActive());
            coupon = couponRepository.save(coupon);
            coupons.put(seed.code().toUpperCase(Locale.ROOT), coupon);
        }
        return coupons;
    }

    private void ensureContactMessages(LocalDateTime now) {
        List<ContactSeed> seeds = List.of(
                new ContactSeed("Pham", "Lan", "contact.demo.new@goathotel.local", "new", "", "Mình muốn hỏi thêm về chính sách nhận phòng sớm cho booking tháng sau.", now.minusHours(6)),
                new ContactSeed("Le", "Minh", "contact.demo.progress@goathotel.local", "in_progress", "Đã gọi lại xác nhận nhu cầu giữ 2 phòng.", "Nhờ khách sạn tư vấn giúp combo 2 phòng cho nhóm 5 người vào cuối tuần.", now.minusDays(1).minusHours(2)),
                new ContactSeed("Tran", "Vy", "contact.demo.resolved@goathotel.local", "resolved", "Đã gửi báo giá qua email, khách xác nhận đã nhận được.", "Mình cần xuất hóa đơn công ty cho booking đã hoàn thành, nhờ hỗ trợ.", now.minusDays(2)),
                new ContactSeed("Ngo", "Khanh", "contact.demo.new2@goathotel.local", "new", "", "Khách sạn còn phòng family trong dịp lễ không ạ?", now.minusHours(3)),
                new ContactSeed("Vo", "Ha", "contact.demo.progress2@goathotel.local", "in_progress", "Đang chờ khách phản hồi lại ngày check-in chính xác.", "Cho mình hỏi có thể cộng thêm giường phụ cho phòng superior không?", now.minusDays(3)),
                new ContactSeed("Dang", "Tien", "contact.demo.resolved2@goathotel.local", "resolved", "Đã hướng dẫn khách dùng coupon GOAT50 khi đặt online.", "Mình muốn biết cách áp dụng mã giảm giá khi booking trên website.", now.minusDays(4))
        );

        List<ContactMessage> existingMessages = contactMessageRepository.findAll();
        for (ContactSeed seed : seeds) {
            ContactMessage message = existingMessages.stream()
                    .filter(item -> item.getEmail() != null && item.getEmail().equalsIgnoreCase(seed.email()))
                    .findFirst()
                    .orElseGet(ContactMessage::new);
            message.setFirstName(seed.firstName());
            message.setLastName(seed.lastName());
            message.setEmail(seed.email());
            message.setMessage(seed.message());
            message.setStatus(seed.status());
            message.setAdminNote(seed.adminNote());
            if (message.getCreatedAt() == null) {
                message.setCreatedAt(seed.createdAt());
            }
            contactMessageRepository.save(message);
        }
    }

    private void ensureBookings(LocalDateTime now,
                                Map<String, User> users,
                                Map<String, Room> rooms,
                                Map<String, Coupon> coupons) {
        List<Booking> existingBookings = bookingRepository.findAll();
        LocalDate today = now.toLocalDate();

        ensureBookingScenario(
                existingBookings,
                users.get("customer_a"),
                rooms.get("available_main"),
                coupons.get("FIRSTBOOK"),
                LocalDateTime.of(today.minusDays(20), LocalTime.of(14, 0)),
                LocalDateTime.of(today.minusDays(17), LocalTime.of(12, 0)),
                "completed",
                "paid",
                LocalDateTime.of(today.minusDays(20), LocalTime.of(14, 10)),
                LocalDateTime.of(today.minusDays(17), LocalTime.of(11, 30)),
                null,
                now.minusDays(25),
                "CASH",
                now.minusDays(19)
        );

        ensureBookingScenario(
                existingBookings,
                users.get("customer_b"),
                rooms.get("available_main"),
                null,
                LocalDateTime.of(today.plusDays(25), LocalTime.of(14, 0)),
                LocalDateTime.of(today.plusDays(27), LocalTime.of(12, 0)),
                "cancelled",
                "unpaid",
                null,
                null,
                null,
                now.minusDays(5),
                null,
                null
        );

        ensureBookingScenario(
                existingBookings,
                users.get("customer_c"),
                rooms.get("expired_room"),
                null,
                LocalDateTime.of(today.plusDays(5), LocalTime.of(14, 0)),
                LocalDateTime.of(today.plusDays(7), LocalTime.of(12, 0)),
                "expired",
                "failed",
                null,
                null,
                now.minusHours(3),
                now.minusHours(8),
                null,
                null
        );

        ensureBookingScenario(
                existingBookings,
                users.get("customer_d"),
                rooms.get("reserved_room"),
                coupons.get("HOTEL10"),
                LocalDateTime.of(today.plusDays(3), LocalTime.of(14, 0)),
                LocalDateTime.of(today.plusDays(6), LocalTime.of(12, 0)),
                "confirmed",
                "paid",
                null,
                null,
                null,
                now.minusDays(2),
                "VNPay Demo",
                now.minusDays(2).plusHours(2)
        );

        ensureBookingScenario(
                existingBookings,
                users.get("customer_e"),
                rooms.get("occupied_room"),
                coupons.get("GOAT50"),
                LocalDateTime.of(today.minusDays(1), LocalTime.of(14, 0)),
                LocalDateTime.of(today.plusDays(1), LocalTime.of(12, 0)),
                "confirmed",
                "paid",
                LocalDateTime.of(today.minusDays(1), LocalTime.of(14, 15)),
                null,
                null,
                now.minusDays(3),
                "CASH",
                now.minusDays(1).plusHours(1)
        );

        ensureBookingScenario(
                existingBookings,
                users.get("customer_f"),
                rooms.get("pending_room"),
                null,
                LocalDateTime.of(today.plusDays(10), LocalTime.of(14, 0)),
                LocalDateTime.of(today.plusDays(12), LocalTime.of(12, 0)),
                "pending",
                "pending_payment",
                null,
                null,
                now.plusSeconds(Math.max(60, pendingHoldSeconds - 5)),
                now,
                null,
                null
        );
    }

    private void ensureBookingScenario(List<Booking> existingBookings,
                                       User user,
                                       Room room,
                                       Coupon coupon,
                                       LocalDateTime checkIn,
                                       LocalDateTime checkOut,
                                       String status,
                                       String paymentStatus,
                                       LocalDateTime checkInActual,
                                       LocalDateTime checkOutActual,
                                       LocalDateTime expiresAt,
                                       LocalDateTime createdAt,
                                       String paymentMethod,
                                       LocalDateTime paymentDate) {
        if (user == null || room == null) {
            return;
        }

        Booking booking = findSeedBooking(existingBookings, user.getId(), room.getId()).orElseGet(Booking::new);
        booking.setUser(user);
        booking.setStatus(status);
        booking.setPaymentStatus(paymentStatus);
        booking.setExpiresAt(expiresAt);
        if (booking.getCreatedAt() == null) {
            booking.setCreatedAt(createdAt);
        }

        double subtotal = bookingService.calculatePriceIndex(checkIn, checkOut, room.getRoomType().getPricePerNight());
        double discountAmount = calculateSeedDiscount(coupon, subtotal);
        booking.setTotalPrice(subtotal);
        booking.setDiscountAmount(discountAmount);
        booking.setFinalAmount(Math.max(0.0, subtotal - discountAmount));
        booking.setCouponCode(coupon != null ? coupon.getCode() : null);
        booking = bookingRepository.save(booking);

        BookingDetail detail;
        if (booking.getDetails() != null && !booking.getDetails().isEmpty()) {
            detail = booking.getDetails().get(0);
        } else {
            detail = new BookingDetail();
            detail.setBooking(booking);
        }
        detail.setRoom(room);
        detail.setPriceAtBooking(room.getRoomType().getPricePerNight());
        detail.setCheckIn(checkIn);
        detail.setCheckOut(checkOut);
        detail.setCheckInActual(checkInActual);
        detail.setCheckOutActual(checkOutActual);
        detail.setTotalHours(bookingService.calculateHours(checkIn, checkOut));
        detail = bookingDetailRepository.save(detail);

        if (booking.getDetails() == null || booking.getDetails().isEmpty()) {
            booking.setDetails(new ArrayList<>(List.of(detail)));
            bookingRepository.save(booking);
            existingBookings.add(booking);
        }

        syncSeedPayment(booking, paymentStatus, paymentMethod, paymentDate);
    }

    private void syncSeedPayment(Booking booking, String paymentStatus, String paymentMethod, LocalDateTime paymentDate) {
        if (booking == null || booking.getId() == null) {
            return;
        }

        if (!"paid".equalsIgnoreCase(paymentStatus)) {
            paymentRepository.deleteByBookingId(booking.getId());
            return;
        }

        Payment payment = paymentRepository.findTopByBooking_IdOrderByPaymentDateDesc(booking.getId()).orElseGet(Payment::new);
        payment.setBooking(booking);
        payment.setAmount(booking.getFinalAmount() != null ? booking.getFinalAmount() : booking.getTotalPrice());
        payment.setPaymentMethod(paymentMethod == null || paymentMethod.isBlank() ? "CASH" : paymentMethod);
        payment.setPaymentDate(paymentDate == null ? LocalDateTime.now() : paymentDate);
        payment.setStatus("paid");
        paymentRepository.save(payment);
    }

    private Optional<Booking> findSeedBooking(List<Booking> existingBookings, Integer userId, Integer roomId) {
        return existingBookings.stream()
                .filter(booking -> booking.getUser() != null && userId.equals(booking.getUser().getId()))
                .filter(booking -> booking.getDetails() != null && !booking.getDetails().isEmpty())
                .filter(booking -> booking.getDetails().stream().anyMatch(detail ->
                        detail.getRoom() != null && roomId.equals(detail.getRoom().getId())))
                .findFirst();
    }

    private RoomType resolveRoomType(List<RoomType> roomTypes, int preferredIndex) {
        if (roomTypes.isEmpty()) {
            throw new IllegalStateException("Không có room type để seed dữ liệu demo.");
        }

        int safeIndex = Math.floorMod(preferredIndex, roomTypes.size());
        return roomTypes.get(safeIndex);
    }

    private double calculateSeedDiscount(Coupon coupon, double subtotal) {
        if (coupon == null) {
            return 0.0;
        }

        double discount;
        if ("PERCENT".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = subtotal * (coupon.getDiscountValue() == null ? 0.0 : coupon.getDiscountValue()) / 100.0;
            if (coupon.getMaxDiscountAmount() != null && coupon.getMaxDiscountAmount() > 0) {
                discount = Math.min(discount, coupon.getMaxDiscountAmount());
            }
        } else {
            discount = coupon.getDiscountValue() == null ? 0.0 : coupon.getDiscountValue();
        }

        return Math.min(subtotal, Math.max(0.0, discount));
    }

    private record UserSeed(
            String key,
            String fullName,
            String email,
            String phone,
            String role,
            String password,
            LocalDateTime createdAt
    ) {
    }

    private record RoomSeed(
            String key,
            String roomNumber,
            int roomTypeIndex,
            String status
    ) {
    }

    private record CouponSeed(
            String code,
            String name,
            String description,
            String discountType,
            double discountValue,
            double minOrderValue,
            Double maxDiscountAmount,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Integer usageLimit,
            boolean isActive
    ) {
    }

    private record ContactSeed(
            String firstName,
            String lastName,
            String email,
            String status,
            String adminNote,
            String message,
            LocalDateTime createdAt
    ) {
    }
}
