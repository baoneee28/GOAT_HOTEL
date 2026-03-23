package com.hotel.controller.api;

import com.hotel.entity.Booking;
import com.hotel.entity.Room;
import com.hotel.entity.User;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
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
@CrossOrigin(origins = "*")
public class BookingApiController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    // FE form `datetime-local` thường trả dạng "2023-10-15T14:30", hàm replace để đồng nhất "T" thành " "
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private LocalDateTime parseDate(String dateStr) {
        if (dateStr.contains("T")) {
            dateStr = dateStr.replace("T", " ");
        }
        if (dateStr.length() == 10) { dateStr += " 12:00"; } // Handle fallback
        return LocalDateTime.parse(dateStr, formatter);
    }

    // ==========================================
    // API CỦA NGƯỜI DÙNG KHÁCH HÀNG
    // ==========================================

    @PostMapping("/bookings")
    public ResponseEntity<Map<String, Object>> bookRoom(@RequestBody Map<String, String> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer userId = Integer.parseInt(payload.get("userId"));
            Integer roomId = Integer.parseInt(payload.get("roomId"));
            LocalDateTime checkIn = parseDate(payload.get("checkIn"));
            LocalDateTime checkOut = parseDate(payload.get("checkOut"));

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                response.put("success", false);
                response.put("message", "User không tồn tại");
                return ResponseEntity.badRequest().body(response);
            }

            Booking activeBooking = bookingService.getActiveBooking(userId);
            if (activeBooking != null) {
                response.put("success", false);
                response.put("message", "Bạn đang giữ chỗ phòng " + activeBooking.getRoom().getRoomNumber() + ". Vui lòng hoàn thành đơn cũ.");
                return ResponseEntity.badRequest().body(response);
            }

            String error = bookingService.bookRoom(user, roomId, checkIn, checkOut);
            if (error != null) {
                response.put("success", false);
                response.put("message", error);
                return ResponseEntity.badRequest().body(response);
            }

            response.put("success", true);
            response.put("message", "Đặt phòng thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi dữ liệu đầu vào: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/bookings/history")
    public ResponseEntity<Map<String, Object>> getHistory(
            @RequestParam Integer userId,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "1") int page) {
        
        Page<Booking> historyPage = bookingService.getHistory(userId, status.isBlank() ? null : status, page);
        Map<String, Object> response = new HashMap<>();
        response.put("bookings", historyPage.getContent());
        response.put("totalPages", historyPage.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Map<String, Object>> cancelBooking(
            @PathVariable Integer id,
            @RequestParam Integer userId) {
        boolean success = bookingService.cancelBooking(id, userId);
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

    // ==========================================
    // API CỦA ADMIN (QUẢN LÝ ĐƠN)
    // ==========================================

    @GetMapping("/admin/bookings")
    public ResponseEntity<Map<String, Object>> listAdminBookings(
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "1") int page) {
        
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
                Optional<Booking> existingOpt = bookingRepository.findById(Integer.parseInt(bookingIdStr));
                if (existingOpt.isEmpty()) {
                    response.put("success", false);
                    return ResponseEntity.badRequest().body(response);
                }
                Booking existing = existingOpt.get();
                existing.setCheckIn(checkIn);
                existing.setCheckOut(checkOut);
                existing.setTotalHours(totalHours);
                existing.setTotalPrice(totalPrice);
                existing.setStatus(status);
                bookingRepository.save(existing);
            } else {
                User user = userRepository.findById(userId).orElse(null);
                if (user == null) {
                    response.put("success", false);
                    return ResponseEntity.badRequest().body(response);
                }
                Booking booking = new Booking();
                booking.setUser(user);
                booking.setRoom(room);
                booking.setCheckIn(checkIn);
                booking.setCheckOut(checkOut);
                booking.setTotalHours(totalHours);
                booking.setTotalPrice(totalPrice);
                booking.setStatus(status);
                bookingRepository.save(booking);

                room.setStatus("booked");
                roomRepository.save(room);
            }
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/admin/bookings/{id}/checkout")
    public ResponseEntity<Map<String, Object>> checkoutAdmin(
            @PathVariable Integer id,
            @RequestBody Map<String, String> payload) {
        
        String checkoutType = payload.get("checkoutType");
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        Map<String, Object> response = new HashMap<>();
        if (bookingOpt.isEmpty()) {
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        }

        Booking booking = bookingOpt.get();
        Room room = booking.getRoom();

        if ("recalc".equals(checkoutType)) {
            LocalDateTime now = LocalDateTime.now();
            double pricePerHour = room.getRoomType().getPricePerNight();
            Map<String, Double> priceInfo = bookingService.calculateBookingPriceAdmin(booking.getCheckIn(), now, pricePerHour);

            booking.setCheckOut(now);
            booking.setCheckOutActual(now);
            booking.setTotalHours(priceInfo.get("hours"));
            booking.setTotalPrice(priceInfo.get("total"));
            booking.setStatus("completed");
        } else {
            booking.setStatus("completed");
        }

        bookingRepository.save(booking);
        room.setStatus("available");
        roomRepository.save(room);

        response.put("success", true);
        response.put("message", "Thanh toán (Checkout) Đơn đặt phòng thành công.");
        return ResponseEntity.ok(response);
    }
}
