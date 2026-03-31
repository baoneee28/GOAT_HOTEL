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

    public long calculateStayNights(LocalDateTime checkIn, LocalDateTime checkOut) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            return 0;
        }

        long nights = ChronoUnit.DAYS.between(checkIn.toLocalDate(), checkOut.toLocalDate());
        return Math.max(1, nights);
    }

    public long calculatePriceIndex(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerNight) {
        long nights = calculateStayNights(checkIn, checkOut);
        return Math.round(nights * pricePerNight);
    }

    public double calculateHours(LocalDateTime checkIn, LocalDateTime checkOut) {
        long totalSeconds = ChronoUnit.SECONDS.between(checkIn, checkOut);
        double hours = totalSeconds / 3600.0;
        return Math.round(hours * 100.0) / 100.0;
    }

    public Map<String, Double> calculateBookingPriceAdmin(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerNight) {
        if (!checkOut.isAfter(checkIn)) {
            Map<String, Double> zero = new HashMap<>();
            zero.put("hours", 0.0);
            zero.put("nights", 0.0);
            zero.put("total", 0.0);
            return zero;
        }

        double totalHours = calculateHours(checkIn, checkOut);
        long totalNights = calculateStayNights(checkIn, checkOut);

        Map<String, Double> result = new HashMap<>();
        result.put("hours", totalHours);
        result.put("nights", (double) totalNights);
        result.put("total", totalNights * pricePerNight);
        return result;
    }

    public Booking getActiveBooking(Integer userId) {
        List<Booking> list = bookingRepository.findActiveBookingByUserId(userId);
        return list.isEmpty() ? null : list.get(0);
    }

    public double calculateBookingTotal(Booking booking) {
        if (booking == null || booking.getDetails() == null || booking.getDetails().isEmpty()) {
            return booking != null && booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0;
        }

        double total = 0.0;
        for (BookingDetail detail : booking.getDetails()) {
            if (detail == null
                    || detail.getPriceAtBooking() == null
                    || detail.getCheckIn() == null
                    || detail.getCheckOut() == null) {
                continue;
            }
            total += calculatePriceIndex(detail.getCheckIn(), detail.getCheckOut(), detail.getPriceAtBooking());
        }
        return total;
    }

    public Booking normalizeBookingFinancials(Booking booking) {
        if (booking == null) {
            return null;
        }

        if (booking.getDetails() != null) {
            for (BookingDetail detail : booking.getDetails()) {
                if (detail == null || detail.getCheckIn() == null || detail.getCheckOut() == null) {
                    continue;
                }

                double recalculatedHours = calculateHours(detail.getCheckIn(), detail.getCheckOut());
                if (detail.getTotalHours() == null || Math.abs(detail.getTotalHours() - recalculatedHours) > 0.01) {
                    detail.setTotalHours(recalculatedHours);
                }
            }
        }

        double recalculatedTotal = calculateBookingTotal(booking);
        if (recalculatedTotal > 0 && (booking.getTotalPrice() == null || Math.abs(booking.getTotalPrice() - recalculatedTotal) > 0.01)) {
            booking.setTotalPrice(recalculatedTotal);
        }

        return booking;
    }

    public List<Booking> normalizeBookingFinancials(List<Booking> bookings) {
        if (bookings == null) {
            return List.of();
        }
        bookings.forEach(this::normalizeBookingFinancials);
        return bookings;
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
        double pricePerNight = room.getRoomType().getPricePerNight();

        long totalPrice = calculatePriceIndex(checkIn, checkOut, pricePerNight);
        double totalHours = calculateHours(checkIn, checkOut);

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setTotalPrice((double) totalPrice);
        booking.setStatus("pending");
        booking = bookingRepository.save(booking);
        
        BookingDetail detail = new BookingDetail();
        detail.setBooking(booking);
        detail.setRoom(room);
        detail.setPriceAtBooking(pricePerNight);
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
        Page<Booking> historyPage = bookingRepository.findByUserIdAndStatus(userId, status, PageRequest.of(page - 1, 5));
        normalizeBookingFinancials(historyPage.getContent());
        return historyPage;
    }

    public double getTotalSpent(Integer userId) {
        List<Booking> completedBookings = bookingRepository.findAllByUserIdAndStatus(userId, "completed");
        normalizeBookingFinancials(completedBookings);
        return completedBookings.stream()
                .mapToDouble(booking -> booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0)
                .sum();
    }
}
