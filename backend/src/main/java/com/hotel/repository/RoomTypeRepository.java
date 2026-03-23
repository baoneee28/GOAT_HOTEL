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
}
