package com.hotel.repository;
import com.hotel.entity.RoomTypeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomTypeItemRepository extends JpaRepository<RoomTypeItem, Integer> {
    void deleteByRoomTypeId(Integer roomTypeId);

    @Query("SELECT rti.roomType.id, COUNT(rti) FROM RoomTypeItem rti " +
           "WHERE rti.roomType.id IN :roomTypeIds GROUP BY rti.roomType.id")
    List<Object[]> countItemsByRoomTypeIds(@Param("roomTypeIds") List<Integer> roomTypeIds);
}
