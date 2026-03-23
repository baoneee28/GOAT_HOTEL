package com.hotel.controller.api;

import com.hotel.entity.RoomType;
import com.hotel.repository.RoomTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/room-types")
@CrossOrigin(origins = "*")
public class RoomTypeApiController {

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @GetMapping
    public List<RoomType> getAllRoomTypes() {
        return roomTypeRepository.findAll();
    }

    @GetMapping("/{id}")
    public RoomType getRoomTypeById(@PathVariable Integer id) {
        return roomTypeRepository.findById(id).orElse(null);
    }

    // ==========================================
    // API CỦA ADMIN (CRUD BẢNG LOẠI PHÒNG)
    // ==========================================
    @GetMapping("/admin")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> listRoomTypesForAdmin(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "1") int page) {
        int pageSize = 5;
        org.springframework.data.domain.Page<RoomType> typePage = roomTypeRepository.findWithSearch(
                q.isBlank() ? null : q,
                org.springframework.data.domain.PageRequest.of(page - 1, pageSize, org.springframework.data.domain.Sort.by("id").descending())
        );
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("roomTypes", typePage.getContent());
        response.put("totalPages", typePage.getTotalPages());
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @PostMapping("/admin")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> saveRoomType(@RequestBody RoomType payload) {
        RoomType roomType;
        if (payload.getId() != null && payload.getId() > 0) {
            roomType = roomTypeRepository.findById(payload.getId()).orElse(new RoomType());
        } else {
            roomType = new RoomType();
        }
        roomType.setTypeName(payload.getTypeName());
        roomType.setPricePerNight(payload.getPricePerNight());
        roomType.setCapacity(payload.getCapacity());
        roomType.setDescription(payload.getDescription());
        roomType.setImage(payload.getImage());

        roomTypeRepository.save(roomType);
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @DeleteMapping("/admin/{id}")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> deleteRoomType(@PathVariable Integer id) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        try {
            roomTypeRepository.deleteById(id);
            response.put("success", true);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Loại phòng này đang có người đặt hoặc đang có phòng gắn kết, không thể xóa");
        }
        return org.springframework.http.ResponseEntity.ok(response);
    }
}
