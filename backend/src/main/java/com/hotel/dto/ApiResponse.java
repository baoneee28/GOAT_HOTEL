package com.hotel.dto;

public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        Object meta
) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, null, data, null);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data, null);
    }

    public static <T> ApiResponse<T> ok(T data, Object meta) {
        return new ApiResponse<>(true, null, data, meta);
    }

    public static <T> ApiResponse<T> ok(String message, T data, Object meta) {
        return new ApiResponse<>(true, message, data, meta);
    }

    public static ApiResponse<Void> okMessage(String message) {
        return new ApiResponse<>(true, message, null, null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, null);
    }

    public static <T> ApiResponse<T> error(String message, Object meta) {
        return new ApiResponse<>(false, message, null, meta);
    }
}
