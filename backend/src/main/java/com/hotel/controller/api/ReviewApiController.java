package com.hotel.controller.api;

import com.hotel.dto.ReviewSubmitRequest;
import com.hotel.entity.Booking;
import com.hotel.entity.Coupon;
import com.hotel.entity.Review;
import com.hotel.entity.User;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.CouponRepository;
import com.hotel.repository.ReviewRepository;
import com.hotel.service.CouponService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ReviewApiController {

    private static final Logger log = LoggerFactory.getLogger(ReviewApiController.class);

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private CouponService couponService;

    @PostMapping
    public ResponseEntity<?> submitReview(@Valid @RequestBody ReviewSubmitRequest request, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        Integer bookingId = Objects.requireNonNull(request.bookingId());
        Integer rating = Objects.requireNonNull(request.rating());
        String comment = request.comment() == null ? "" : request.comment().trim();

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
                log.warn("Could not auto-assign review coupon for userId={} bookingId={}", user.getId(), bookingId, e);
            }
        }

        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getReviewByBooking(@PathVariable @NonNull Integer bookingId, HttpSession session) {
        List<Review> list = reviewRepository.findByBookingId(bookingId);
        List<Map<String, Object>> resList = list.stream().map(r -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", r.getId());
            map.put("rating", r.getRating());
            return map;
        }).toList();
        return ResponseEntity.ok(Map.of("reviews", resList));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<?> getReviewsByRoom(@PathVariable @NonNull Integer roomId) {
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
