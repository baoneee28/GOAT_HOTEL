package com.hotel.repository;
import com.hotel.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    void deleteByBookingId(Integer bookingId);
    boolean existsByBooking_Id(Integer bookingId);
    boolean existsByBooking_IdAndPaymentMethodIgnoreCase(Integer bookingId, String paymentMethod);
}
