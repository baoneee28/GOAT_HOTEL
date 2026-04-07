package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AdminRoomTypeUpsertRequest(
        Integer id,
        @NotBlank(message = "Tên loại phòng không được để trống.")
        @Size(max = 100, message = "Tên loại phòng không được vượt quá 100 ký tự.")
        String typeName,
        @NotNull(message = "Giá phòng không được để trống.")
        @Positive(message = "Giá phòng phải lớn hơn 0.")
        Double pricePerNight,
        @NotNull(message = "Sức chứa không được để trống.")
        @Positive(message = "Sức chứa phải lớn hơn 0.")
        Integer capacity,
        @Size(max = 50, message = "Thông tin diện tích quá dài.")
        String size,
        @Size(max = 100, message = "Thông tin giường quá dài.")
        String beds,
        @Size(max = 100, message = "Thông tin view quá dài.")
        String view,
        String description,
        @Size(max = 255, message = "Đường dẫn ảnh quá dài.")
        String image,
        List<Integer> itemIds
) {
}
