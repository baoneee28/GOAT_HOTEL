import os

BASE = r"d:\webProject\GOAT_HOTEL\backend\src\main\java\com\hotel"

def write(path, content):
    with open(os.path.join(BASE, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 1. RoomController.java
room_ctrl = """
package com.hotel.controller;

import com.hotel.entity.Room;
import com.hotel.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@SuppressWarnings("null")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private com.hotel.repository.ItemRepository itemRepository;

    @PostMapping(value = "/get-rooms", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getRoomsByType(@RequestParam Integer type_id) {
        List<Room> rooms = roomRepository.findByRoomTypeIdOrderByRoomNumberAsc(type_id);
        if (rooms.isEmpty()) {
            return ResponseEntity.ok("<div class=\\"col-12 text-center text-muted\\">Chưa có phòng nào thuộc hạng mục này.</div>");
        }

        StringBuilder html = new StringBuilder();
        for (Room room : rooms) {
            String statusValue = room.getStatus();
            boolean isAvailable = "available".equals(statusValue);
            String statusClass;
            String statusText;
            
            if ("available".equals(statusValue)) {
                statusClass = "room-available";
                statusText = "Trống";
            } else if ("maintenance".equals(statusValue)) {
                statusClass = "bg-secondary text-white";
                statusText = "Đang sửa";
            } else {
                statusClass = "room-occupied";
                statusText = "Đang có khách";
            }

            List<com.hotel.entity.RoomTypeItem> roomItems = room.getRoomType().getItems();
            StringBuilder itemIconsHtml = new StringBuilder();
            StringBuilder itemNamesJson = new StringBuilder();
            
            if (roomItems != null && !roomItems.isEmpty()) {
                itemNamesJson.append("[");
                int count = 0;
                for (com.hotel.entity.RoomTypeItem ri : roomItems) {
                    com.hotel.entity.Item item = ri.getItem();
                    if (item != null) {
                        if (count < 3) {
                             itemIconsHtml.append("<img src=\\"").append(item.getImage()).append("\\" style=\\"width:16px;height:16px;margin:0 2px;\\" title=\\"").append(item.getName()).append("\\">");
                        }
                        if (count > 0) itemNamesJson.append(",");
                        itemNamesJson.append("{\\"name\\":\\"").append(item.getName().replace("\\"", "\\\\\\"")).append("\\",\\"icon\\":\\"").append(item.getImage()).append("\\"}");
                        count++;
                    }
                }
                itemNamesJson.append("]");
                if (count > 3) {
                    itemIconsHtml.append("<span style=\\"font-size:10px; margin-left:2px;\\">+").append(count - 3).append("</span>");
                }
            } else {
                itemNamesJson.append("[]");
            }

            String safeJson = itemNamesJson.toString().replace("'", "&#39;");

            String onclick = isAvailable
                    ? "onclick=\\"selectRoom(this, " + room.getId() + ", '" + room.getRoomNumber() + "')\\" data-items='" + safeJson + "'"
                    : "";

            html.append("<div class=\\"col-6 col-md-4 col-lg-3\\">");
            html.append("<div class=\\"room-box \\").append(statusClass).append("\\" \\").append(onclick).append(" style=\\"display:flex; flex-direction:column; align-items:center; justify-content:center;\\">");
            html.append("<div style=\\"margin-bottom:5px; height:20px;\\">").append(itemIconsHtml.toString()).append("</div>");
            html.append("<div class=\\"room-number\\">").append(room.getRoomNumber()).append("</div>");
            html.append("<div style=\\"font-size:0.85rem; margin-top:5px; opacity:0.9;\\">").append(statusText).append("</div>");
            html.append("</div></div>");
        }

        return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=UTF-8")
                .body(html.toString());
    }
}
"""

# 2. HomeController.java
home_ctrl = """
package com.hotel.controller;

import com.hotel.entity.Booking;
import com.hotel.entity.News;
import com.hotel.entity.RoomType;
import com.hotel.entity.User;
import com.hotel.repository.NewsRepository;
import com.hotel.repository.RoomTypeRepository;
import com.hotel.service.BookingService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/home")
public class HomeController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private NewsRepository newsRepository;

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> index(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        Booking activeBooking = null;

        if (session.getAttribute("user") != null) {
            User user = (User) session.getAttribute("user");
            activeBooking = bookingService.getActiveBooking(user.getId());
            response.put("user_logged_in", user);
        }

        List<RoomType> roomTypes = roomTypeRepository.findAll();
        List<News> newsList = newsRepository.findTop4ByOrderByIdDesc();

        response.put("active_booking", activeBooking);
        response.put("room_types", roomTypes);
        response.put("news_list", newsList);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/book")
    public ResponseEntity<Map<String, Object>> bookRoom(@RequestParam("room_id") Integer room_id,
                           @RequestParam("check_in") @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm") LocalDateTime check_in, 
                           @RequestParam("check_out") @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm") LocalDateTime check_out,
                           HttpSession session) {
        
        Map<String, Object> response = new HashMap<>();

        if (session.getAttribute("user") == null) {
            response.put("success", false);
            response.put("errorType", "auth");
            response.put("message", "Vui lòng đăng nhập để đặt phòng!");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        User user = (User) session.getAttribute("user");

        Booking activeBooking = bookingService.getActiveBooking(user.getId());
        if (activeBooking != null) {
            String roomNum = "N/A";
            if(activeBooking.getDetails() != null && !activeBooking.getDetails().isEmpty()){
                roomNum = activeBooking.getDetails().get(0).getRoom().getRoomNumber();
            }
            response.put("success", false);
            response.put("message", "Bạn đang giữ chỗ phòng " + roomNum + ". Vui lòng hoàn thành đơn cũ.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        String error = bookingService.bookRoom(user, room_id, check_in, check_out);
        
        if (error != null) {
            response.put("success", false);
            response.put("message", error);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        response.put("success", true);
        response.put("message", "Đặt phòng thành công!");
        return ResponseEntity.ok(response);
    }
}
"""

# 3. BookingService.java
booking_svc = """
package com.hotel.service;

import com.hotel.entity.Booking;
import com.hotel.entity.BookingDetail;
import com.hotel.entity.Room;
import com.hotel.entity.User;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private BookingDetailRepository bookingDetailRepository;

    @Autowired
    private RoomRepository roomRepository;

    public long calculatePriceIndex(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerHour) {
        long totalSeconds = ChronoUnit.SECONDS.between(checkIn, checkOut);
        double hours = totalSeconds / 3600.0;
        return (long) Math.ceil(hours * pricePerHour);
    }

    public double calculateHours(LocalDateTime checkIn, LocalDateTime checkOut) {
        long totalSeconds = ChronoUnit.SECONDS.between(checkIn, checkOut);
        double hours = totalSeconds / 3600.0;
        return Math.round(hours * 100.0) / 100.0;
    }

    public Map<String, Double> calculateBookingPriceAdmin(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerHour) {
        if (!checkOut.isAfter(checkIn)) {
            Map<String, Double> zero = new HashMap<>();
            zero.put("hours", 0.0);
            zero.put("total", 0.0);
            return zero;
        }

        long totalMinutes = ChronoUnit.MINUTES.between(checkIn, checkOut);
        long hours = totalMinutes / 60;
        long minutes = totalMinutes % 60;

        double finalHours;
        if (minutes > 30) {
            finalHours = hours + 1.0;
        } else if (minutes > 0) {
            finalHours = hours + 0.5;
        } else {
            finalHours = hours;
        }

        Map<String, Double> result = new HashMap<>();
        result.put("hours", finalHours);
        result.put("total", finalHours * pricePerHour);
        return result;
    }

    public Booking getActiveBooking(Integer userId) {
        List<Booking> list = bookingRepository.findActiveBookingByUserId(userId);
        return list.isEmpty() ? null : list.get(0);
    }

    @Transactional
    public String bookRoom(User user, Integer roomId, LocalDateTime checkIn, LocalDateTime checkOut) {
        if (!checkOut.isAfter(checkIn)) {
            return "Thời gian ra phải lớn hơn thời gian vào!";
        }
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) return "Phòng không tồn tại!";

        Room room = roomOpt.get();
        double pricePerHour = room.getRoomType().getPricePerNight();

        long totalPrice = calculatePriceIndex(checkIn, checkOut, pricePerHour);
        double totalHours = calculateHours(checkIn, checkOut);

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setTotalPrice((double) totalPrice);
        booking.setStatus("pending");
        booking = bookingRepository.save(booking);
        
        BookingDetail detail = new BookingDetail();
        detail.setBooking(booking);
        detail.setRoom(room);
        detail.setPriceAtBooking(pricePerHour);
        detail.setCheckIn(checkIn);
        detail.setCheckOut(checkOut);
        detail.setTotalHours(totalHours);
        bookingDetailRepository.save(detail);

        room.setStatus("booked");
        roomRepository.save(room);

        return null;
    }

    @Transactional
    public boolean cancelBooking(Integer bookingId, Integer userId) {
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) return false;

        Booking booking = bookingOpt.get();
        if (!booking.getUser().getId().equals(userId)) return false;
        if (!"pending".equals(booking.getStatus())) return false;

        booking.setStatus("cancelled");
        bookingRepository.save(booking);

        if(booking.getDetails() != null) {
            for(BookingDetail detail : booking.getDetails()){
                Room room = detail.getRoom();
                if(room != null){
                    room.setStatus("available");
                    roomRepository.save(room);
                }
            }
        }
        return true;
    }

    public Page<Booking> getHistory(Integer userId, String status, int page) {
        return bookingRepository.findByUserIdAndStatus(userId, status, PageRequest.of(page - 1, 5));
    }

    public double getTotalSpent(Integer userId) {
        Double total = bookingRepository.sumTotalPriceByUserIdAndCompleted(userId);
        return total != null ? total : 0;
    }
}
"""

# 4. BookingApiController.java
booking_api_ctrl = """
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
    private LocalDateTime parseDate(String dateStr) {
        if (dateStr.contains("T")) {
            dateStr = dateStr.replace("T", " ");
        }
        if (dateStr.length() == 10) { dateStr += " 12:00"; }
        return LocalDateTime.parse(dateStr, formatter);
    }

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
                String roomNum = "N/A";
                if(activeBooking.getDetails() != null && !activeBooking.getDetails().isEmpty()){
                    roomNum = activeBooking.getDetails().get(0).getRoom().getRoomNumber();
                }
                response.put("success", false);
                response.put("message", "Bạn đang giữ chỗ phòng " + roomNum + ". Vui lòng hoàn thành đơn cũ.");
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
            @RequestParam("userId") Integer userId,
            @RequestParam(value = "status", defaultValue = "") String status,
            @RequestParam(value = "page", defaultValue = "1") int page) {
        
        Page<Booking> historyPage = bookingService.getHistory(userId, status.isBlank() ? null : status, page);
        Map<String, Object> response = new HashMap<>();
        response.put("bookings", historyPage.getContent());
        response.put("totalPages", historyPage.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Map<String, Object>> cancelBooking(
            @PathVariable("id") Integer id,
            @RequestParam("userId") Integer userId) {
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
                Optional<Booking> existingOpt = bookingRepository.findById(Integer.parseInt(bookingIdStr));
                if (existingOpt.isEmpty()) {
                    response.put("success", false);
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
                }
            } else {
                User user = userRepository.findById(userId).orElse(null);
                if (user == null) {
                    response.put("success", false);
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
"""

# 5. AdminBookingController.java
admin_booking_ctrl = """
package com.hotel.controller.admin;

import com.hotel.entity.Booking;
import com.hotel.entity.BookingDetail;
import com.hotel.entity.Room;
import com.hotel.entity.User;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.lang.NonNull;

@Controller
@RequestMapping("/admin/bookings")
@SuppressWarnings("null")
public class AdminBookingController {

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private BookingDetailRepository bookingDetailRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingService bookingService;

    private static final int PAGE_SIZE = 5;

    @GetMapping
    public String listBookings(@RequestParam(defaultValue = "") String status,
                               @RequestParam(defaultValue = "1") int page,
                               Model model) {
        Page<Booking> bookingPage = bookingRepository.findAdminBookings(
                status.isBlank() ? null : status,
                PageRequest.of(page - 1, PAGE_SIZE));

        List<Room> availableRooms = roomRepository.findByStatus("available");
        List<User> allUsers = userRepository.findAll();

        model.addAttribute("bookings", bookingPage.getContent());
        model.addAttribute("totalPages", bookingPage.getTotalPages());
        model.addAttribute("currentPage", page);
        model.addAttribute("statusFilter", status);
        model.addAttribute("availableRooms", availableRooms);
        model.addAttribute("allUsers", allUsers);

        return "admin/bookings";
    }

    @PostMapping(params = "action=save")
    public String saveBooking(@RequestParam(required = false) Integer booking_id,
                              @RequestParam @NonNull Integer user_id,
                              @RequestParam @NonNull Integer room_id,
                              @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm") LocalDateTime check_in,
                              @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm") LocalDateTime check_out,
                              @RequestParam String status,
                              Model model) {
        Optional<Room> roomOpt = roomRepository.findById(room_id);
        if (roomOpt.isEmpty()) return "redirect:/admin/bookings";

        Room room = roomOpt.get();
        double pricePerHour = room.getRoomType().getPricePerNight();

        Map<String, Double> priceInfo = bookingService.calculateBookingPriceAdmin(check_in, check_out, pricePerHour);
        double totalHours = priceInfo.get("hours");
        double totalPrice = priceInfo.get("total");

        if (booking_id != null && booking_id > 0) {
            Optional<Booking> existingOpt = bookingRepository.findById(booking_id);
            if (existingOpt.isEmpty()) return "redirect:/admin/bookings";
            Booking existing = existingOpt.get();
            existing.setTotalPrice(totalPrice);
            existing.setStatus(status);
            bookingRepository.save(existing);
            
            if (existing.getDetails() != null && !existing.getDetails().isEmpty()) {
                BookingDetail detail = existing.getDetails().get(0);
                detail.setCheckIn(check_in);
                detail.setCheckOut(check_out);
                detail.setTotalHours(totalHours);
                detail.setRoom(room);
                bookingDetailRepository.save(detail);
            }
        } else {
            User user = userRepository.findById(user_id).orElse(null);
            if (user == null) return "redirect:/admin/bookings";

            Booking booking = new Booking();
            booking.setUser(user);
            booking.setStatus(status);
            booking.setTotalPrice(totalPrice);
            booking = bookingRepository.save(booking);
            
            BookingDetail detail = new BookingDetail();
            detail.setBooking(booking);
            detail.setRoom(room);
            detail.setPriceAtBooking(pricePerHour);
            detail.setCheckIn(check_in);
            detail.setCheckOut(check_out);
            detail.setTotalHours(totalHours);
            bookingDetailRepository.save(detail);

            room.setStatus("booked");
            roomRepository.save(room);
        }

        return "redirect:/admin/bookings";
    }

    @PostMapping(params = "action=checkout")
    public String checkout(@RequestParam @NonNull Integer booking_id,
                           @RequestParam String checkout_type) {
        Optional<Booking> bookingOpt = bookingRepository.findById(booking_id);
        if (bookingOpt.isEmpty()) return "redirect:/admin/bookings";

        Booking booking = bookingOpt.get();
        if (booking.getDetails() == null || booking.getDetails().isEmpty()) return "redirect:/admin/bookings";
        
        BookingDetail detail = booking.getDetails().get(0);
        Room room = detail.getRoom();

        if ("recalc".equals(checkout_type)) {
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

        if(room != null){
            room.setStatus("available");
            roomRepository.save(room);
        }

        return "redirect:/admin/bookings";
    }

    @PostMapping(params = "action=delete")
    public String deleteBooking(@RequestParam @NonNull Integer booking_id) {
        bookingRepository.deleteById(booking_id);
        return "redirect:/admin/bookings";
    }
}
"""

write(r"controller\RoomController.java", room_ctrl)
write(r"controller\HomeController.java", home_ctrl)
write(r"service\BookingService.java", booking_svc)
write(r"controller\api\BookingApiController.java", booking_api_ctrl)
write(r"controller\admin\AdminBookingController.java", admin_booking_ctrl)
print("Controllers refactored successfully")
