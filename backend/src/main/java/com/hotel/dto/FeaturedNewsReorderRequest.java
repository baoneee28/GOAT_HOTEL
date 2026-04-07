package com.hotel.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record FeaturedNewsReorderRequest(
        @NotEmpty(message = "Danh sách thứ tự nổi bật không được để trống.")
        List<Integer> featuredIds
) {
}
