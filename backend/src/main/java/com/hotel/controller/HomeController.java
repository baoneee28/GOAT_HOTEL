package com.hotel.controller;

import com.hotel.entity.User;
import com.hotel.repository.FeaturedRoomTypeRepository;
import com.hotel.repository.FeaturedNewsRepository;
import com.hotel.service.AuthService;
import com.hotel.service.BookingService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/home")
public class HomeController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private FeaturedRoomTypeRepository featuredRoomTypeRepository;

    @Autowired
    private FeaturedNewsRepository featuredNewsRepository;

    @Autowired
    private AuthService authService;

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> index(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        if (session.getAttribute("user") != null) {
            User user = (User) session.getAttribute("user");
            response.put("active_booking", bookingService.getActiveBooking(user.getId()));
            response.put("user_logged_in", authService.toClientUser(user));
        }

        response.put("featured_rooms", featuredRoomTypeRepository.findAllByOrderByDisplayOrderAsc());
        response.put("featured_news", featuredNewsRepository.findAllByOrderByDisplayOrderAsc());

        // Trả về danh sách URL của ảnh slider từ backend
        List<String> sliderImages = Arrays.asList(
                "/images/Featured_news/news_featured_1.jpg",
                "/images/Featured_news/news_featured_2.jpg",
                "/images/Featured_news/news_featured_3.jpg");
        response.put("slider_images", sliderImages);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/book")
    public ResponseEntity<Map<String, Object>> bookRoom(@RequestParam("room_id") Integer room_id,
            @RequestParam("check_in") @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm") LocalDateTime check_in,
            @RequestParam("check_out") @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm") LocalDateTime check_out,
            HttpSession session) {

        Map<String, Object> response = new HashMap<>();

        if (session.getAttribute("user") == null) {
            response.put("success", false);
            response.put("errorType", "auth");
            response.put("message", "Vui lòng đăng nhập để đặt phòng!");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        User user = (User) session.getAttribute("user");

        String error = bookingService.bookRoom(user, room_id, check_in, check_out);

        if (error != null) {
            response.put("success", false);
            response.put("message", error);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        response.put("success", true);
        response.put("message", "Đã gửi yêu cầu đặt phòng!");
        return ResponseEntity.ok(response);
    }
}
