package com.hotel.service;

import com.hotel.entity.Booking;
import com.hotel.entity.Payment;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          BookingService bookingService) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
    }

    public double resolvePayableAmount(Booking booking) {
        if (booking == null) {
            return 0.0;
        }

        bookingService.normalizeBookingFinancials(booking);
        if (booking.getFinalAmount() != null && booking.getFinalAmount() > 0) {
            return booking.getFinalAmount();
        }
        if (booking.getTotalPrice() != null && booking.getTotalPrice() > 0) {
            double discountAmount = booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount();
            return Math.max(0.0, booking.getTotalPrice() - discountAmount);
        }
        return 0.0;
    }

    public double getTotalCollectedRevenue() {
        Double revenue = paymentRepository.sumPaidRevenue();
        return revenue != null ? revenue : 0.0;
    }

    public Map<LocalDate, Double> getCollectedRevenueByDate(LocalDate startDate, LocalDate endDateExclusive) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDateExclusive.atStartOfDay();

        List<Payment> payments = paymentRepository.findByStatusIgnoreCaseAndPaymentDateBetweenOrderByPaymentDateAsc(
                "paid",
                start,
                end.minusNanos(1)
        );

        Map<LocalDate, Double> revenueByDay = new HashMap<>();
        for (Payment payment : payments) {
            if (payment == null || payment.getPaymentDate() == null) {
                continue;
            }
            LocalDate paidDate = payment.getPaymentDate().toLocalDate();
            revenueByDay.put(
                    paidDate,
                    revenueByDay.getOrDefault(paidDate, 0.0) + (payment.getAmount() != null ? payment.getAmount() : 0.0)
            );
        }

        return revenueByDay;
    }

    @Transactional
    public Booking collectCashPayment(Integer bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng."));

        validateCollectibleBooking(booking);
        return confirmBookingPayment(booking, "CASH", false, LocalDateTime.now());
    }

    @Transactional
    public Booking confirmBookingPayment(Booking booking, String paymentMethod, boolean autoConfirmPending) {
        return confirmBookingPayment(booking, paymentMethod, autoConfirmPending, LocalDateTime.now());
    }

    @Transactional
    public Booking confirmBookingPayment(Booking booking,
                                         String paymentMethod,
                                         boolean autoConfirmPending,
                                         LocalDateTime paymentDate) {
        if (booking == null || booking.getId() == null) {
            throw new IllegalArgumentException("Đơn đặt phòng không hợp lệ.");
        }

        double payableAmount = resolvePayableAmount(booking);
        if (payableAmount <= 0) {
            throw new IllegalArgumentException("Đơn đặt phòng chưa có số tiền hợp lệ để thu.");
        }

        if (autoConfirmPending && "pending".equalsIgnoreCase(booking.getStatus())) {
            booking.setStatus("confirmed");
        }
        booking.setPaymentStatus("paid");
        bookingRepository.save(booking);

        Payment existingPayment = paymentRepository.findTopByBooking_IdOrderByPaymentDateDesc(booking.getId()).orElse(null);
        if (existingPayment == null) {
            Payment payment = new Payment();
            payment.setBooking(booking);
            payment.setAmount(payableAmount);
            payment.setPaymentMethod(paymentMethod);
            payment.setPaymentDate(paymentDate == null ? LocalDateTime.now() : paymentDate);
            payment.setStatus("paid");
            paymentRepository.save(payment);
        }

        return booking;
    }

    private void validateCollectibleBooking(Booking booking) {
        bookingService.normalizeBookingFinancials(booking);
        if (!"confirmed".equalsIgnoreCase(booking.getStatus())) {
            if ("pending".equalsIgnoreCase(booking.getStatus())) {
                throw new IllegalArgumentException("Chỉ được thu tiền mặt cho booking đã xác nhận.");
            }
            if ("completed".equalsIgnoreCase(booking.getStatus())) {
                throw new IllegalArgumentException("Booking đã hoàn thành nên không thể thu tiền mặt lại.");
            }
            if ("cancelled".equalsIgnoreCase(booking.getStatus())) {
                throw new IllegalArgumentException("Đơn đã bị hủy nên không thể ghi nhận thanh toán.");
            }
            if ("expired".equalsIgnoreCase(booking.getStatus())) {
                throw new IllegalArgumentException("Đơn đã hết hạn giữ chỗ nên không thể ghi nhận thanh toán.");
            }
            throw new IllegalArgumentException("Trạng thái booking hiện tại không cho phép ghi nhận thanh toán.");
        }
        if ("paid".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new IllegalArgumentException("Booking này đã được thanh toán trước đó.");
        }
    }
}
