package com.hotel.controller.api;

import com.hotel.entity.Room;
import com.hotel.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")

public class RoomApiController {

    @Autowired
    private RoomRepository roomRepository;

    // Trả về tất cả các phòng
    @GetMapping
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    // Lấy chi tiết 1 phòng theo ID
    @GetMapping("/{id}")
    public Room getRoomById(@PathVariable("id") Integer id) {
        return roomRepository.findById(id).orElse(null);
    }

    // Lấy danh sách phòng lọc theo Loại phòng — mặc định chỉ trả phòng "available"
    // Admin / internal: gọi ?status=all để lấy tất cả
    @GetMapping("/type/{typeId}")
    public List<Room> getRoomsByType(
            @PathVariable("typeId") Integer typeId,
            @RequestParam(defaultValue = "available") String status) {
        if ("all".equalsIgnoreCase(status)) {
            return roomRepository.findByRoomTypeIdOrderByRoomNumberAsc(typeId);
        }
        return roomRepository.findByRoomTypeIdAndStatusOrderByRoomNumberAsc(typeId, status);
    }

    // ==========================================
    // API CỦA ADMIN (CRUD BẢNG PHÒNG VÀ TIỆN ÍCH PHÒNG)
    // ==========================================
    @Autowired
    private com.hotel.repository.RoomTypeRepository roomTypeRepository;

    @GetMapping("/admin")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> listRoomsForAdmin(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "1") int page) {
        int pageSize = 5;
        org.springframework.data.domain.Page<Room> roomPage = roomRepository.findWithFilter(
                q.isBlank() ? null : q,
                status.isBlank() ? null : status,
                org.springframework.data.domain.PageRequest.of(page - 1, pageSize, org.springframework.data.domain.Sort.by("id").descending())
        );

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("rooms", roomPage.getContent());
        response.put("totalPages", roomPage.getTotalPages());
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @PostMapping("/admin")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> saveRoom(@RequestBody java.util.Map<String, Object> payload) {
        Integer roomId = null;
        if (payload.get("id") != null) {
            roomId = Integer.parseInt(payload.get("id").toString());
        }
        Integer typeId = Integer.parseInt(payload.get("typeId").toString());
        String status = payload.get("status").toString();
        String itemsIds = payload.get("itemsIds") != null ? payload.get("itemsIds").toString() : "";

        com.hotel.entity.RoomType roomType = roomTypeRepository.findById(typeId).orElse(null);
        if (roomType == null) {
            return org.springframework.http.ResponseEntity.badRequest().build();
        }

        Room room;
        if (roomId != null && roomId > 0) {
            room = roomRepository.findById(roomId).orElse(null);
            if (room == null) return org.springframework.http.ResponseEntity.badRequest().build();
        } else {
            room = new Room();
            Integer maxId = roomRepository.findMaxId();
            int nextId = (maxId != null ? maxId : 0) + 1;
            room.setRoomNumber("P" + String.format("%03d", nextId));
        }

        room.setRoomType(roomType);
        room.setStatus(status);
        room = roomRepository.save(room);

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @DeleteMapping("/admin/{id}")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> deleteRoom(@PathVariable("id") Integer id) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        try {
            roomRepository.deleteById(id);
            response.put("success", true);
        } catch (Exception e) {
             response.put("success", false);
             response.put("message", "Phòng đang có người đặt, không thể xóa");
        }
        return org.springframework.http.ResponseEntity.ok(response);
    }
}
