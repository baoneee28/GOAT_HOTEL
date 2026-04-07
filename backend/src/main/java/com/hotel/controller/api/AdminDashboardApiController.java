package com.hotel.controller.api;

import com.hotel.repository.BookingRepository;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.ContactMessageRepository;
import com.hotel.repository.ItemRepository;
import com.hotel.repository.NewsRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.RoomTypeItemRepository;
import com.hotel.repository.RoomTypeRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.PaymentService;
import com.hotel.service.RoomStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardApiController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingDetailRepository bookingDetailRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private RoomTypeItemRepository roomTypeItemRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private RoomStatusService roomStatusService;

    @Autowired
    private PaymentService paymentService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> response = new HashMap<>();

        try {
            response.put("total_revenue", paymentService.getTotalCollectedRevenue());

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

            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            LocalDateTime tomorrowStart = todayStart.plusDays(1);
            response.put("today_checkins", bookingDetailRepository.countCheckInsBetween(todayStart, tomorrowStart));
            response.put("today_checkouts", bookingDetailRepository.countCheckOutsBetween(todayStart, tomorrowStart));

            LocalDate today = LocalDate.now();
            LocalDate startDate = today.minusDays(6);
            Map<LocalDate, Double> revenueByDay = paymentService.getCollectedRevenueByDate(startDate, today.plusDays(1));

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
            response.put("chart_metric", "payments_collected");
            response.put("featured_room_types", buildRoomTypePreview());
            response.put("featured_items", buildItemPreview());
            response.put("featured_news", buildNewsPreview());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    private List<Map<String, Object>> buildRoomTypePreview() {
        List<com.hotel.entity.RoomType> roomTypes = roomTypeRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        List<Integer> roomTypeIds = roomTypes.stream()
                .map(com.hotel.entity.RoomType::getId)
                .toList();

        Map<Integer, Integer> itemCounts = new HashMap<>();
        if (!roomTypeIds.isEmpty()) {
            for (Object[] row : roomTypeItemRepository.countItemsByRoomTypeIds(roomTypeIds)) {
                itemCounts.put((Integer) row[0], ((Long) row[1]).intValue());
            }
        }

        List<Map<String, Object>> previews = new ArrayList<>();
        for (com.hotel.entity.RoomType roomType : roomTypes) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", roomType.getId());
            item.put("typeName", roomType.getTypeName());
            item.put("image", roomType.getImage());
            item.put("pricePerNight", roomType.getPricePerNight());
            item.put("capacity", roomType.getCapacity());
            item.put("itemCount", itemCounts.getOrDefault(roomType.getId(), 0));
            previews.add(item);
        }
        return previews;
    }

    private List<Map<String, Object>> buildItemPreview() {
        List<com.hotel.entity.Item> items = itemRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        List<Map<String, Object>> previews = new ArrayList<>();

        for (com.hotel.entity.Item entry : items) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", entry.getId());
            item.put("name", entry.getName());
            item.put("image", entry.getImage());
            previews.add(item);
        }

        return previews;
    }

    private List<Map<String, Object>> buildNewsPreview() {
        List<Map<String, Object>> previews = new ArrayList<>();
        for (com.hotel.entity.News entry : newsRepository.findTop4ByOrderByIdDesc()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", entry.getId());
            item.put("title", entry.getTitle());
            item.put("summary", entry.getSummary());
            item.put("image", entry.getImage());
            item.put("createdAt", entry.getCreatedAt());
            previews.add(item);
        }
        return previews;
    }
}
