package com.hotel.config;

import com.hotel.entity.Booking;
import com.hotel.entity.BookingDetail;
import com.hotel.repository.BookingRepository;
import com.hotel.service.BookingService;
import jakarta.transaction.Transactional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class BookingPriceBackfillRunner implements CommandLineRunner {

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;

    public BookingPriceBackfillRunner(BookingRepository bookingRepository, BookingService bookingService) {
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<Booking> changedBookings = new ArrayList<>();
        var now = java.time.LocalDateTime.now();

        for (Booking booking : bookingRepository.findAll()) {
            boolean changed = false;
            double recalculatedTotal = 0.0;
            boolean hasBookingDetails = booking.getDetails() != null && !booking.getDetails().isEmpty();

            if (bookingService.synchronizeBookingState(booking, now)) {
                changed = true;
            }

            if (hasBookingDetails) {
                for (BookingDetail detail : booking.getDetails()) {
                    if (detail == null
                            || detail.getPriceAtBooking() == null
                            || detail.getCheckIn() == null
                            || detail.getCheckOut() == null) {
                        continue;
                    }

                    recalculatedTotal += bookingService.calculatePriceIndex(
                            detail.getCheckIn(),
                            detail.getCheckOut(),
                            detail.getPriceAtBooking()
                    );

                    double recalculatedHours = bookingService.calculateHours(detail.getCheckIn(), detail.getCheckOut());
                    if (detail.getTotalHours() == null || Math.abs(detail.getTotalHours() - recalculatedHours) > 0.01) {
                        detail.setTotalHours(recalculatedHours);
                        changed = true;
                    }
                }
            }

            if (hasBookingDetails && (booking.getTotalPrice() == null || Math.abs(booking.getTotalPrice() - recalculatedTotal) > 0.01)) {
                booking.setTotalPrice(recalculatedTotal);
                changed = true;
            }

            if (booking.getDiscountAmount() == null) {
                booking.setDiscountAmount(0.0);
                changed = true;
            }

            double discountAmount = booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount();
            double finalAmount = Math.max(0.0, recalculatedTotal - discountAmount);
            if (hasBookingDetails && (booking.getFinalAmount() == null || Math.abs(booking.getFinalAmount() - finalAmount) > 0.01)) {
                booking.setFinalAmount(finalAmount);
                changed = true;
            } else if (booking.getFinalAmount() == null && booking.getTotalPrice() != null) {
                booking.setFinalAmount(Math.max(0.0, booking.getTotalPrice() - discountAmount));
                changed = true;
            }

            double depositAmount = bookingService.resolveDepositRequiredAmount(booking);
            if (booking.getDepositAmount() == null || Math.abs(booking.getDepositAmount() - depositAmount) > 0.01) {
                booking.setDepositAmount(depositAmount);
                changed = true;
            }

            if (booking.getPaymentStatus() == null || booking.getPaymentStatus().isBlank()) {
                booking.setPaymentStatus(bookingService.inferLegacyPaymentStatus(booking));
                changed = true;
            }

            if (changed) {
                changedBookings.add(booking);
            }
        }

        if (!changedBookings.isEmpty()) {
            bookingRepository.saveAll(changedBookings);
        }
    }
}
