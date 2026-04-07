package com.hotel.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class BookingPricingCalculatorTest {

    // ── calculateStayNights ──

    @Test
    void calculateStayNightsReturnsOneDayForSameDayStay() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 4, 10, 14, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 4, 10, 18, 0);

        long nights = BookingPricingCalculator.calculateStayNights(checkIn, checkOut);

        assertThat(nights).isEqualTo(1);
    }

    @Test
    void calculateStayNightsReturnsCorrectForMultipleDays() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 4, 10, 14, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 4, 13, 12, 0);

        long nights = BookingPricingCalculator.calculateStayNights(checkIn, checkOut);

        assertThat(nights).isEqualTo(3);
    }

    @Test
    void calculateStayNightsReturnsZeroForNullInput() {
        assertThat(BookingPricingCalculator.calculateStayNights(null, null)).isZero();
        assertThat(BookingPricingCalculator.calculateStayNights(
                LocalDateTime.of(2026, 4, 10, 14, 0), null)).isZero();
    }

    @Test
    void calculateStayNightsReturnsZeroForInvalidRange() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 4, 13, 14, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 4, 10, 12, 0);

        assertThat(BookingPricingCalculator.calculateStayNights(checkIn, checkOut)).isZero();
    }

    // ── calculateHours ──

    @Test
    void calculateHoursReturnsCorrectValueForShortStay() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 4, 10, 14, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 4, 10, 16, 30);

        double hours = BookingPricingCalculator.calculateHours(checkIn, checkOut);

        assertThat(hours).isEqualTo(2.5);
    }

    @ParameterizedTest
    @CsvSource({
            "14,0, 15,31, 1.52",
            "14,0, 14,0,  0.0",
            "0,0,  23,59, 23.98"
    })
    void calculateHoursParameterized(int h1, int m1, int h2, int m2, double expected) {
        LocalDateTime checkIn = LocalDateTime.of(2026, 4, 10, h1, m1);
        LocalDateTime checkOut = LocalDateTime.of(2026, 4, 10, h2, m2);

        if (checkOut.isAfter(checkIn)) {
            assertThat(BookingPricingCalculator.calculateHours(checkIn, checkOut)).isEqualTo(expected);
        } else {
            assertThat(BookingPricingCalculator.calculateHours(checkIn, checkOut)).isZero();
        }
    }

    @Test
    void calculateHoursReturnsZeroForNullInput() {
        assertThat(BookingPricingCalculator.calculateHours(null, null)).isZero();
    }

    // ── summarize ──

    @Test
    void summarizeCalculatesCorrectTotalForTwoNights() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 4, 10, 14, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 4, 12, 12, 0);
        double pricePerNight = 500_000;

        BookingPricingCalculator.BookingPricingSummary summary =
                BookingPricingCalculator.summarize(checkIn, checkOut, pricePerNight);

        assertThat(summary.nights()).isEqualTo(2);
        assertThat(summary.total()).isEqualTo(1_000_000);
        assertThat(summary.hours()).isGreaterThan(0);
    }

    @Test
    void summarizeReturnsSingleNightForSameDay() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 4, 10, 9, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 4, 10, 17, 0);
        double pricePerNight = 800_000;

        BookingPricingCalculator.BookingPricingSummary summary =
                BookingPricingCalculator.summarize(checkIn, checkOut, pricePerNight);

        assertThat(summary.nights()).isEqualTo(1);
        assertThat(summary.total()).isEqualTo(800_000);
    }

    @Test
    void summarizeReturnsZeroForInvalidRange() {
        BookingPricingCalculator.BookingPricingSummary summary =
                BookingPricingCalculator.summarize(null, null, 500_000);

        assertThat(summary.nights()).isZero();
        assertThat(summary.total()).isZero();
        assertThat(summary.hours()).isZero();
    }

    @Test
    void summarizeRoundsTotalToCurrency() {
        LocalDateTime checkIn = LocalDateTime.of(2026, 4, 10, 14, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 4, 13, 12, 0);
        double pricePerNight = 333_333.33;

        BookingPricingCalculator.BookingPricingSummary summary =
                BookingPricingCalculator.summarize(checkIn, checkOut, pricePerNight);

        assertThat(summary.nights()).isEqualTo(3);
        assertThat(summary.total()).isEqualTo(Math.round(3 * 333_333.33));
    }
}
