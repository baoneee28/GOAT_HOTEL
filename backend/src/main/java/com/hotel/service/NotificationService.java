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

    public List<Notification> getUserNotifications(Integer userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(Integer userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Integer notificationId, Integer expectedUserId) {
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
    public void markAllAsRead(Integer userId) {
        List<Notification> unreadList = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unreadList.forEach(note -> note.setIsRead(true));
        notificationRepository.saveAll(unreadList);
    }

    @Transactional
    public void sendReviewPrompt(Booking booking) {
        if (booking.getUser() == null) return;
        
        List<Coupon> activeReviewCoupons = couponRepository.findByIsActiveTrue()
                .stream()
                .filter(c -> "ON_REVIEW".equalsIgnoreCase(c.getTargetEvent()))
                .filter(c -> c.getEndDate().isAfter(java.time.LocalDateTime.now()))
                .toList();
                
        String messageBody = "Cảm ơn bạn đã trải nghiệm dịch vụ. Đừng quên để lại đánh giá để tích lũy điểm thưởng nhé!";
        
        if (!activeReviewCoupons.isEmpty()) {
            Coupon reward = activeReviewCoupons.get(0);
            String discountStr = "";
            if ("FIXED".equalsIgnoreCase(reward.getDiscountType())) {
                NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
                discountStr = format.format(reward.getDiscountValue());
            } else {
                // If it's 10.0, format to "10" 
                double val = reward.getDiscountValue();
                discountStr = (val == Math.floor(val) ? String.format("%.0f", val) : String.valueOf(val)) + "%";
            }
            messageBody = "Mời bạn đánh giá phòng vừa trả để nhận ngay Voucher " + discountStr + " cho lần đặt tiếp theo!";
        }
        
        createNotification(
            booking.getUser(),
            "Quà tặng tri ân từ GOAT Hotel",
            messageBody,
            "REVIEW_PROMPT",
            booking.getId()
        );
    }
}