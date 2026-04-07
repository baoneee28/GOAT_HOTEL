package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminRoomUpsertRequest(
        Integer id,
        @NotBlank(message = "Số phòng không được để trống.")
        @Size(max = 10, message = "Số phòng tối đa 10 ký tự.")
        String roomNumber,
        @NotNull(message = "Loại phòng không được để trống.")
        Integer typeId,
        @NotBlank(message = "Trạng thái phòng không được để trống.")
        String status
) {
}
