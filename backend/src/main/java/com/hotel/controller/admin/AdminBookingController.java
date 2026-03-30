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
            
            long overlapCount = bookingRepository.countOverlappingBookingsExcept(room_id, check_in, check_out, booking_id);
            if (overlapCount > 0 && !"cancelled".equalsIgnoreCase(status) && !"refused".equalsIgnoreCase(status)) {
                return "redirect:/admin/bookings?error=overlap";
            }
            
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
            
            long overlapCount = bookingRepository.countOverlappingBookings(room_id, check_in, check_out);
            if (overlapCount > 0 && !"cancelled".equalsIgnoreCase(status) && !"refused".equalsIgnoreCase(status)) {
                return "redirect:/admin/bookings?error=overlap";
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
            detail.setCheckIn(check_in);
            detail.setCheckOut(check_out);
            detail.setTotalHours(totalHours);
            bookingDetailRepository.save(detail);

            // KHÔNG setStatus("booked") vật lý
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
