const fs = require('fs');
const path = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\service\\NotificationService.java';
let content = fs.readFileSync(path, 'utf8');

// Add imports
if (!content.includes('import com.hotel.entity.Booking;')) {
    content = content.replace(
        'import com.hotel.entity.Notification;',
        'import com.hotel.entity.Booking;\nimport com.hotel.entity.Coupon;\nimport com.hotel.entity.Notification;'
    );
    content = content.replace(
        'import com.hotel.repository.NotificationRepository;',
        'import com.hotel.repository.NotificationRepository;\nimport com.hotel.repository.CouponRepository;\nimport java.text.NumberFormat;\nimport java.util.Locale;'
    );
}

// Add CouponRepository injection
if (!content.includes('private CouponRepository couponRepository;')) {
    content = content.replace(
        '    private NotificationRepository notificationRepository;',
        '    private NotificationRepository notificationRepository;\n\n    @Autowired\n    private CouponRepository couponRepository;'
    );
}

// Add sendReviewPrompt method
if (!content.includes('public void sendReviewPrompt')) {
    const newMethod = `
    @Transactional
    public void sendReviewPrompt(Booking booking) {
        if (booking.getUser() == null) return;
        
        List<Coupon> activeReviewCoupons = couponRepository.findByIsActiveTrue()
                .stream()
                .filter(c -> "ON_REVIEW".equalsIgnoreCase(c.getTargetEvent()))
                .filter(c -> c.getEndDate().isAfter(java.time.LocalDateTime.now()))
                .toList();
                
        String messageBody = "Cảm ơn bạn đã lưu trú. Hãy đánh giá chuyến đi để nhận điểm thưởng nhé!";
        
        if (!activeReviewCoupons.isEmpty()) {
            Coupon reward = activeReviewCoupons.get(0);
            String discountStr = "";
            if ("fixed".equals(reward.getDiscountType())) {
                NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
                discountStr = format.format(reward.getDiscountValue());
            } else {
                discountStr = reward.getDiscountValue() + "%";
            }
            messageBody = "Cảm ơn bạn đã lưu trú. Hãy đánh giá chuyến đi để nhận ngay voucher " + discountStr + " nhé!";
        }
        
        createNotification(
            booking.getUser(),
            "Đánh giá chuyến đi " + booking.getId(),
            messageBody,
            "REVIEW_PROMPT",
            booking.getId()
        );
    }
`;
    content = content.replace(/}\s*$/, newMethod + '}');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Modified NotificationService.java');
