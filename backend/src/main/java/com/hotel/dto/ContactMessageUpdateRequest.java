package com.hotel.dto;

import jakarta.validation.constraints.Size;

public record ContactMessageUpdateRequest(
        String status,
        @Size(max = 4000, message = "Ghi chú nội bộ quá dài.")
        String adminNote
) {
}
