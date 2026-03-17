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


    List<Room> findByStatus(String status);





    @Query("SELECT r.status, COUNT(r) FROM Room r GROUP BY r.status")
    List<Object[]> countByStatusGroup();


    @Query("SELECT MAX(r.id) FROM Room r")
    Integer findMaxId();


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
