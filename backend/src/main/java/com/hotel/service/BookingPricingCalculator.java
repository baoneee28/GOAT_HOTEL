package com.hotel.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public final class BookingPricingCalculator {

    private BookingPricingCalculator() {
    }

    public record BookingPricingSummary(
            long nights,
            double hours,
            double total
    ) {
    }

    public static BookingPricingSummary summarize(LocalDateTime checkIn, LocalDateTime checkOut, double pricePerNight) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            return new BookingPricingSummary(0, 0.0, 0.0);
        }

        long nights = calculateStayNights(checkIn, checkOut);
        double hours = calculateHours(checkIn, checkOut);
        double total = roundCurrency(nights * pricePerNight);
        return new BookingPricingSummary(nights, hours, total);
    }

    public static long calculateStayNights(LocalDateTime checkIn, LocalDateTime checkOut) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            return 0;
        }

        long nights = ChronoUnit.DAYS.between(checkIn.toLocalDate(), checkOut.toLocalDate());
        return Math.max(1, nights);
    }

    public static double calculateHours(LocalDateTime checkIn, LocalDateTime checkOut) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            return 0.0;
        }

        long totalSeconds = ChronoUnit.SECONDS.between(checkIn, checkOut);
        double hours = totalSeconds / 3600.0;
        return Math.round(hours * 100.0) / 100.0;
    }

    private static double roundCurrency(double amount) {
        return Math.round(amount);
    }
}
