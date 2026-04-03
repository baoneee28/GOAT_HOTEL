package com.hotel.repository;

import com.hotel.entity.RoomType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Integer> {


    @Query("SELECT t FROM RoomType t WHERE :search IS NULL OR :search = '' OR t.typeName LIKE %:search%")
    Page<RoomType> findWithSearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT r.roomType.id, COUNT(r) FROM Room r WHERE r.status != 'maintenance' AND r.id NOT IN " +
           "(SELECT bd.room.id FROM BookingDetail bd JOIN bd.booking b " +
           "WHERE (b.status = 'confirmed' OR (b.status = 'pending' AND b.expiresAt > :now)) " +
           "AND (bd.checkIn < :checkOut AND bd.checkOut > :checkIn)) " +
           "GROUP BY r.roomType.id")
    java.util.List<Object[]> countAvailableRoomsByDate(@Param("checkIn") java.time.LocalDateTime checkIn, 
                                             @Param("checkOut") java.time.LocalDateTime checkOut,
                                             @Param("now") java.time.LocalDateTime now);

    long countByImage(String image);
}
