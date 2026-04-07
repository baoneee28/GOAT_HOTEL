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
import com.hotel.service.NotificationService;
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

    @Autowired
    private NotificationService notificationService;

    private static final int PAGE_SIZE = 5;

    @GetMapping
    public String listBookings(@RequestParam(defaultValue = "") String status,
                               @RequestParam(defaultValue = "1") int page,
                               Model model) {
        Page<Booking> bookingPage = bookingRepository.findAdminBookings(
                status.isBlank() ? null : status,
                PageRequest.of(page - 1, PAGE_SIZE));

        List<Room> availableRooms = roomRepository.findAll().stream()
                .filter(room -> !"maintenance".equalsIgnoreCase(room.getStatus()))
                .toList();
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
        double pricePerNight = room.getRoomType().getPricePerNight();

        Map<String, Double> priceInfo = bookingService.calculateBookingPriceAdmin(check_in, check_out, pricePerNight);
        double totalHours = priceInfo.get("hours");
        double totalPrice = priceInfo.get("total");
        LocalDateTime now = LocalDateTime.now();

        if (booking_id != null && booking_id > 0) {
            Optional<Booking> existingOpt = bookingRepository.findById(booking_id);
            if (existingOpt.isEmpty()) return "redirect:/admin/bookings";

            Booking existing = existingOpt.get();
            bookingService.normalizeBookingFinancials(existing);
            String previousStatus = existing.getStatus();
            String nextStatus = bookingService.validateAdminEditableStatus(previousStatus, status);

            long overlapCount = bookingRepository.countOverlappingBookingsExcept(room_id, check_in, check_out, booking_id, now);
            if (overlapCount > 0
                    && !"cancelled".equalsIgnoreCase(nextStatus)
                    && !"expired".equalsIgnoreCase(nextStatus)
                    && !"refused".equalsIgnoreCase(nextStatus)) {
                return "redirect:/admin/bookings?error=overlap";
            }

            existing.setTotalPrice(totalPrice);
            existing.setFinalAmount(Math.max(0.0, totalPrice - (existing.getDiscountAmount() == null ? 0.0 : existing.getDiscountAmount())));
            existing.setStatus(nextStatus);
            existing.setPaymentStatus(bookingService.normalizeAdminPaymentStatus(existing.getPaymentStatus(), nextStatus));
            bookingService.preparePendingBooking(existing, previousStatus);
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

            String initialStatus = bookingService.validateAdminCreateStatus(status);
            long overlapCount = bookingRepository.countOverlappingBookings(room_id, check_in, check_out, now);
            if (overlapCount > 0
                    && !"cancelled".equalsIgnoreCase(initialStatus)
                    && !"expired".equalsIgnoreCase(initialStatus)
                    && !"refused".equalsIgnoreCase(initialStatus)) {
                return "redirect:/admin/bookings?error=overlap";
            }

            Booking booking = new Booking();
            booking.setUser(user);
            booking.setStatus(initialStatus);
            booking.setPaymentStatus(bookingService.normalizeAdminPaymentStatus(null, initialStatus));
            booking.setTotalPrice(totalPrice);
            booking.setFinalAmount(totalPrice);
            bookingService.preparePendingBooking(booking, null);
            booking = bookingRepository.save(booking);
            
            BookingDetail detail = new BookingDetail();
            detail.setBooking(booking);
            detail.setRoom(room);
            detail.setPriceAtBooking(pricePerNight);
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
        if (!"confirmed".equalsIgnoreCase(booking.getStatus())) return "redirect:/admin/bookings?error=checkout-status";
        if (detail.getCheckInActual() == null) return "redirect:/admin/bookings?error=checkout-checkin-required";
        if (detail.getCheckOutActual() != null) return "redirect:/admin/bookings?error=checkout-duplicated";
        if (!"paid".equalsIgnoreCase(booking.getPaymentStatus())) return "redirect:/admin/bookings?error=checkout-payment-required";

        LocalDateTime now = LocalDateTime.now();
        if ("recalc".equals(checkout_type)) {
            double pricePerNight = detail.getPriceAtBooking();
            LocalDateTime actualStayStart = detail.getCheckInActual() != null ? detail.getCheckInActual() : detail.getCheckIn();
            Map<String, Double> priceInfo = bookingService.calculateBookingPriceAdmin(actualStayStart, now, pricePerNight);

            detail.setCheckOutActual(now);
            detail.setTotalHours(priceInfo.get("hours"));
            bookingDetailRepository.save(detail);
            
            booking.setTotalPrice(priceInfo.get("total"));
            booking.setFinalAmount(Math.max(0.0, priceInfo.get("total") - (booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount())));
            booking.setStatus("completed");
        } else {
            detail.setCheckOutActual(now);
            bookingDetailRepository.save(detail);
            booking.setFinalAmount(Math.max(0.0, (booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0) - (booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount())));
            booking.setStatus("completed");
        }

        bookingRepository.save(booking);

        if (booking.getUser() != null) {
            notificationService.sendReviewPrompt(booking);
        }

        return "redirect:/admin/bookings";
    }

    @PostMapping(params = "action=delete")
    public String deleteBooking(@RequestParam @NonNull Integer booking_id) {
        return "redirect:/admin/bookings?error=delete-disabled";
    }
}
