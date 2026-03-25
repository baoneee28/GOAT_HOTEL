package com.hotel.repository;
import com.hotel.entity.RoomTypeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomTypeItemRepository extends JpaRepository<RoomTypeItem, Integer> {
    void deleteByRoomTypeId(Integer roomTypeId);
}
