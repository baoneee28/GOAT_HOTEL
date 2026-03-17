package com.hotel.controller.admin;

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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.lang.NonNull;


// Controller quản lý toàn bộ Đơn Đặt Phòng trong trang Admin
@Controller
@RequestMapping("/admin/bookings")
@SuppressWarnings("null")
public class AdminBookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;



    @Autowired
    private BookingService bookingService;

    private static final int PAGE_SIZE = 5;

    
    // Load danh sách đơn đặt phòng (có phân trang và lọc theo trạng thái)
    @GetMapping
    public String listBookings(@RequestParam(defaultValue = "") String status, // Lấy trạng thái cần lọc từ URL (?status=pending)
                               @RequestParam(defaultValue = "1") int page,     // Lấy số trang hiện tại, mặc định là 1
                               Model model) {
        // Query DB lấy danh sách đơn (mỗi trang hiển thị 5 đơn - PAGE_SIZE)
        Page<Booking> bookingPage = bookingRepository.findAdminBookings(
                status.isBlank() ? null : status,
                PageRequest.of(page - 1, PAGE_SIZE));

        // Lấy thêm danh sách phòng trống và danh sách users để đổ vào các thẻ <select> trong form Thêm/Sửa
        List<Room> availableRooms = roomRepository.findByStatus("available");
        List<User> allUsers = userRepository.findAll();

        // Gửi toàn bộ data xuống View (admin/bookings.html)
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
            existing.setCheckIn(check_in);
            existing.setCheckOut(check_out);
            existing.setTotalHours(totalHours);
            existing.setTotalPrice(totalPrice);
            existing.setStatus(status);
            bookingRepository.save(existing);
        } else {

            User user = userRepository.findById(user_id).orElse(null);
            if (user == null) return "redirect:/admin/bookings";

            Booking booking = new Booking();
            booking.setUser(user);
            booking.setRoom(room);
            booking.setCheckIn(check_in);
            booking.setCheckOut(check_out);
            booking.setTotalHours(totalHours);
            booking.setTotalPrice(totalPrice);
            booking.setStatus(status);
            bookingRepository.save(booking);


            room.setStatus("booked");
            roomRepository.save(room);
        }

        return "redirect:/admin/bookings";
    }

    
    // Hàm xử lý việc Trả Phòng (Checkout)
    // - booking_id: ID của đơn cần trả
    // - checkout_type: Chọn kiểu trả (Tính lại tiền từ lúc checkin đến bây giờ, hoặc Giữ nguyên tiền cũ)
    @PostMapping(params = "action=checkout")
    public String checkout(@RequestParam @NonNull Integer booking_id,
                           @RequestParam String checkout_type) {
        Optional<Booking> bookingOpt = bookingRepository.findById(booking_id);
        if (bookingOpt.isEmpty()) return "redirect:/admin/bookings";

        Booking booking = bookingOpt.get();
        Room room = booking.getRoom();

        if ("recalc".equals(checkout_type)) {
            // Trường hợp khách thu dọn ra về sớm/muộn -> Tính tiền thực tế ngay tại thời điểm bấm nút
            LocalDateTime now = LocalDateTime.now();
            double pricePerHour = room.getRoomType().getPricePerNight();
            // Gọi hàm tính tiền lại dựa theo giờ thực tế
            Map<String, Double> priceInfo = bookingService.calculateBookingPriceAdmin(booking.getCheckIn(), now, pricePerHour);

            // Cập nhật lại hóa đơn với số giờ và số tiền thực tế
            booking.setCheckOut(now);
            booking.setCheckOutActual(now);
            booking.setTotalHours(priceInfo.get("hours"));
            booking.setTotalPrice(priceInfo.get("total"));
            booking.setStatus("completed");
        } else {
            // Khách ở đúng giờ, không cần tính lại tiền -> Đổi status thô
            booking.setStatus("completed");
        }

        // Lưu đơn đặt phòng
        bookingRepository.save(booking);

        // ĐỔi trạng thái phòng khách vừa trả thành "available" (bỏ trống) để khách khác vào đặt
        room.setStatus("available");
        roomRepository.save(room);

        return "redirect:/admin/bookings";
    }

    
    @PostMapping(params = "action=delete")
    public String deleteBooking(@RequestParam @NonNull Integer booking_id) {
        bookingRepository.deleteById(booking_id);
        return "redirect:/admin/bookings";
    }
}
