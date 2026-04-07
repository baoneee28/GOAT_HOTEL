package com.hotel.service;

import com.hotel.entity.Booking;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.PaymentRepository;
import com.hotel.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingDetailRepository bookingDetailRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private CouponService couponService;

    @InjectMocks
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        BookingService service = Objects.requireNonNull(bookingService);
        ReflectionTestUtils.setField(service, "pendingHoldSeconds", 120L);
        ReflectionTestUtils.setField(service, "bookingDepositRatio", 0.3d);
    }

    @Test
    void calculateStayNightsReturnsMinimumOneNightForSameDayStay() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 4, 10, 9, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 4, 10, 18, 0);

        long nights = bookingService.calculateStayNights(checkIn, checkOut);

        assertThat(nights).isEqualTo(1);
    }

    @Test
    void calculateHoursRoundsToTwoDecimals() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 4, 10, 14, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 4, 10, 15, 31);

        double hours = bookingService.calculateHours(checkIn, checkOut);

        assertThat(hours).isEqualTo(1.52);
    }

    @Test
    void calculateDepositAmountAppliesConfiguredRatio() {
        double depositAmount = bookingService.calculateDepositAmount(999_999d);

        assertThat(depositAmount).isEqualTo(300_000d);
    }

    @Test
    void determinePaymentStatusReturnsDepositPaidWhenDepositIsCovered() {
        Booking booking = new Booking();
        booking.setTotalPrice(1_000_000d);
        booking.setDiscountAmount(0d);
        booking.setFinalAmount(1_000_000d);

        String paymentStatus = bookingService.determinePaymentStatus(booking, 300_000d);

        assertThat(paymentStatus).isEqualTo("deposit_paid");
    }

    @Test
    void validateAdminCreateStatusRejectsCompletedStatus() {
        assertThatThrownBy(() -> bookingService.validateAdminCreateStatus("completed"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Booking mới chỉ có thể tạo");
    }

    @Test
    void validateAdminEditableStatusAllowsPendingToConfirmed() {
        String nextStatus = bookingService.validateAdminEditableStatus("pending", "confirmed");

        assertThat(nextStatus).isEqualTo("confirmed");
    }

    @Test
    void validateAdminEditableStatusRejectsConfirmedToCompleted() {
        assertThatThrownBy(() -> bookingService.validateAdminEditableStatus("confirmed", "completed"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Đơn đã xác nhận chỉ có thể đổi sang đã hủy");
    }

    @Test
    void normalizeAdminPaymentStatusResetsPendingPaymentOutsidePendingBooking() {
        String paymentStatus = bookingService.normalizeAdminPaymentStatus("pending_payment", "expired");

        assertThat(paymentStatus).isEqualTo("unpaid");
    }

    @Test
    void preparePendingBookingKeepsExistingExpiryForUnchangedPendingStatus() {
        Booking booking = new Booking();
        LocalDateTime existingExpiry = LocalDateTime.of(2026, 4, 10, 12, 0);
        booking.setStatus("pending");
        booking.setExpiresAt(existingExpiry);

        bookingService.preparePendingBooking(booking, "pending");

        assertThat(booking.getExpiresAt()).isEqualTo(existingExpiry);
    }

    @Test
    void synchronizeBookingStateExpiresPendingBookingAndMarksFailedPayment() {
        LocalDateTime now = LocalDateTime.of(2026, 4, 10, 12, 0);
        Booking booking = new Booking();
        booking.setStatus("pending");
        booking.setPaymentStatus("pending_payment");
        booking.setCreatedAt(now.minusMinutes(10));
        booking.setExpiresAt(now.minusSeconds(1));

        boolean changed = bookingService.synchronizeBookingState(booking, now);

        assertThat(changed).isTrue();
        assertThat(booking.getStatus()).isEqualTo("expired");
        assertThat(booking.getPaymentStatus()).isEqualTo("failed");
        assertThat(booking.getExpiresAt()).isEqualTo(now.minusSeconds(1));
    }
}
