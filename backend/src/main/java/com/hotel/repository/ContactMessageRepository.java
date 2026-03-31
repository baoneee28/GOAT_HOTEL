package com.hotel.repository;

import com.hotel.entity.ContactMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Integer> {

    @Query(value = "SELECT c.* FROM contact_messages c WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(c.first_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.last_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(CAST(c.message AS NVARCHAR(MAX))) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR c.status = :status)",
           countQuery = "SELECT COUNT(*) FROM contact_messages c WHERE " +
                   "(:search IS NULL OR :search = '' OR " +
                   "LOWER(c.first_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
                   "LOWER(c.last_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
                   "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
                   "LOWER(CAST(c.message AS NVARCHAR(MAX))) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
                   "(:status IS NULL OR :status = '' OR c.status = :status)",
           nativeQuery = true)
    Page<ContactMessage> findWithFilters(@Param("search") String search,
                                         @Param("status") String status,
                                         Pageable pageable);

    long countByStatus(String status);
}
