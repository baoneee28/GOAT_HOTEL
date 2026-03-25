package com.hotel.controller.api;

import com.hotel.repository.BookingRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> response = new HashMap<>();

        try {
            Double revenue = bookingRepository.sumTotalRevenue();
            response.put("total_revenue", revenue != null ? revenue : 0);

            response.put("total_customers", userRepository.countByRole("customer"));

            List<Object[]> statusCounts = roomRepository.countByStatusGroup();
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

            response.put("rooms_available", available);
            response.put("rooms_booked", booked);
            response.put("rooms_maintenance", maintenance);
            response.put("total_rooms", roomRepository.count());

            response.put("chart_labels", new String[]{"Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"});
            response.put("chart_data", new long[]{1500000, 2300000, 1800000, 3200000, 2800000, 4500000, 5200000});

            response.put("pending_count", bookingRepository.countByStatus("pending"));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
