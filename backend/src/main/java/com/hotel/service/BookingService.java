package com.hotel.service;

import com.hotel.entity.Booking;
import com.hotel.entity.Room;
import com.hotel.entity.User;
import com.hotel.repository.BookingRepository;
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


// Tầng Service: Nơi chứa toàn bộ logic tính toán nghiệp vụ (Business Logic) phức tạp nhất
// Tách logic ra đây giúp Controller gọi gọn gàng hơn, dễ bảo trì
@Service
@SuppressWarnings("null")
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;


    
    // Tính giá tiền TẠM TÍNH (dùng ở trang chủ lúc khách vừa chọn giờ)
    // Công thức: Tổng số giờ (làm tròn lên) * Giá mỗi giờ (Hoặc giá mỗi đêm)
    public long calculatePriceIndex(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerHour) {

        // Tính tổng số giây lệch nhau giữa 2 mốc thời gian
        long totalSeconds = ChronoUnit.SECONDS.between(checkIn, checkOut);
        double hours = totalSeconds / 3600.0;

        // Math.ceil: Làm tròn lên (VD: 2.1 giờ -> tính tiền 3 giờ)
        return (long) Math.ceil(hours * pricePerHour);
    }

    
    // Tính tổng số giờ khách ở để lưu vào Database (hiển thị cho khách xem)
    public double calculateHours(LocalDateTime checkIn, LocalDateTime checkOut) {
        long totalSeconds = ChronoUnit.SECONDS.between(checkIn, checkOut);
        double hours = totalSeconds / 3600.0;

        // Làm tròn đến 2 chữ số thập phân (VD: 2.456 -> 2.46)
        return Math.round(hours * 100.0) / 100.0;
    }

    
    // Tính giá THỰC TẾ lúc Admin bấm Thu Tiền (Checkout)
    // Ở đây logic gắt gao hơn: Tính chính xác từng phút.
    // Nếu lố >30 phút -> tính 1 giờ. Nếu lố >0 phút & <= 30 phút -> tính nửa giờ.
    public Map<String, Double> calculateBookingPriceAdmin(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerHour) {
        // Validation: Nếu nhập sai ngày out bé hơn ngày in -> giá = 0
        if (!checkOut.isAfter(checkIn)) {
            Map<String, Double> zero = new HashMap<>();
            zero.put("hours", 0.0);
            zero.put("total", 0.0);
            return zero;
        }

        long totalMinutes = ChronoUnit.MINUTES.between(checkIn, checkOut);
        long hours = totalMinutes / 60;
        long minutes = totalMinutes % 60;

        // Logic làm tròn giờ theo quy định khách sạn (phạt quá giờ)
        double finalHours;
        if (minutes > 30) {
            finalHours = hours + 1.0;
        } else if (minutes > 0) {
            finalHours = hours + 0.5;
        } else {
            finalHours = hours;
        }

        // Đóng gói số giờ và tổng tiền vào Map để trả về cho Controller
        Map<String, Double> result = new HashMap<>();
        result.put("hours", finalHours);
        result.put("total", finalHours * pricePerHour);
        return result;
    }

    
    public Booking getActiveBooking(Integer userId) {
        List<Booking> list = bookingRepository.findActiveBookingByUserId(userId);
        return list.isEmpty() ? null : list.get(0);
    }

    
    // Hàm cốt lõi: Đặt phòng mới do User thực hiện trên giao diện
    // @Transactional: Đảm bảo ACID, nếu quá trình trừ tiền hay lưu db bị lỗi ở giữa chừng thì sẽ ROLLBACK (Hủy toàn bộ thao tác, không bị lệch data)
    @Transactional
    public String bookRoom(User user, Integer roomId, LocalDateTime checkIn, LocalDateTime checkOut) {

        // Validate cơ bản
        if (!checkOut.isAfter(checkIn)) {
            return "Thời gian ra phải lớn hơn thời gian vào!";
        }

        // Kiểm tra xem phòng có tồn tại không
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) return "Phòng không tồn tại!";

        Room room = roomOpt.get();
        double pricePerHour = room.getRoomType().getPricePerNight();

        // Gọi 2 hàm tính toán viết ở trên
        long totalPrice = calculatePriceIndex(checkIn, checkOut, pricePerHour);
        double totalHours = calculateHours(checkIn, checkOut);

        // Khởi tạo Object Đơn đặt phòng và nhồi dữ liệu vào
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setRoom(room);
        booking.setCheckIn(checkIn);
        booking.setCheckOut(checkOut);
        booking.setTotalPrice((double) totalPrice);
        booking.setTotalHours(totalHours);
        booking.setStatus("pending"); // Ban đầu là pending chờ thanh toán
        
        // INSERT INTO bookings
        bookingRepository.save(booking);

        // ĐỔI TRẠNG THÁI PHÒNG THÀNH "booked" (Đã có người đặt)
        // UPDATE rooms SET status = 'booked'
        room.setStatus("booked");
        roomRepository.save(room);

        return null; // Trả về null mang ý nghĩa "Không có lỗi gì cả"
    }

    
    // Hàm để User tự HỦY phòng (Bên trang Lịch sử)
    @Transactional
    public boolean cancelBooking(Integer bookingId, Integer userId) {
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) return false;

        Booking booking = bookingOpt.get();

        // Quét bảo mật: Chặn không cho người này truyền bừa ID để hủy trộm phòng của người khác
        if (!booking.getUser().getId().equals(userId)) return false;

        // Quét nghiệp vụ: Chỉ hóa đơn còn màu Vàng (Pending) thì mới được hủy. Đang ở (Confirmed) là ko đc.
        if (!"pending".equals(booking.getStatus())) return false;

        // Cập nhật hóa đơn thành Đã hủy
        booking.setStatus("cancelled");
        bookingRepository.save(booking);

        // Nhả phòng về trạng thái TRỐNG cho khách khác đặt
        Room room = booking.getRoom();
        room.setStatus("available");
        roomRepository.save(room);

        return true;
    }

    
    public Page<Booking> getHistory(Integer userId, String status, int page) {

        return bookingRepository.findByUserIdAndStatus(userId, status,
                PageRequest.of(page - 1, 5));
    }

    
    public double getTotalSpent(Integer userId) {
        Double total = bookingRepository.sumTotalPriceByUserIdAndCompleted(userId);
        return total != null ? total : 0;
    }
}
