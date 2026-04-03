package com.hotel.repository;
import com.hotel.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    void deleteByBookingId(Integer bookingId);
    boolean existsByBooking_Id(Integer bookingId);
    boolean existsByBooking_IdAndPaymentMethodIgnoreCase(Integer bookingId, String paymentMethod);
    Optional<Payment> findTopByBooking_IdOrderByPaymentDateDesc(Integer bookingId);
    List<Payment> findByStatusIgnoreCaseAndPaymentDateBetweenOrderByPaymentDateAsc(String status, LocalDateTime start, LocalDateTime end);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE LOWER(p.status) = 'paid'")
    Double sumPaidRevenue();

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE LOWER(p.status) = 'paid' AND p.booking.id = :bookingId")
    Double sumPaidRevenueByBookingId(@Param("bookingId") Integer bookingId);
}
