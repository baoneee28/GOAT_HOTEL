package com.hotel.service;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;

@Service
public class StayDateTimeService {

    public static final LocalTime DEFAULT_CHECK_IN_TIME = LocalTime.of(14, 0);
    public static final LocalTime DEFAULT_CHECK_OUT_TIME = LocalTime.of(12, 0);

    public record StayWindow(LocalDateTime checkIn, LocalDateTime checkOut) {
    }

    public StayWindow resolvePublicStayWindow(String rawCheckIn, String rawCheckOut) {
        ParsedStayInput parsedCheckIn = parseStayInput(rawCheckIn, DEFAULT_CHECK_IN_TIME, "Ngày nhận phòng");
        ParsedStayInput parsedCheckOut = parseStayInput(rawCheckOut, DEFAULT_CHECK_OUT_TIME, "Ngày trả phòng");

        LocalDateTime checkIn = parsedCheckIn.value();
        LocalDateTime checkOut = parsedCheckOut.value();

        if (parsedCheckIn.dateOnly() && parsedCheckOut.dateOnly()) {
            LocalDateTime now = LocalDateTime.now();
            long requestedNights = ChronoUnit.DAYS.between(checkIn.toLocalDate(), checkOut.toLocalDate());
            long stayNights = requestedNights > 0 ? requestedNights : 1;

            if (!checkIn.isAfter(now)) {
                checkIn = resolveNextPublicCheckIn(now);
                checkOut = checkIn.toLocalDate().plusDays(stayNights).atTime(DEFAULT_CHECK_OUT_TIME);
            } else if (!checkOut.isAfter(checkIn)) {
                checkOut = checkIn.toLocalDate().plusDays(stayNights).atTime(DEFAULT_CHECK_OUT_TIME);
            }
        }

        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng.");
        }

        return new StayWindow(checkIn, checkOut);
    }

    public LocalDateTime parseDateTime(String raw, LocalTime defaultTime, String label) {
        return parseStayInput(raw, defaultTime, label).value();
    }

    private LocalDateTime resolveNextPublicCheckIn(LocalDateTime referenceTime) {
        LocalDateTime nextCheckIn = referenceTime
                .withHour(DEFAULT_CHECK_IN_TIME.getHour())
                .withMinute(DEFAULT_CHECK_IN_TIME.getMinute())
                .withSecond(0)
                .withNano(0);

        if (referenceTime.isBefore(nextCheckIn)) {
            return nextCheckIn;
        }

        return nextCheckIn.plusDays(1);
    }

    private ParsedStayInput parseStayInput(String raw, LocalTime defaultTime, String label) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException(label + " không được để trống.");
        }

        String normalized = raw.trim();
        try {
            if (normalized.length() == 10) {
                return new ParsedStayInput(LocalDate.parse(normalized).atTime(defaultTime), true);
            }
            if (normalized.contains(" ")) {
                normalized = normalized.replace(" ", "T");
            }
            return new ParsedStayInput(LocalDateTime.parse(normalized), false);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(label + " không hợp lệ.");
        }
    }

    private record ParsedStayInput(LocalDateTime value, boolean dateOnly) {
    }
}
