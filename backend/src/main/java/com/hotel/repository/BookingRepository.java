package com.hotel.repository;

import com.hotel.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {





    @Query("SELECT b FROM Booking b " +
           "WHERE b.user.id = :userId AND b.status IN ('pending', 'confirmed') " +
           "ORDER BY b.id DESC")
    List<Booking> findActiveBookingByUserId(@Param("userId") Integer userId);




    @Query(value = "SELECT b FROM Booking b " +
           "WHERE b.user.id = :userId AND (:status IS NULL OR :status = 'all' OR b.status = :status) " +
           "ORDER BY b.id DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.user.id = :userId AND (:status IS NULL OR :status = 'all' OR b.status = :status)")
    Page<Booking> findByUserIdAndStatus(@Param("userId") Integer userId,
                                         @Param("status") String status,
                                         Pageable pageable);


    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.user.id = :userId AND (:status IS NULL OR :status = 'all' OR b.status = :status)")
    long countByUserIdAndStatus(@Param("userId") Integer userId, @Param("status") String status);



    @Query("SELECT SUM(b.totalPrice) FROM Booking b WHERE b.user.id = :userId AND b.status = 'completed'")
    Double sumTotalPriceByUserIdAndCompleted(@Param("userId") Integer userId);



    @Query("SELECT SUM(b.totalPrice) FROM Booking b WHERE b.status = 'completed'")
    Double sumTotalRevenue();



    long countByStatus(String status);


    @Query(value = "SELECT b FROM Booking b JOIN FETCH b.user u " +
           "WHERE (:status IS NULL OR :status = '' OR b.status = :status) " +
           "ORDER BY b.id DESC", countQuery = "SELECT COUNT(b) FROM Booking b WHERE (:status IS NULL OR :status = '' OR b.status = :status)")
    Page<Booking> findAdminBookings(@Param("status") String status, Pageable pageable);

    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE (:status IS NULL OR :status = '' OR b.status = :status)")
    long countAdminBookings(@Param("status") String status);
}
