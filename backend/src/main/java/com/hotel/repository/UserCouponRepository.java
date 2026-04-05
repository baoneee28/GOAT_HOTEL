package com.hotel.repository;

import com.hotel.entity.UserCoupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserCouponRepository extends JpaRepository<UserCoupon, Integer> {

    @Query("SELECT uc FROM UserCoupon uc " +
            "JOIN FETCH uc.coupon c " +
            "LEFT JOIN FETCH uc.assignedBy ab " +
            "LEFT JOIN FETCH uc.booking b " +
            "WHERE uc.user.id = :userId " +
            "ORDER BY uc.assignedAt DESC, uc.id DESC")
    List<UserCoupon> findAllByUserIdWithCoupon(@Param("userId") Integer userId);

    @Query("SELECT uc FROM UserCoupon uc " +
            "JOIN FETCH uc.coupon c " +
            "LEFT JOIN FETCH uc.assignedBy ab " +
            "LEFT JOIN FETCH uc.booking b " +
            "WHERE uc.id = :id AND uc.user.id = :userId")
    Optional<UserCoupon> findOwnedCoupon(@Param("id") Integer id, @Param("userId") Integer userId);

    @Query("SELECT uc FROM UserCoupon uc " +
            "JOIN FETCH uc.user u " +
            "JOIN FETCH uc.coupon c " +
            "LEFT JOIN FETCH uc.assignedBy ab " +
            "LEFT JOIN FETCH uc.booking b " +
            "WHERE uc.coupon.id = :couponId " +
            "ORDER BY uc.assignedAt DESC, uc.id DESC")
    List<UserCoupon> findAllByCouponIdWithHolder(@Param("couponId") Integer couponId);

    @Query("SELECT uc FROM UserCoupon uc " +
            "JOIN FETCH uc.coupon c " +
            "LEFT JOIN FETCH uc.assignedBy ab " +
            "LEFT JOIN FETCH uc.user u " +
            "WHERE uc.booking.id = :bookingId")
    Optional<UserCoupon> findByBookingId(@Param("bookingId") Integer bookingId);

    long countByCoupon_Id(Integer couponId);

    long countByCoupon_IdAndStatusIgnoreCase(Integer couponId, String status);

    List<UserCoupon> findByStatusIgnoreCaseAndExpiresAtLessThanEqual(String status, LocalDateTime expiresAt);
}
