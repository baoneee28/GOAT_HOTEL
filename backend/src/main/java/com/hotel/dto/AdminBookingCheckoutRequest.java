package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AdminBookingCheckoutRequest(
        @NotBlank(message = "Hình thức checkout không được để trống.")
        @Pattern(regexp = "normal|keep|recalc", message = "Hình thức checkout không hợp lệ.")
        String checkoutType
) {
}
