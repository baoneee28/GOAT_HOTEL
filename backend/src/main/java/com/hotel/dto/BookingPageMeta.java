package com.hotel.dto;

import java.util.Map;

public record BookingPageMeta(
        int currentPage,
        int pageSize,
        int totalPages,
        long totalElements,
        Map<String, Long> statusSummary
) {
}
