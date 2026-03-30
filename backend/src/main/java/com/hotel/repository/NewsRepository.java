package com.hotel.repository;

import com.hotel.entity.News;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NewsRepository extends JpaRepository<News, Integer> {

    java.util.Optional<News> findBySlug(String slug);

    List<News> findTop4ByOrderByIdDesc();

    default List<News> findAllLatestFirst() {
        return findAll(Sort.by(Sort.Direction.DESC, "createdAt", "id"));
    }


    @Query("SELECT n FROM News n WHERE n.id != :id ORDER BY n.id DESC")
    List<News> findOtherNews(@Param("id") Integer id, Pageable pageable);


    @Query("SELECT n FROM News n WHERE :search IS NULL OR :search = '' OR n.title LIKE %:search%")
    Page<News> findWithSearch(@Param("search") String search, Pageable pageable);
}
