package com.hotel.controller.api;

import com.hotel.entity.Booking;
import com.hotel.entity.Coupon;
import com.hotel.entity.Review;
import com.hotel.entity.User;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.CouponRepository;
import com.hotel.repository.ReviewRepository;
import com.hotel.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ReviewApiController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private CouponService couponService;

    @PostMapping
    public ResponseEntity<?> submitReview(@RequestBody Map<String, Object> payload, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        Integer bookingId = null;
        if (payload.get("bookingId") != null) {
            bookingId = Integer.valueOf(payload.get("bookingId").toString());
        }
        Integer rating = payload.get("rating") == null ? 5 : Integer.valueOf(payload.get("rating").toString());
        String comment = payload.get("comment") == null ? "" : payload.get("comment").toString();

        if (bookingId == null || rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không hợp lệ"));
        }

        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Booking không tồn tại"));
        }

        Booking booking = bookingOpt.get();
        if (!booking.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }

        if (!"completed".equalsIgnoreCase(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bạn chỉ có thể đánh giá phòng sau khi hoàn tất lưu trú"));
        }

        // Check if already reviewed
        List<Review> existingReviews = reviewRepository.findByBookingId(booking.getId());
        if (!existingReviews.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bạn đã đánh giá cho booking này rồi"));
        }

        Review review = new Review();
        review.setUser(user);
        review.setBooking(booking);
        // Map roomType if needed, we take it from the booking details ideally
        if (booking.getDetails() != null && !booking.getDetails().isEmpty() && booking.getDetails().get(0).getRoom() != null) {
            review.setRoomType(booking.getDetails().get(0).getRoom().getRoomType());
        }
        review.setRating(rating);
        review.setComment(comment);

        reviewRepository.save(review);

        // Trả Voucher tự động nếu tồn tại Coupon đang chạy cho targetEvent = 'ON_REVIEW'
        List<Coupon> activeReviewCoupons = couponRepository.findByIsActiveTrue()
                .stream()
                .filter(c -> "ON_REVIEW".equalsIgnoreCase(c.getTargetEvent()))
                .filter(c -> c.getEndDate().isAfter(java.time.LocalDateTime.now()))
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Đánh giá của bạn đã được ghi nhận. Cảm ơn bạn!");

        if (!activeReviewCoupons.isEmpty()) {
            Coupon reward = activeReviewCoupons.get(0);
            try {
                couponService.assignCouponToUser(reward.getId(), user.getId(), null, null, "Thưởng đánh giá trải nghiệm");
                response.put("rewardCoupon", reward);
            } catch (Exception e) {
                // Ignore conflict if user already has it
                System.out.println("Could not auto-assign review coupon: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getReviewByBooking(@PathVariable Integer bookingId, HttpSession session) {
        List<Review> list = reviewRepository.findByBookingId(bookingId);
        return ResponseEntity.ok(Map.of("reviews", list));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<?> getReviewsByRoom(@PathVariable Integer roomId) {
        List<Review> list = reviewRepository.findByRoomTypeIdOrderByCreatedAtDesc(roomId);
        List<Map<String, Object>> resList = list.stream().map(r -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", r.getId());
            map.put("rating", r.getRating());
            map.put("comment", r.getComment());
            map.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
            map.put("user", Map.of("fullName", r.getUser() != null ? r.getUser().getFullName() : "Khách hàng"));
            return map;
        }).toList();
        return ResponseEntity.ok(Map.of("reviews", resList));
    }
}