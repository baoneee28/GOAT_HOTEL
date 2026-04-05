package com.hotel.repository;

import com.hotel.entity.CouponEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponEventTypeRepository extends JpaRepository<CouponEventType, Integer> {
    Optional<CouponEventType> findByEventKeyIgnoreCase(String eventKey);
    List<CouponEventType> findAllByOrderBySortOrderAscIdAsc();
}
