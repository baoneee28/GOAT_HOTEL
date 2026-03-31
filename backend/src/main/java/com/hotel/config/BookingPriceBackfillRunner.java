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

        for (Booking booking : bookingRepository.findAll()) {
            if (booking.getDetails() == null || booking.getDetails().isEmpty()) {
                continue;
            }

            boolean changed = false;
            double recalculatedTotal = 0.0;

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

            if (booking.getTotalPrice() == null || Math.abs(booking.getTotalPrice() - recalculatedTotal) > 0.01) {
                booking.setTotalPrice(recalculatedTotal);
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
