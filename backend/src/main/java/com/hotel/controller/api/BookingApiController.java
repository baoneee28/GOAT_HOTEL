package com.hotel.controller.api;

import com.hotel.entity.Booking;
import com.hotel.entity.BookingDetail;
import com.hotel.entity.Room;
import com.hotel.entity.User;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.BookingService;
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

            Integer roomId = Integer.parseInt(roomIdRaw);
            LocalDateTime checkIn = parseDate(checkInRaw);
            LocalDateTime checkOut = parseDate(checkOutRaw);

            Booking activeBooking = bookingService.getActiveBooking(currentUser.getId());
            if (activeBooking != null) {
                String roomNum = "N/A";
                if(activeBooking.getDetails() != null && !activeBooking.getDetails().isEmpty()){
                    roomNum = activeBooking.getDetails().get(0).getRoom().getRoomNumber();
                }
                response.put("success", false);
                response.put("message", "Bạn đang giữ chỗ phòng " + roomNum + ". Vui lòng hoàn thành đơn cũ.");
                return ResponseEntity.badRequest().body(response);
            }

            String error = bookingService.bookRoom(currentUser, roomId, checkIn, checkOut);
            if (error != null) {
                response.put("success", false);
                response.put("message", error);
                return ResponseEntity.badRequest().body(response);
            }

            response.put("success", true);
            response.put("message", "Đặt phòng thành công!");
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
        response.put("bookings", historyPage.getContent());
        response.put("totalPages", historyPage.getTotalPages());
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
        response.put("booking", booking);
        return ResponseEntity.ok(response);
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
            @RequestParam(value = "page", defaultValue = "1") int page) {
        
        Page<Booking> bookingPage = bookingRepository.findAdminBookings(
                status.isBlank() ? null : status,
                PageRequest.of(page - 1, 5));

        Map<String, Object> response = new HashMap<>();
        response.put("bookings", bookingPage.getContent());
        response.put("totalPages", bookingPage.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/bookings")
    public ResponseEntity<Map<String, Object>> saveAdminBooking(@RequestBody Map<String, String> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            String bookingIdStr = payload.get("id");
            Integer userId = Integer.parseInt(payload.get("userId"));
            Integer roomId = Integer.parseInt(payload.get("roomId"));
            LocalDateTime checkIn = parseDate(payload.get("checkIn"));
            LocalDateTime checkOut = parseDate(payload.get("checkOut"));
            String status = payload.get("status");

            Optional<Room> roomOpt = roomRepository.findById(roomId);
            if (roomOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Phòng không tồn tại");
                return ResponseEntity.badRequest().body(response);
            }

            Room room = roomOpt.get();
            double pricePerHour = room.getRoomType().getPricePerNight();
            Map<String, Double> priceInfo = bookingService.calculateBookingPriceAdmin(checkIn, checkOut, pricePerHour);
            double totalHours = priceInfo.get("hours");
            double totalPrice = priceInfo.get("total");

            if (bookingIdStr != null && !bookingIdStr.isBlank()) {
                Integer existingBookingId = Integer.parseInt(bookingIdStr);
                Optional<Booking> existingOpt = bookingRepository.findById(existingBookingId);
                if (existingOpt.isEmpty()) {
                    response.put("success", false);
                    return ResponseEntity.badRequest().body(response);
                }
                
                long overlapCount = bookingRepository.countOverlappingBookingsExcept(roomId, checkIn, checkOut, existingBookingId);
                if (overlapCount > 0 && !"cancelled".equalsIgnoreCase(status) && !"refused".equalsIgnoreCase(status)) {
                    response.put("success", false);
                    response.put("message", "Xung đột lịch! Đã có đơn đặt phòng khác được duyệt trong thời gian này.");
                    return ResponseEntity.badRequest().body(response);
                }

                Booking existing = existingOpt.get();
                existing.setTotalPrice(totalPrice);
                existing.setStatus(status);
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
                long overlapCount = bookingRepository.countOverlappingBookings(roomId, checkIn, checkOut);
                if (overlapCount > 0 && !"cancelled".equalsIgnoreCase(status) && !"refused".equalsIgnoreCase(status)) {
                    response.put("success", false);
                    response.put("message", "Xung đột lịch! Đã có đơn đặt phòng khác được duyệt trong thời gian này.");
                    return ResponseEntity.badRequest().body(response);
                }

                Booking booking = new Booking();
                booking.setUser(user);
                booking.setStatus(status);
                booking.setTotalPrice(totalPrice);
                booking = bookingRepository.save(booking);
                
                BookingDetail detail = new BookingDetail();
                detail.setBooking(booking);
                detail.setRoom(room);
                detail.setPriceAtBooking(pricePerHour);
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

        if ("recalc".equals(checkoutType)) {
            LocalDateTime now = LocalDateTime.now();
            double pricePerHour = detail.getPriceAtBooking();
            Map<String, Double> priceInfo = bookingService.calculateBookingPriceAdmin(detail.getCheckIn(), now, pricePerHour);

            detail.setCheckOut(now);
            detail.setCheckOutActual(now);
            detail.setTotalHours(priceInfo.get("hours"));
            bookingDetailRepository.save(detail);
            
            booking.setTotalPrice(priceInfo.get("total"));
            booking.setStatus("completed");
        } else {
            booking.setStatus("completed");
        }

        bookingRepository.save(booking);
        if(room != null) {
            room.setStatus("available");
            roomRepository.save(room);
        }

        response.put("success", true);
        response.put("message", "Thanh toán (Checkout) Đơn đặt phòng thành công.");
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
        if (!"pending".equals(booking.getStatus())) {
            response.put("success", false);
            response.put("message", "Chỉ có thể duyệt đơn đang chờ.");
            return ResponseEntity.badRequest().body(response);
        }
        booking.setStatus("confirmed");
        bookingRepository.save(booking);
        response.put("success", true);
        response.put("message", "Đã duyệt đơn phòng.");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/admin/bookings/{id}")
    public ResponseEntity<Map<String, Object>> deleteAdminBooking(@PathVariable("id") Integer id) {
        Map<String, Object> response = new HashMap<>();
        try {
            bookingRepository.deleteById(id);
            response.put("success", true);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Không thể xóa đơn đặt phòng: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }
}
