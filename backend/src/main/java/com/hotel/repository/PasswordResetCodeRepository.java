package com.hotel.repository;

import com.hotel.entity.PasswordResetCode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Integer> {
    Optional<PasswordResetCode> findTopByEmailAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String email, LocalDateTime now);
}
