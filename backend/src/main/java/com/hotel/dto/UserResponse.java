package com.hotel.dto;

import com.hotel.entity.User;

import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(
        Integer id,
        String fullName,
        String email,
        String phone,
        String image,
        String role,
        LocalDateTime createdAt
) {

    public static UserResponse from(User user) {
        if (user == null) {
            return null;
        }

        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getImage(),
                user.getRole(),
                user.getCreatedAt()
        );
    }

    public static List<UserResponse> fromList(List<User> users) {
        if (users == null || users.isEmpty()) {
            return List.of();
        }

        return users.stream()
                .map(UserResponse::from)
                .toList();
    }
}
