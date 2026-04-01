package com.hotel.repository;

import com.hotel.entity.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {


    List<Room> findByRoomTypeIdOrderByRoomNumberAsc(Integer typeId);

    List<Room> findByRoomTypeIdAndStatusOrderByRoomNumberAsc(Integer typeId, String status);

    List<Room> findAllByOrderByIdDesc();

    List<Room> findByRoomNumberContainingOrderByIdDesc(String roomNumber);

    @Query("SELECT r FROM Room r WHERE r.roomType.id = :typeId AND r.status != 'maintenance' AND r.id NOT IN " +
           "(SELECT bd.room.id FROM BookingDetail bd JOIN bd.booking b " +
           "WHERE (b.status = 'confirmed' OR (b.status = 'pending' AND b.expiresAt > :now)) " +
           "AND (bd.checkIn < :checkOut AND bd.checkOut > :checkIn))")
    List<Room> findAvailableRoomsByDate(@Param("typeId") Integer typeId, 
                                        @Param("checkIn") java.time.LocalDateTime checkIn, 
                                        @Param("checkOut") java.time.LocalDateTime checkOut,
                                        @Param("now") java.time.LocalDateTime now);

    List<Room> findByStatus(String status);





    @Query("SELECT r.status, COUNT(r) FROM Room r GROUP BY r.status")
    List<Object[]> countByStatusGroup();


    @Query("SELECT MAX(r.id) FROM Room r")
    Integer findMaxId();

    java.util.Optional<Room> findByRoomNumber(String roomNumber);

    boolean existsByRoomType_IdAndStatusIgnoreCase(Integer roomTypeId, String status);


    @Query("SELECT r FROM Room r LEFT JOIN r.roomType t WHERE " +
           "(:search IS NULL OR :search = '' OR r.roomNumber LIKE %:search%) AND " +
           "(:status IS NULL OR :status = '' OR r.status = :status)")
    Page<Room> findWithFilter(@Param("search") String search,
                               @Param("status") String status,
                               Pageable pageable);


    @Query("SELECT COUNT(r) FROM Room r WHERE " +
           "(:search IS NULL OR :search = '' OR r.roomNumber LIKE %:search%) AND " +
           "(:status IS NULL OR :status = '' OR r.status = :status)")
    long countWithFilter(@Param("search") String search, @Param("status") String status);
}
