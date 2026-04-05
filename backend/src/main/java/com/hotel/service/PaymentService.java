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
        return bookingService.resolveRemainingAmount(booking);
    }

    public double resolveDepositPayableAmount(Booking booking) {
        if (booking == null) {
            return 0.0;
        }

        bookingService.normalizeBookingFinancials(booking);
        return bookingService.resolveDepositOutstandingAmount(booking);
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
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay don dat phong."));

        validateCollectibleBooking(booking);
        return confirmBookingPayment(booking, "CASH", false, LocalDateTime.now());
    }

    @Transactional
    public Booking collectDepositPayment(Integer bookingId, Integer currentUserId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay don dat phong."));

        if (booking.getUser() == null || currentUserId == null || !currentUserId.equals(booking.getUser().getId())) {
            throw new SecurityException("Ban khong co quyen thao tac booking nay.");
        }

        validateDepositableBooking(booking);
        return confirmBookingDeposit(booking, "DEPOSIT", true, LocalDateTime.now());
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
            throw new IllegalArgumentException("Don dat phong khong hop le.");
        }

        bookingService.normalizeBookingFinancials(booking);
        double payableAmount = resolvePayableAmount(booking);
        if (payableAmount <= 0) {
            if ("paid".equalsIgnoreCase(booking.getPaymentStatus())) {
                return booking;
            }
            throw new IllegalArgumentException("Don dat phong chua co so tien hop le de thu.");
        }

        double paidAmountBefore = bookingService.resolvePaidAmount(booking);
        if (autoConfirmPending && "pending".equalsIgnoreCase(booking.getStatus())) {
            booking.setStatus("confirmed");
        }
        if (!"pending".equalsIgnoreCase(booking.getStatus())) {
            booking.setExpiresAt(null);
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(payableAmount);
        payment.setPaymentMethod(paymentMethod);
        payment.setPaymentDate(paymentDate == null ? LocalDateTime.now() : paymentDate);
        payment.setStatus("paid");
        paymentRepository.save(payment);

        double paidAmountAfter = paidAmountBefore + payableAmount;
        double finalAmount = booking.getFinalAmount() == null ? 0.0 : booking.getFinalAmount();
        double depositAmount = booking.getDepositAmount() == null ? 0.0 : booking.getDepositAmount();
        booking.setPaymentStatus(bookingService.determinePaymentStatus(booking, paidAmountAfter));
        bookingRepository.save(booking);
        bookingService.synchronizeCouponAssignment(booking);
        booking.setPaidAmount(paidAmountAfter);
        booking.setRemainingAmount(Math.max(0.0, finalAmount - paidAmountAfter));
        booking.setDepositOutstandingAmount(Math.max(0.0, depositAmount - paidAmountAfter));
        return booking;
    }

    @Transactional
    public Booking confirmBookingDeposit(Booking booking,
                                         String paymentMethod,
                                         boolean autoConfirmPending,
                                         LocalDateTime paymentDate) {
        if (booking == null || booking.getId() == null) {
            throw new IllegalArgumentException("Don dat phong khong hop le.");
        }

        bookingService.normalizeBookingFinancials(booking);
        double depositAmount = resolveDepositPayableAmount(booking);
        if (depositAmount <= 0) {
            if ("deposit_paid".equalsIgnoreCase(booking.getPaymentStatus()) || "paid".equalsIgnoreCase(booking.getPaymentStatus())) {
                return booking;
            }
            throw new IllegalArgumentException("Booking nay khong con so tien dat coc hop le.");
        }

        double paidAmountBefore = bookingService.resolvePaidAmount(booking);
        if (autoConfirmPending && "pending".equalsIgnoreCase(booking.getStatus())) {
            booking.setStatus("confirmed");
        }
        if (!"pending".equalsIgnoreCase(booking.getStatus())) {
            booking.setExpiresAt(null);
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(depositAmount);
        payment.setPaymentMethod(paymentMethod);
        payment.setPaymentDate(paymentDate == null ? LocalDateTime.now() : paymentDate);
        payment.setStatus("paid");
        paymentRepository.save(payment);

        double paidAmountAfter = paidAmountBefore + depositAmount;
        double finalAmount = booking.getFinalAmount() == null ? 0.0 : booking.getFinalAmount();
        double requiredDepositAmount = booking.getDepositAmount() == null ? 0.0 : booking.getDepositAmount();
        booking.setPaymentStatus(bookingService.determinePaymentStatus(booking, paidAmountAfter));
        bookingRepository.save(booking);
        bookingService.synchronizeCouponAssignment(booking);
        booking.setPaidAmount(paidAmountAfter);
        booking.setRemainingAmount(Math.max(0.0, finalAmount - paidAmountAfter));
        booking.setDepositOutstandingAmount(Math.max(0.0, requiredDepositAmount - paidAmountAfter));
        return booking;
    }

    private void validateCollectibleBooking(Booking booking) {
        bookingService.normalizeBookingFinancials(booking);
        if (!"confirmed".equalsIgnoreCase(booking.getStatus())) {
            if ("pending".equalsIgnoreCase(booking.getStatus())) {
                throw new IllegalArgumentException("Chi duoc thu tien mat cho booking da xac nhan.");
            }
            if ("completed".equalsIgnoreCase(booking.getStatus())) {
                throw new IllegalArgumentException("Booking da hoan thanh nen khong the thu tien mat lai.");
            }
            if ("cancelled".equalsIgnoreCase(booking.getStatus())) {
                throw new IllegalArgumentException("Don da bi huy nen khong the ghi nhan thanh toan.");
            }
            if ("expired".equalsIgnoreCase(booking.getStatus())) {
                throw new IllegalArgumentException("Don da het han giu cho nen khong the ghi nhan thanh toan.");
            }
            throw new IllegalArgumentException("Trang thai booking hien tai khong cho phep ghi nhan thanh toan.");
        }
        if ("paid".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new IllegalArgumentException("Booking nay da duoc thanh toan truoc do.");
        }
        if (resolvePayableAmount(booking) <= 0) {
            throw new IllegalArgumentException("Booking nay khong con so du can thanh toan.");
        }
    }

    private void validateDepositableBooking(Booking booking) {
        bookingService.normalizeBookingFinancials(booking);
        String normalizedStatus = String.valueOf(booking.getStatus()).toLowerCase();
        if (!"pending".equals(normalizedStatus) && !"confirmed".equals(normalizedStatus)) {
            if ("completed".equals(normalizedStatus)) {
                throw new IllegalArgumentException("Booking da hoan thanh nen khong the dat coc.");
            }
            if ("cancelled".equals(normalizedStatus)) {
                throw new IllegalArgumentException("Booking da bi huy nen khong the dat coc.");
            }
            if ("expired".equals(normalizedStatus)) {
                throw new IllegalArgumentException("Booking da het han giu cho nen khong the dat coc.");
            }
            throw new IllegalArgumentException("Trang thai booking hien tai khong cho phep dat coc.");
        }
        if ("paid".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new IllegalArgumentException("Booking nay da duoc thanh toan du.");
        }
        if ("deposit_paid".equalsIgnoreCase(booking.getPaymentStatus()) || resolveDepositPayableAmount(booking) <= 0) {
            throw new IllegalArgumentException("Booking nay da hoan tat buoc dat coc.");
        }
    }
}
