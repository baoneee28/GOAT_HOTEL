package com.hotel.repository;

import com.hotel.entity.FeaturedNews;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeaturedNewsRepository extends JpaRepository<FeaturedNews, Integer> {
    List<FeaturedNews> findAllByOrderByDisplayOrderAsc();
    Optional<FeaturedNews> findByNews_Id(Integer newsId);
}
