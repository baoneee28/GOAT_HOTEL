package com.hotel.repository;
import com.hotel.entity.BookingService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingServiceRepository extends JpaRepository<BookingService, Integer> {
    void deleteByBookingId(Integer bookingId);
}
