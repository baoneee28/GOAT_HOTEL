package com.hotel.controller.api;

import com.hotel.repository.BookingRepository;
import com.hotel.repository.ContactMessageRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.BookingService;
import com.hotel.service.RoomStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardApiController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @Autowired
    private RoomStatusService roomStatusService;

    @Autowired
    private BookingService bookingService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> response = new HashMap<>();

        try {
            bookingService.expirePendingBookings();
            Double revenue = bookingRepository.sumTotalRevenue();
            response.put("total_revenue", revenue != null ? revenue : 0);

            response.put("total_customers", userRepository.countByRole("customer"));

            Map<String, Long> roomStatusCounts = roomStatusService.countEffectiveStatuses();
            long available = roomStatusCounts.getOrDefault("available", 0L);
            long reserved = roomStatusCounts.getOrDefault("reserved", 0L);
            long booked = roomStatusCounts.getOrDefault("booked", 0L);
            long maintenance = roomStatusCounts.getOrDefault("maintenance", 0L);

            response.put("rooms_available", available);
            response.put("rooms_reserved", reserved);
            response.put("rooms_booked", booked);
            response.put("rooms_maintenance", maintenance);
            response.put("total_rooms", roomRepository.count());

            response.put("pending_count", bookingRepository.countByStatus("pending"));
            response.put("new_contacts", contactMessageRepository.countByStatus("new"));

            LocalDate today = LocalDate.now();
            LocalDate startDate = today.minusDays(6);
            List<com.hotel.entity.Booking> recentCompletedBookings = bookingRepository
                    .findByStatusAndCreatedAtBetweenOrderByCreatedAtAsc(
                            "completed",
                            startDate.atStartOfDay(),
                            today.plusDays(1).atStartOfDay()
                    );

            Map<LocalDate, Double> revenueByDay = new HashMap<>();
            for (com.hotel.entity.Booking booking : recentCompletedBookings) {
                if (booking.getCreatedAt() == null) {
                    continue;
                }
                LocalDate bookingDate = booking.getCreatedAt().toLocalDate();
                revenueByDay.put(
                        bookingDate,
                        revenueByDay.getOrDefault(bookingDate, 0.0) + (booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0)
                );
            }

            String[] chartLabels = new String[7];
            double[] chartData = new double[7];
            DateTimeFormatter chartFormatter = DateTimeFormatter.ofPattern("dd/MM");
            for (int i = 0; i < 7; i++) {
                LocalDate day = startDate.plusDays(i);
                chartLabels[i] = day.format(chartFormatter);
                chartData[i] = revenueByDay.getOrDefault(day, 0.0);
            }

            response.put("chart_labels", chartLabels);
            response.put("chart_data", chartData);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
