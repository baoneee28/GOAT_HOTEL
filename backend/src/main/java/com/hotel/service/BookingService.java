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
        // Không cho phép đặt phòng với ngày nhận trong quá khứ
        if (checkIn.isBefore(LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0))) {
            return "Ngày nhận phòng không thể ở trong quá khứ!";
        }
        if (!checkOut.isAfter(checkIn)) {
            return "Thời gian ra phải lớn hơn thời gian vào!";
        }
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) return "Phòng không tồn tại!";

        // Check date overlap
        long overlapCount = bookingRepository.countOverlappingBookings(roomId, checkIn, checkOut);
        if (overlapCount > 0) {
            return "Phòng đã có người đặt trong thời gian này!";
        }

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
