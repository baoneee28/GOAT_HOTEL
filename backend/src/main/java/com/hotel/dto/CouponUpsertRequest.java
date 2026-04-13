package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CouponUpsertRequest(
        @NotBlank(message = "Mã coupon không được để trống.")
        @Size(max = 50, message = "Mã coupon không được vượt quá 50 ký tự.")
        String code,
        @NotBlank(message = "Tên coupon không được để trống.")
        @Size(max = 150, message = "Tên coupon không được vượt quá 150 ký tự.")
        String name,
        String description,
        @NotBlank(message = "Loại giảm giá không được để trống.")
        String discountType,
        String targetEvent,
        @NotNull(message = "Giá trị giảm không được để trống.")
        @Positive(message = "Giá trị giảm phải lớn hơn 0.")
        Double discountValue,
        @NotNull(message = "Đơn tối thiểu không được để trống.")
        @PositiveOrZero(message = "Đơn tối thiểu không được âm.")
        Double minOrderValue,
        @PositiveOrZero(message = "Giảm tối đa không được âm.")
        Double maxDiscountAmount,
        @NotBlank(message = "Thời gian bắt đầu không được để trống.")
        String startDate,
        @NotBlank(message = "Thời gian kết thúc không được để trống.")
        String endDate,
        @Positive(message = "Giới hạn sử dụng phải lớn hơn 0.")
        Integer usageLimit,
        @Positive(message = "Giới hạn sử dụng mỗi người phải lớn hơn 0.")
        Integer perUserLimit,
        Boolean isActive
) {
}
