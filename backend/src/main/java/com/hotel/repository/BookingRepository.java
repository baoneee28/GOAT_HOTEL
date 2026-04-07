package com.hotel.repository;

import com.hotel.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;


@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {
    @Query("SELECT b FROM Booking b " +
           "WHERE b.user.id = :userId AND b.status = 'pending' AND b.expiresAt > :now " +
           "ORDER BY b.expiresAt DESC, b.id DESC")
    List<Booking> findActivePendingBookingByUserId(@Param("userId") Integer userId,
                                                   @Param("now") LocalDateTime now);




    @Query(value = "SELECT b FROM Booking b " +
           "WHERE b.user.id = :userId AND (:status IS NULL OR :status = 'all' OR b.status = :status) " +
           "ORDER BY b.id DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.user.id = :userId AND (:status IS NULL OR :status = 'all' OR b.status = :status)")
    Page<Booking> findByUserIdAndStatus(@Param("userId") Integer userId,
                                         @Param("status") String status,
                                         Pageable pageable);

    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND b.status = :status ORDER BY b.id DESC")
    List<Booking> findAllByUserIdAndStatus(@Param("userId") Integer userId, @Param("status") String status);

    @Query("SELECT DISTINCT b FROM Booking b " +
           "LEFT JOIN FETCH b.details bd " +
           "LEFT JOIN FETCH bd.room r " +
           "LEFT JOIN FETCH r.roomType rt " +
           "WHERE b.user.id = :userId " +
           "ORDER BY b.id DESC")
    List<Booking> findAllHistoryByUserId(@Param("userId") Integer userId);

    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND b.paymentStatus = :paymentStatus ORDER BY b.id DESC")
    List<Booking> findAllByUserIdAndPaymentStatus(@Param("userId") Integer userId, @Param("paymentStatus") String paymentStatus);


    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.user.id = :userId AND (:status IS NULL OR :status = 'all' OR b.status = :status)")
    long countByUserIdAndStatus(@Param("userId") Integer userId, @Param("status") String status);



    @Query("SELECT SUM(COALESCE(b.finalAmount, b.totalPrice)) FROM Booking b WHERE b.user.id = :userId AND b.status = 'completed'")
    Double sumTotalPriceByUserIdAndCompleted(@Param("userId") Integer userId);



    @Query("SELECT SUM(COALESCE(b.finalAmount, b.totalPrice)) FROM Booking b WHERE b.status = 'completed'")
    Double sumTotalRevenue();

    List<Booking> findByStatusAndExpiresAtLessThanEqual(String status, LocalDateTime expiresAt);

    List<Booking> findByStatusAndExpiresAtIsNull(String status);

    List<Booking> findByStatusAndCreatedAtBetweenOrderByCreatedAtAsc(String status,
                                                                     LocalDateTime start,
                                                                     LocalDateTime end);



    long countByStatus(String status);


    @Query(value = "SELECT b FROM Booking b JOIN FETCH b.user u " +
           "WHERE (:status IS NULL OR :status = '' OR b.status = :status) " +
           "ORDER BY b.id DESC", countQuery = "SELECT COUNT(b) FROM Booking b WHERE (:status IS NULL OR :status = '' OR b.status = :status)")
    Page<Booking> findAdminBookings(@Param("status") String status, Pageable pageable);

    @Query(value = "SELECT DISTINCT b FROM Booking b JOIN FETCH b.user u " +
           "LEFT JOIN b.details bd " +
           "WHERE (:status IS NULL OR :status = '' OR b.status = :status) " +
           "AND (:fromDateTime IS NULL OR :toDateTime IS NULL OR (bd.checkIn < :toDateTime AND bd.checkOut > :fromDateTime)) " +
           "ORDER BY b.id DESC",
           countQuery = "SELECT COUNT(DISTINCT b) FROM Booking b " +
                   "LEFT JOIN b.details bd " +
                   "WHERE (:status IS NULL OR :status = '' OR b.status = :status) " +
                   "AND (:fromDateTime IS NULL OR :toDateTime IS NULL OR (bd.checkIn < :toDateTime AND bd.checkOut > :fromDateTime))")
    Page<Booking> findAdminBookingsByFilters(@Param("status") String status,
                                             @Param("fromDateTime") LocalDateTime fromDateTime,
                                             @Param("toDateTime") LocalDateTime toDateTime,
                                             Pageable pageable);

    @Query(value = "SELECT b FROM Booking b JOIN FETCH b.user u " +
           "WHERE b.user.id = :userId AND (:status IS NULL OR :status = '' OR b.status = :status) " +
           "ORDER BY b.id DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.user.id = :userId AND (:status IS NULL OR :status = '' OR b.status = :status)")
    Page<Booking> findAdminBookingsByUserId(@Param("userId") Integer userId,
                                            @Param("status") String status,
                                            Pageable pageable);

    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE (:status IS NULL OR :status = '' OR b.status = :status)")
    long countAdminBookings(@Param("status") String status);

    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.couponCode IS NOT NULL AND UPPER(b.couponCode) = UPPER(:couponCode) " +
           "AND (" +
           "LOWER(b.status) IN ('confirmed', 'completed') " +
           "OR (LOWER(b.status) = 'pending' AND (b.expiresAt IS NULL OR b.expiresAt > CURRENT_TIMESTAMP))" +
           ")")
    long countActiveCouponUsages(@Param("couponCode") String couponCode);

    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.couponCode IS NOT NULL AND UPPER(b.couponCode) = UPPER(:couponCode)")
    long countAllCouponUsages(@Param("couponCode") String couponCode);

    @Query("SELECT COUNT(b) FROM BookingDetail bd JOIN bd.booking b " +
           "WHERE bd.room.id = :roomId AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.expiresAt > :now)) " +
           "AND bd.checkIn < :checkOut AND bd.checkOut > :checkIn")
    long countOverlappingBookings(@Param("roomId") Integer roomId, 
                                  @Param("checkIn") java.time.LocalDateTime checkIn, 
                                  @Param("checkOut") java.time.LocalDateTime checkOut,
                                  @Param("now") java.time.LocalDateTime now);

    @Query("SELECT COUNT(b) FROM BookingDetail bd JOIN bd.booking b " +
           "WHERE bd.room.id = :roomId AND b.id != :excludeBookingId " +
           "AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.expiresAt > :now)) " +
           "AND bd.checkIn < :checkOut AND bd.checkOut > :checkIn")
    long countOverlappingBookingsExcept(@Param("roomId") Integer roomId, 
                                        @Param("checkIn") java.time.LocalDateTime checkIn, 
                                        @Param("checkOut") java.time.LocalDateTime checkOut,
                                        @Param("excludeBookingId") Integer excludeBookingId,
                                        @Param("now") java.time.LocalDateTime now);
}
