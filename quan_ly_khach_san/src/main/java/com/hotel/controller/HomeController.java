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
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;


// Controller xử lý trang chủ (hiển thị giao diện khách hàng giới thiệu phòng, tin tức)
// Và xử lý form Đặt phòng từ giao diện
@Controller
public class HomeController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private NewsRepository newsRepository;

    
    // Phương thức GET: Khi người dùng gõ địa chỉ web (VD: localhost:8080/)
    @GetMapping("/")
    public String index(HttpSession session, Model model) {
        Booking activeBooking = null;

        // Kiểm tra xem khách đã đăng nhập chưa
        if (session.getAttribute("user") != null) {
            User user = (User) session.getAttribute("user");
            // Lấy thông tin đơn đặt phòng đang "pending" của khách rải lên View (nếu có)
            activeBooking = bookingService.getActiveBooking(user.getId());
        }

        // Lấy danh sách các loại phòng (Tiêu chuẩn, VIP...)
        List<RoomType> roomTypes = roomTypeRepository.findAll();

        // Lấy 4 bài tin tức mới nhất (dựa vào ID giảm dần) để nhét vào Carousel trang chủ
        List<News> newsList = newsRepository.findTop4ByOrderByIdDesc();

        // Truyền hết dữ liệu lấy được xuống màn hình giao diện (index.html)
        model.addAttribute("active_booking", activeBooking);
        model.addAttribute("room_types", roomTypes);
        model.addAttribute("news_list", newsList);

        return "index"; // Trả về file index.html
    }

    
    // Khi người dùng bấm nút "XÁC NHẬN ĐẶT PHÒNG", form HTML sẽ đẩy dữ liệu (POST) về đây
    @PostMapping("/book")
    public String bookRoom(@RequestParam Integer room_id,
                           @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm") LocalDateTime check_in, // Ép kiểu chuỗi ngày tháng từ HML thành biến Java LocalDateTime
                           @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm") LocalDateTime check_out,
                           HttpSession session,
                           Model model) {

        // 1. Chặn người dùng nếu chưa đăng xuất -> Bắn lỗi qua SweetAlert (JS) và bắt đăng nhập
        if (session.getAttribute("user") == null) {
            model.addAttribute("alert_icon", "warning");
            model.addAttribute("alert_title", "Yêu cầu đăng nhập");
            model.addAttribute("alert_text", "Vui lòng đăng nhập để đặt phòng!");
            model.addAttribute("alert_redirect", "/login");
            return reloadIndex(session, model); // Hàm phụ gọi lại các list để giao diện khỏi bị trống
        }

        User user = (User) session.getAttribute("user");

        // 2. Kiểm tra xem người dùng hiện có đơn đặt phòng nào chưa được thanh toán không
        Booking activeBooking = bookingService.getActiveBooking(user.getId());
        if (activeBooking != null) {
            model.addAttribute("alert_icon", "error");
            model.addAttribute("alert_title", "Không thể đặt thêm");
            model.addAttribute("alert_text", "Bạn đang giữ chỗ phòng " + activeBooking.getRoom().getRoomNumber() + ". Vui lòng hoàn thành đơn cũ.");
            model.addAttribute("alert_redirect", null);
            return reloadIndex(session, model);
        }

        // 3. Tiến hành Lưu booking xuống Database thông qua hàm bookRoom bên trong BookingService
        String error = bookingService.bookRoom(user, room_id, check_in, check_out);
        
        // Đoạn này lấy mã lỗi (VD: Giờ ra nhỏ hơn giờ vào) nếu bookRoom báo có lỗi
        if (error != null) {
            model.addAttribute("alert_icon", "error");
            model.addAttribute("alert_title", "Lỗi thời gian");
            model.addAttribute("alert_text", error);
            model.addAttribute("alert_redirect", null);
            return reloadIndex(session, model);
        }

        // 4. Mọi thứ trơn tru -> Báo thành công và đá sang màn Lịch Sử Khách Hàng
        model.addAttribute("alert_icon", "success");
        model.addAttribute("alert_title", "Thành công");
        model.addAttribute("alert_text", "Đặt phòng thành công! Đang chuyển hướng...");
        model.addAttribute("alert_redirect", "/history");
        return reloadIndex(session, model);
    }

    private String reloadIndex(HttpSession session, Model model) {

        List<RoomType> roomTypes = roomTypeRepository.findAll();
        List<News> newsList = newsRepository.findTop4ByOrderByIdDesc();

        Booking activeBooking = null;
        if (session.getAttribute("user") != null) {
            User user = (User) session.getAttribute("user");
            activeBooking = bookingService.getActiveBooking(user.getId());
        }

        model.addAttribute("active_booking", activeBooking);
        model.addAttribute("room_types", roomTypes);
        model.addAttribute("news_list", newsList);
        return "index";
    }
}
