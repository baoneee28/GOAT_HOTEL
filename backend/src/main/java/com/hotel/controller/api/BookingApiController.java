package com.hotel.controller.api;

import com.hotel.entity.Booking;
import com.hotel.entity.BookingDetail;
import com.hotel.entity.Room;
import com.hotel.entity.User;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.AuthService;
import com.hotel.service.BookingService;
import com.hotel.service.PaymentService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class BookingApiController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private BookingDetailRepository bookingDetailRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private AuthService authService;

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private User getSessionUser(HttpSession session) {
        Object userObj = session.getAttribute("user");
        return userObj instanceof User ? (User) userObj : null;
    }

    private ResponseEntity<Map<String, Object>> authRequiredResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Vui lòng đăng nhập để tiếp tục.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    private LocalDateTime parseDate(String dateStr) {
        if (dateStr.contains("T")) {
            dateStr = dateStr.replace("T", " ");
        }
        if (dateStr.length() == 10) { dateStr += " 12:00"; }
        return LocalDateTime.parse(dateStr, formatter);
    }

    private String requirePayloadField(Map<String, String> payload, String key, String label) {
        String value = payload.get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " không được để trống.");
        }
        return value.trim();
    }

    @PostMapping("/bookings")
    public ResponseEntity<Map<String, Object>> bookRoom(@RequestBody Map<String, String> payload, HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        try {
            User currentUser = getSessionUser(session);
            if (currentUser == null) {
                return authRequiredResponse();
            }

            String roomIdRaw = requirePayloadField(payload, "roomId", "Phòng");
            String checkInRaw = requirePayloadField(payload, "checkIn", "Ngày nhận phòng");
            String checkOutRaw = requirePayloadField(payload, "checkOut", "Ngày trả phòng");
            String paymentFlow = payload.get("paymentFlow");
            String couponCode = payload.get("couponCode");

            Integer roomId = Integer.parseInt(roomIdRaw);
            LocalDateTime checkIn = parseDate(checkInRaw);
            LocalDateTime checkOut = parseDate(checkOutRaw);

            Booking createdBooking = bookingService.createBooking(currentUser, roomId, checkIn, checkOut, paymentFlow, couponCode);

            response.put("success", true);
            response.put(
                    "message",
                    "vnpay".equalsIgnoreCase(paymentFlow) || "vnpay_demo".equalsIgnoreCase(paymentFlow)
                            ? "Đã tạo booking giữ chỗ chờ thanh toán VNPay demo. Giữ chỗ có hiệu lực trong " + bookingService.getPendingHoldDisplayText() + "."
                            : "Đã tạo booking giữ chỗ. Phòng sẽ được giữ trong " + bookingService.getPendingHoldDisplayText() + " để chờ khách sạn xác nhận."
            );
            response.put("bookingId", createdBooking.getId());
            response.put("bookingStatus", createdBooking.getStatus());
            response.put("paymentStatus", createdBooking.getPaymentStatus());
            response.put("expiresAt", createdBooking.getExpiresAt());
            response.put("couponCode", createdBooking.getCouponCode());
            response.put("discountAmount", createdBooking.getDiscountAmount());
            response.put("finalAmount", createdBooking.getFinalAmount());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi dữ liệu đầu vào: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/bookings/history")
    public ResponseEntity<Map<String, Object>> getHistory(
            @RequestParam(value = "status", defaultValue = "") String status,
            @RequestParam(value = "page", defaultValue = "1") int page,
            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }

        Page<Booking> historyPage = bookingService.getHistory(currentUser.getId(), status.isBlank() ? null : status, page);
        Map<String, Object> response = new HashMap<>();
        response.put("bookings", bookingService.normalizeBookingFinancials(historyPage.getContent()));
        response.put("totalPages", historyPage.getTotalPages());
        response.put("statusSummary", bookingService.countHistoryStatuses(currentUser.getId()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<Map<String, Object>> getBookingDetail(@PathVariable("id") Integer id, HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }

        Map<String, Object> response = new HashMap<>();
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Không tìm thấy đơn đặt phòng.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        Booking booking = bookingOpt.get();
        if (booking.getUser() == null || !currentUser.getId().equals(booking.getUser().getId())) {
            response.put("success", false);
            response.put("message", "Bạn không có quyền xem đơn đặt phòng này.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        response.put("success", true);
        response.put("booking", bookingService.normalizeBookingFinancials(booking));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bookings/{id}/deposit")
    public ResponseEntity<Map<String, Object>> collectDepositPayment(@PathVariable("id") Integer id, HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }

        Map<String, Object> response = new HashMap<>();
        try {
            Booking booking = paymentService.collectDepositPayment(id, currentUser.getId());
            response.put("success", true);
            response.put("message", "Da ghi nhan dat coc 30% va xac nhan booking.");
            response.put("bookingId", booking.getId());
            response.put("bookingStatus", booking.getStatus());
            response.put("paymentStatus", booking.getPaymentStatus());
            response.put("booking", bookingService.normalizeBookingFinancials(booking));
            return ResponseEntity.ok(response);
        } catch (SecurityException ex) {
            response.put("success", false);
            response.put("message", ex.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (IllegalArgumentException ex) {
            response.put("success", false);
            response.put("message", ex.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Map<String, Object>> cancelBooking(@PathVariable("id") Integer id, HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }

        boolean success = bookingService.cancelBooking(id, currentUser.getId());
        Map<String, Object> response = new HashMap<>();
        if (success) {
            response.put("success", true);
            response.put("message", "Hủy phòng thành công");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Không thể hủy phòng (Đã duyệt hoặc không phải của bạn)");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/admin/bookings")
    public ResponseEntity<Map<String, Object>> listAdminBookings(
            @RequestParam(value = "status", defaultValue = "") String status,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "bookingId", required = false) Integer bookingId,
            @RequestParam(value = "fromDateTime", required = false) String fromDateTime,
            @RequestParam(value = "toDateTime", required = false) String toDateTime) {
        bookingService.expirePendingBookings();

        Map<String, Object> response = new HashMap<>();
        if (bookingId != null) {
            Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
            List<Booking> bookings = bookingOpt
                    .map(booking -> List.of(bookingService.normalizeBookingFinancials(booking)))
                    .orElseGet(List::of);
            response.put("bookings", bookings);
            response.put("totalPages", 1);
            response.put("currentPage", 1);
            return ResponseEntity.ok(response);
        }

        boolean hasDateFilter = fromDateTime != null && !fromDateTime.isBlank()
                && toDateTime != null && !toDateTime.isBlank();
        if (hasDateFilter) {
            LocalDateTime from = parseDate(fromDateTime);
            LocalDateTime to = parseDate(toDateTime);
            if (!to.isAfter(from)) {
                response.put("success", false);
                response.put("message", "Khoang thoi gian loc booking khong hop le.");
                return ResponseEntity.badRequest().body(response);
            }

            List<Booking> filteredBookings = bookingRepository.findAllAdminBookings(status.isBlank() ? null : status)
                    .stream()
                    .filter(booking -> overlapsBookingWindow(booking, from, to))
                    .map(bookingService::normalizeBookingFinancials)
                    .toList();

            int safePageSize = 5;
            int totalPages = Math.max(1, (int) Math.ceil((double) filteredBookings.size() / safePageSize));
            int safePage = Math.min(Math.max(1, page), totalPages);
            int fromIndex = Math.min((safePage - 1) * safePageSize, filteredBookings.size());
            int toIndex = Math.min(fromIndex + safePageSize, filteredBookings.size());

            response.put("bookings", filteredBookings.subList(fromIndex, toIndex));
            response.put("totalPages", totalPages);
            response.put("currentPage", safePage);
            return ResponseEntity.ok(response);
        }

        Page<Booking> bookingPage = bookingRepository.findAdminBookings(
                status.isBlank() ? null : status,
                PageRequest.of(page - 1, 5));

        response.put("bookings", bookingService.normalizeBookingFinancials(bookingPage.getContent()));
        response.put("totalPages", bookingPage.getTotalPages());
        response.put("currentPage", page);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/bookings")
    public ResponseEntity<Map<String, Object>> saveAdminBooking(@RequestBody Map<String, String> payload,
                                                                HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        User currentUser = getSessionUser(session);
        if (!authService.isAdmin(currentUser)) {
            response.put("success", false);
            response.put("message", "Nhan vien chi duoc xu ly van hanh booking, khong duoc tao hoac sua booking.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
        try {
            String bookingIdStr = payload.get("id");
            Integer userId = Integer.parseInt(payload.get("userId"));
            Integer roomId = Integer.parseInt(payload.get("roomId"));
            LocalDateTime checkIn = parseDate(payload.get("checkIn"));
            LocalDateTime checkOut = parseDate(payload.get("checkOut"));
            String requestedStatus = payload.get("status");

            Optional<Room> roomOpt = roomRepository.findById(roomId);
            if (roomOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Phòng không tồn tại");
                return ResponseEntity.badRequest().body(response);
            }

            Room room = roomOpt.get();
            double pricePerNight = room.getRoomType().getPricePerNight();
            Map<String, Double> priceInfo = bookingService.calculateBookingPriceAdmin(checkIn, checkOut, pricePerNight);
            double totalHours = priceInfo.get("hours");
            double totalPrice = priceInfo.get("total");
            LocalDateTime now = LocalDateTime.now();

            if (bookingIdStr != null && !bookingIdStr.isBlank()) {
                Integer existingBookingId = Integer.parseInt(bookingIdStr);
                Optional<Booking> existingOpt = bookingRepository.findById(existingBookingId);
                if (existingOpt.isEmpty()) {
                    response.put("success", false);
                    return ResponseEntity.badRequest().body(response);
                }
                
                Booking existing = existingOpt.get();
                bookingService.normalizeBookingFinancials(existing);
                String previousStatus = existing.getStatus();
                String nextStatus = bookingService.validateAdminEditableStatus(previousStatus, requestedStatus);
                long overlapCount = bookingRepository.countOverlappingBookingsExcept(roomId, checkIn, checkOut, existingBookingId, now);
                if (overlapCount > 0
                        && !"cancelled".equalsIgnoreCase(nextStatus)
                        && !"expired".equalsIgnoreCase(nextStatus)
                        && !"refused".equalsIgnoreCase(nextStatus)) {
                    response.put("success", false);
                    response.put("message", "Xung đột lịch! Đã có đơn đặt phòng khác được duyệt trong thời gian này.");
                    return ResponseEntity.badRequest().body(response);
                }

                existing.setTotalPrice(totalPrice);
                existing.setFinalAmount(Math.max(0.0, totalPrice - (existing.getDiscountAmount() == null ? 0.0 : existing.getDiscountAmount())));
                existing.setStatus(nextStatus);
                existing.setPaymentStatus(bookingService.normalizeAdminPaymentStatus(existing.getPaymentStatus(), nextStatus));
                bookingService.preparePendingBooking(existing, previousStatus);
                bookingRepository.save(existing);
                
                if (existing.getDetails() != null && !existing.getDetails().isEmpty()) {
                    BookingDetail detail = existing.getDetails().get(0);
                    detail.setCheckIn(checkIn);
                    detail.setCheckOut(checkOut);
                    detail.setTotalHours(totalHours);
                    detail.setRoom(room);
                    bookingDetailRepository.save(detail);

                    // KHÔNG CẬP NHẬT TRẠNG THÁI BOOKED VẬT LÝ NỮA
                }

            } else {
                User user = userRepository.findById(userId).orElse(null);
                if (user == null) {
                    response.put("success", false);
                    response.put("message", "Khách hàng không tồn tại!");
                    return ResponseEntity.badRequest().body(response);
                }

                // Check overlap cho Admin
                String initialStatus = bookingService.validateAdminCreateStatus(requestedStatus);
                long overlapCount = bookingRepository.countOverlappingBookings(roomId, checkIn, checkOut, now);
                if (overlapCount > 0
                        && !"cancelled".equalsIgnoreCase(initialStatus)
                        && !"expired".equalsIgnoreCase(initialStatus)
                        && !"refused".equalsIgnoreCase(initialStatus)) {
                    response.put("success", false);
                    response.put("message", "Xung đột lịch! Đã có đơn đặt phòng khác được duyệt trong thời gian này.");
                    return ResponseEntity.badRequest().body(response);
                }

                Booking booking = new Booking();
                booking.setUser(user);
                booking.setStatus(initialStatus);
                booking.setPaymentStatus(bookingService.normalizeAdminPaymentStatus(null, initialStatus));
                booking.setTotalPrice(totalPrice);
                booking.setFinalAmount(totalPrice);
                bookingService.preparePendingBooking(booking, null);
                booking = bookingRepository.save(booking);
                
                BookingDetail detail = new BookingDetail();
                detail.setBooking(booking);
                detail.setRoom(room);
                detail.setPriceAtBooking(pricePerNight);
                detail.setCheckIn(checkIn);
                detail.setCheckOut(checkOut);
                detail.setTotalHours(totalHours);
                bookingDetailRepository.save(detail);

                // KHÔNG CẬP NHẬT TRẠNG THÁI BOOKED VẬT LÝ, HỆ THỐNG DÙNG DATE OVERLAP
            }
            response.put("success", true);
            response.put("message", "Đã lưu đơn đặt phòng.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    private boolean overlapsBookingWindow(Booking booking, LocalDateTime from, LocalDateTime to) {
        if (booking == null || booking.getDetails() == null) {
            return false;
        }
        for (BookingDetail detail : booking.getDetails()) {
            if (detail == null || detail.getCheckIn() == null || detail.getCheckOut() == null) {
                continue;
            }
            if (detail.getCheckIn().isBefore(to) && detail.getCheckOut().isAfter(from)) {
                return true;
            }
        }
        return false;
    }

    @PostMapping("/admin/bookings/{id}/checkout")
    public ResponseEntity<Map<String, Object>> checkoutAdmin(
            @PathVariable("id") Integer id,
            @RequestBody Map<String, String> payload) {
        
        String checkoutType = payload.get("checkoutType");
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        Map<String, Object> response = new HashMap<>();
        if (bookingOpt.isEmpty()) {
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        }

        Booking booking = bookingOpt.get();
        if (booking.getDetails() == null || booking.getDetails().isEmpty()) {
            response.put("success", false);
            response.put("message", "Đơn lưu trú không có phòng.");
            return ResponseEntity.badRequest().body(response);
        }
        
        BookingDetail detail = booking.getDetails().get(0);
        Room room = detail.getRoom();
        if (!"confirmed".equalsIgnoreCase(booking.getStatus())) {
            response.put("success", false);
            response.put("message", "Chỉ có thể trả phòng cho đơn đã xác nhận.");
            return ResponseEntity.badRequest().body(response);
        }
        if (detail.getCheckInActual() == null) {
            response.put("success", false);
            response.put("message", "Khách chưa nhận phòng. Hãy check-in trước khi checkout.");
            return ResponseEntity.badRequest().body(response);
        }
        if (detail.getCheckOutActual() != null) {
            response.put("success", false);
            response.put("message", "Đơn này đã được checkout trước đó.");
            return ResponseEntity.badRequest().body(response);
        }
        if (!"paid".equalsIgnoreCase(booking.getPaymentStatus())) {
            response.put("success", false);
            response.put("message", "Chỉ có thể checkout booking đã thanh toán. Hãy thu tiền trước khi checkout.");
            return ResponseEntity.badRequest().body(response);
        }

        if ("recalc".equals(checkoutType)) {
            LocalDateTime now = LocalDateTime.now();
            double pricePerNight = detail.getPriceAtBooking();
            LocalDateTime actualStayStart = detail.getCheckInActual() != null ? detail.getCheckInActual() : detail.getCheckIn();
            Map<String, Double> priceInfo = bookingService.calculateBookingPriceAdmin(actualStayStart, now, pricePerNight);

            detail.setCheckOutActual(now);
            detail.setTotalHours(priceInfo.get("hours"));
            bookingDetailRepository.save(detail);
            
            booking.setTotalPrice(priceInfo.get("total"));
            booking.setFinalAmount(Math.max(0.0, priceInfo.get("total") - (booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount())));
            booking.setStatus("completed");
        } else {
            detail.setCheckOutActual(LocalDateTime.now());
            bookingDetailRepository.save(detail);
            booking.setStatus("completed");
            booking.setFinalAmount(Math.max(0.0, (booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0) - (booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount())));
        }

        bookingRepository.save(booking);
        if(room != null) {
            room.setStatus("available");
            roomRepository.save(room);
        }

        response.put("success", true);
        response.put("message", "Checkout đơn đặt phòng thành công.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/bookings/{id}/checkin")
    public ResponseEntity<Map<String, Object>> checkInAdmin(@PathVariable("id") Integer id) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        Map<String, Object> response = new HashMap<>();
        if (bookingOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Đơn không tồn tại.");
            return ResponseEntity.badRequest().body(response);
        }

        Booking booking = bookingOpt.get();
        if (!"confirmed".equalsIgnoreCase(booking.getStatus())) {
            response.put("success", false);
            response.put("message", "Chỉ có thể nhận phòng cho đơn đã xác nhận.");
            return ResponseEntity.badRequest().body(response);
        }
        if (booking.getDetails() == null || booking.getDetails().isEmpty()) {
            response.put("success", false);
            response.put("message", "Đơn lưu trú không có phòng.");
            return ResponseEntity.badRequest().body(response);
        }

        BookingDetail detail = booking.getDetails().get(0);
        if (detail.getCheckInActual() != null && detail.getCheckOutActual() == null) {
            response.put("success", false);
            response.put("message", "Khách đã nhận phòng rồi.");
            return ResponseEntity.badRequest().body(response);
        }
        if (detail.getCheckOutActual() != null) {
            response.put("success", false);
            response.put("message", "Đơn này đã checkout, không thể check-in lại.");
            return ResponseEntity.badRequest().body(response);
        }

        LocalDateTime now = LocalDateTime.now();
        try {
            bookingService.validateAdminCheckInTime(detail, now);
        } catch (IllegalArgumentException ex) {
            response.put("success", false);
            response.put("message", ex.getMessage());
            return ResponseEntity.badRequest().body(response);
        }

        if (detail.getRoom() != null && "maintenance".equalsIgnoreCase(detail.getRoom().getStatus())) {
            response.put("success", false);
            response.put("message", "Phòng đang ở trạng thái bảo trì, không thể check-in.");
            return ResponseEntity.badRequest().body(response);
        }

        detail.setCheckInActual(now);
        detail.setCheckOutActual(null);
        bookingDetailRepository.save(detail);

        response.put("success", true);
        response.put("message", "Đã nhận phòng thành công.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/bookings/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveAdminBooking(@PathVariable("id") Integer id) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        Map<String, Object> response = new HashMap<>();
        if (bookingOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Đơn không tồn tại.");
            return ResponseEntity.badRequest().body(response);
        }
        Booking booking = bookingOpt.get();
        bookingService.normalizeBookingFinancials(booking);
        if (!"pending".equals(booking.getStatus())) {
            response.put("success", false);
            if ("expired".equalsIgnoreCase(booking.getStatus())) {
                response.put("message", "Đơn này đã hết hạn giữ chỗ nên không thể duyệt nữa.");
            } else if ("cancelled".equalsIgnoreCase(booking.getStatus())) {
                response.put("message", "Đơn này đã bị hủy nên không thể duyệt.");
            } else if ("confirmed".equalsIgnoreCase(booking.getStatus())) {
                response.put("message", "Đơn này đã được duyệt trước đó.");
            } else if ("completed".equalsIgnoreCase(booking.getStatus())) {
                response.put("message", "Đơn này đã hoàn thành nên không thể duyệt lại.");
            } else {
                response.put("message", "Chỉ có thể duyệt đơn đang chờ.");
            }
            return ResponseEntity.badRequest().body(response);
        }
        booking.setStatus("confirmed");
        booking.setPaymentStatus(bookingService.normalizeAdminPaymentStatus(booking.getPaymentStatus(), "confirmed"));
        bookingRepository.save(booking);
        response.put("success", true);
        response.put("message", "Đã duyệt đơn phòng.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/bookings/{id}/collect-cash-payment")
    public ResponseEntity<Map<String, Object>> collectCashPayment(@PathVariable("id") Integer id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Booking booking = paymentService.collectCashPayment(id);
            response.put("success", true);
            response.put("message", "Đã ghi nhận thanh toán tiền mặt.");
            response.put("bookingId", booking.getId());
            response.put("bookingStatus", booking.getStatus());
            response.put("paymentStatus", booking.getPaymentStatus());
            response.put("booking", bookingService.normalizeBookingFinancials(booking));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            response.put("success", false);
            response.put("message", ex.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/admin/bookings/{id}")
    public ResponseEntity<Map<String, Object>> deleteAdminBooking(@PathVariable("id") Integer id) {
        Map<String, Object> response = new HashMap<>();
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Không tìm thấy đơn đặt phòng.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        response.put("success", false);
        response.put("message", "GOAT HOTEL không hỗ trợ xóa cứng booking. Hãy giữ đơn ở trạng thái cancelled để lưu lịch sử.");
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(response);
    }
}
