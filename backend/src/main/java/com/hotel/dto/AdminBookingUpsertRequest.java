package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AdminBookingUpsertRequest(
        @Positive(message = "Mã booking không hợp lệ.")
        Integer id,
        @NotNull(message = "Khách hàng không được để trống.")
        @Positive(message = "Khách hàng không hợp lệ.")
        Integer userId,
        @NotNull(message = "Phòng không được để trống.")
        @Positive(message = "Phòng không hợp lệ.")
        Integer roomId,
        @NotBlank(message = "Ngày nhận phòng không được để trống.")
        String checkIn,
        @NotBlank(message = "Ngày trả phòng không được để trống.")
        String checkOut,
        @Positive(message = "Số khách phải lớn hơn 0.")
        Integer guestCount,
        @NotBlank(message = "Trạng thái booking không được để trống.")
        String status
) {
}
