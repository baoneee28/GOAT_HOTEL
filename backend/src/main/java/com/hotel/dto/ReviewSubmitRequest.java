package com.hotel.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ReviewSubmitRequest(
        @NotNull(message = "Booking không được để trống.")
        Integer bookingId,

        @NotNull(message = "Rating không được để trống.")
        @Min(value = 1, message = "Rating phải nằm trong khoảng từ 1 đến 5.")
        @Max(value = 5, message = "Rating phải nằm trong khoảng từ 1 đến 5.")
        Integer rating,

        String comment
) {
}
