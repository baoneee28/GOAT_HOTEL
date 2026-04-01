package com.hotel.controller.admin;

import com.hotel.repository.BookingRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;


// Controller hiển thị trang Tổng Quan (Dashboard) của Admin
// Nơi đây tính toán các con số thống kê (Doanh thu, Số phòng, Số người dùng) để vẽ lên giao diện
@Controller
@RequestMapping("/admin")
public class AdminDashboardController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingService bookingService;

    // Bắt nhiều đường link cùng về 1 trang Dashboard (/admin, /admin/, /admin/index)
    @GetMapping({"", "/", "/index"})
    public String dashboard(Model model) {
        bookingService.expirePendingBookings();

        // 1. Tính TỔNG DOANH THU từ bảng bookings (Chỉ cộng những đơn có status = 'completed')
        Double revenue = bookingRepository.sumTotalRevenue();
        model.addAttribute("total_revenue", revenue != null ? revenue : 0);

        // 2. Đếm TỔNG SỐ KHÁCH HÀNG (đếm user có role = 'customer')
        model.addAttribute("total_customers", userRepository.countByRole("customer"));
        // 3. THỐNG KÊ TÌNH TRẠNG PHÒNG HIỆN TẠI (Trống/Đang có khách/Đang sửa)
        // Lấy 1 list gom nhóm (GROUP BY) từ DB: [["available", 10], ["booked", 5], ["maintenance", 2]]
        List<Object[]> statusCounts = roomRepository.countByStatusGroup();

        // Bóc tách mảng ra 3 biến rời để trả cho HTML
        long available = 0, booked = 0, maintenance = 0;
        for (Object[] row : statusCounts) {
            String st = String.valueOf(row[0]);
            long cnt = ((Number) row[1]).longValue();
            switch (st) {
                case "available" -> available = cnt;
                case "booked" -> booked = cnt;
                case "maintenance" -> maintenance = cnt;
            }
        }
        
        // Truyền cho đống thẻ Card màu mè ở trên đỉnh Dashboard
        model.addAttribute("rooms_available", available);
        model.addAttribute("rooms_booked", booked);
        model.addAttribute("rooms_maintenance", maintenance);
        
        // Truyền cho phần vẽ Biểu Đồ Tròn (Pie Chart) hiển thị "% Tình trạng phòng"
        model.addAttribute("s_available", available);
        model.addAttribute("s_booked", booked);
        model.addAttribute("s_maintenance", maintenance);
        
        // Đếm tổng tất cả số phòng
        model.addAttribute("total_rooms", roomRepository.count());

        // Fake data cho biểu đồ Doanh thu (Line Chart) vì làm đồ án sinh viên thì thường không đủ data thật để thống kê theo tuần/tháng thực tế
        model.addAttribute("chart_labels", new String[]{"Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"});
        model.addAttribute("chart_data", new long[]{1500000, 2300000, 1800000, 3200000, 2800000, 4500000, 5200000});
        // 4. Số lượng đơn đặt phòng mới (Trạng thái Pending) để chớp chớp thông báo
        model.addAttribute("pending_count", bookingRepository.countByStatus("pending"));

        return "admin/index";
    }
}
