package com.hotel.repository;
import com.hotel.entity.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    void deleteByBookingId(Integer bookingId);
    List<Review> findByBookingId(Integer bookingId);
    List<Review> findByRoomTypeIdOrderByCreatedAtDesc(Integer roomTypeId);
}
