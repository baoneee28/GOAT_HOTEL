package com.hotel.repository;

import com.hotel.entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {


    @Query("SELECT i FROM Item i WHERE :search IS NULL OR :search = '' OR i.name LIKE %:search%")
    Page<Item> findWithSearch(@Param("search") String search, Pageable pageable);

    long countByImage(String image);
}
