package com.hotel.repository;

import com.hotel.entity.FeaturedRoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeaturedRoomTypeRepository extends JpaRepository<FeaturedRoomType, Integer> {
    List<FeaturedRoomType> findAllByOrderByDisplayOrderAsc();
    List<FeaturedRoomType> findAllByRoomType_Id(Integer roomTypeId);
}
