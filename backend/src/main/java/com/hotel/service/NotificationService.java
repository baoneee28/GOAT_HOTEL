package com.hotel.service;

import com.hotel.entity.Booking;
import com.hotel.entity.Coupon;
import com.hotel.entity.Notification;
import com.hotel.entity.User;
import com.hotel.repository.NotificationRepository;
import com.hotel.repository.CouponRepository;
import java.text.NumberFormat;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Transactional
    public Notification createNotification(User user, String title, String message, String type, Integer relatedId) {
        Notification note = new Notification();
        note.setUser(user);
        note.setTitle(title);
        note.setMessage(message);
        note.setType(type);
        note.setRelatedId(relatedId);
        return notificationRepository.save(note);
    }

    public List<Notification> getUserNotifications(@NonNull Integer userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(@NonNull Integer userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(@NonNull Integer notificationId, Integer expectedUserId) {
        Optional<Notification> opt = notificationRepository.findById(notificationId);
        if (opt.isPresent()) {
            Notification note = opt.get();
            if (expectedUserId == null || note.getUser().getId().equals(expectedUserId)) {
                note.setIsRead(true);
                notificationRepository.save(note);
            }
        }
    }

    @Transactional
    public void markAllAsRead(@NonNull Integer userId) {
        List<Notification> unreadList = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unreadList.forEach(note -> note.setIsRead(true));
        notificationRepository.saveAll(unreadList);
    }

    @Transactional
    public void sendReviewPrompt(Booking booking) {
        if (booking.getUser() == null) return;

        // Tìm riêng REVIEWSTAR thay vì lấy bất kỳ coupon ON_REVIEW nào
        Optional<com.hotel.entity.Coupon> reviewStarOpt = couponRepository.findByCodeIgnoreCase("REVIEWSTAR");

        String messageBody;
        if (reviewStarOpt.isPresent() && Boolean.TRUE.equals(reviewStarOpt.get().getIsActive())
                && reviewStarOpt.get().getEndDate() != null
                && reviewStarOpt.get().getEndDate().isAfter(java.time.LocalDateTime.now())) {
            com.hotel.entity.Coupon reward = reviewStarOpt.get();
            String discountStr;
            if ("FIXED".equalsIgnoreCase(reward.getDiscountType())) {
                NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
                discountStr = format.format(reward.getDiscountValue());
            } else {
                double val = reward.getDiscountValue();
                discountStr = (val == Math.floor(val) ? String.format("%.0f", val) : String.valueOf(val)) + "%";
            }
            messageBody = "Cảm ơn bạn đã lưu trú! Hãy đánh giá phòng vừa trả để nhận ngay Voucher "
                    + discountStr + " (mã REVIEWSTAR) — xuất hiện tại trang Mã giảm giá sau khi bạn gửi review.";
        } else {
            messageBody = "Cảm ơn bạn đã trải nghiệm dịch vụ tại GOAT Hotel. Đừng quên để lại đánh giá nhé!";
        }

        createNotification(
            booking.getUser(),
            "Quà tặng tri ân từ GOAT Hotel ⭐",
            messageBody,
            "REVIEW_PROMPT",
            booking.getId()
        );
    }
}
