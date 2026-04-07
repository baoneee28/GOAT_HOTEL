package com.hotel.controller;

import com.hotel.entity.Booking;
import com.hotel.entity.User;
import com.hotel.service.BookingService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;


// Controller phụ trách trang Lịch sử đặt phòng của Khách Hàng
@Controller
public class HistoryController {

    @Autowired
    private BookingService bookingService;

    
    // Hiển thị danh sách Lịch sử đặt phòng
    @GetMapping("/history")
    public String history(@RequestParam(defaultValue = "") String status, // Bộ lọc trạng thái (Đã xong, Đã hủy...)
                          @RequestParam(defaultValue = "1") int page,     // Phân trang
                          HttpSession session,
                          Model model) {
        // Lấy thông tin user hiện tại (Đã bị AuthInterceptor chặn đầu, nên chắc chắn có user)
        User user = (User) session.getAttribute("user");

        // Nếu người dùng không lọn trạng thái gì thì mặc định xem "all"
        String statusFilter = (status == null || status.isBlank()) ? "all" : status;

        // Gọi DB lấy list đơn đặt phòng CỦA RIÊNG KHÁCH ĐÓ (nhờ truyền user.getId())
        Page<Booking> bookingPage = bookingService.getHistory(user.getId(), statusFilter, page);

        // Tính tổng tiền người này đã cúng cho khách sạn
        double totalSpent = bookingService.getTotalSpent(user.getId());

        // Đổ toàn bộ dữ liệu ra HTML
        model.addAttribute("bookings", bookingPage.getContent());
        model.addAttribute("total_pages", bookingPage.getTotalPages());
        model.addAttribute("page", page);
        model.addAttribute("status_filter", statusFilter);
        model.addAttribute("total_spent", totalSpent);

        return "history";
    }

    
    // Khách hàng bấm nút "HỦY PHÒNG"
    @PostMapping("/cancel-booking")
    public String cancelBooking(@RequestParam Integer cancel_id,
                                HttpSession session) {
        User user = (User) session.getAttribute("user");
        
        // Gọi Service thực hiện Hủy, bên trong Service đã có logic chốt chặn bảo mật (Chặn xóa trộm)
        try {
            bookingService.cancelBooking(cancel_id, user.getId());
        } catch (RuntimeException ignored) {}

        return "redirect:/history"; // Đá lại trang đầu
    }
}
