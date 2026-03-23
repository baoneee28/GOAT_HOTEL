package com.hotel.repository;

import com.hotel.entity.RoomItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface RoomItemRepository extends JpaRepository<RoomItem, RoomItem.RoomItemId> {


    List<RoomItem> findByRoomId(Integer roomId);


    long countByRoomId(Integer roomId);


    @Modifying
    @Transactional
    @Query("DELETE FROM RoomItem ri WHERE ri.roomId = :roomId")
    void deleteByRoomId(@Param("roomId") Integer roomId);


    @Query("SELECT ri.itemId FROM RoomItem ri WHERE ri.roomId = :roomId")
    List<Integer> findItemIdsByRoomId(@Param("roomId") Integer roomId);
}
