package com.hotel.repository;
import com.hotel.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingDetailRepository extends JpaRepository<BookingDetail, Integer> {
    void deleteByBookingId(Integer bookingId);

    boolean existsByRoom_Id(Integer roomId);
    boolean existsByRoom_RoomType_Id(Integer roomTypeId);

    @Query("SELECT DISTINCT bd.room.id FROM BookingDetail bd JOIN bd.booking b " +
           "WHERE bd.room.id IS NOT NULL AND b.status = 'confirmed' " +
           "AND bd.checkInActual IS NOT NULL AND bd.checkInActual <= :atTime AND bd.checkOutActual IS NULL")
    List<Integer> findOccupiedRoomIdsAt(@Param("atTime") LocalDateTime atTime);

    @Query("SELECT DISTINCT bd.room.id FROM BookingDetail bd JOIN bd.booking b " +
           "WHERE bd.room.id IS NOT NULL AND bd.checkOut > :atTime " +
           "AND ((b.status = 'pending' AND b.expiresAt > :atTime) " +
           "OR (b.status = 'confirmed' AND bd.checkInActual IS NULL))")
    List<Integer> findReservedRoomIdsAfter(@Param("atTime") LocalDateTime atTime);
}
