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
    // Nếu truyền checkIn và checkOut sẽ tính trùng lịch, Admin/internal gán ?status=all
    @GetMapping("/type/{typeId}")
    public List<Room> getRoomsByType(
            @PathVariable("typeId") Integer typeId,
            @RequestParam(value = "status", defaultValue = "available") String status,
            @RequestParam(value = "checkIn", required = false) String checkIn,
            @RequestParam(value = "checkOut", required = false) String checkOut) {
        
        if ("all".equalsIgnoreCase(status)) {
            return roomRepository.findByRoomTypeIdOrderByRoomNumberAsc(typeId);
        }

        if (checkIn != null && !checkIn.isBlank() && checkOut != null && !checkOut.isBlank()) {
            try {
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
                String startStr = checkIn.contains("T") ? checkIn.replace("T", " ") : checkIn;
                String endStr = checkOut.contains("T") ? checkOut.replace("T", " ") : checkOut;
                if (startStr.length() == 10) startStr += " 12:00";
                if (endStr.length() == 10) endStr += " 12:00";
                
                java.time.LocalDateTime start = java.time.LocalDateTime.parse(startStr, formatter);
                java.time.LocalDateTime end = java.time.LocalDateTime.parse(endStr, formatter);
                
                return roomRepository.findAvailableRoomsByDate(typeId, start, end);
            } catch (Exception e) {
                // Ignore parse error, fallback to normal status check
                e.printStackTrace();
            }
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
        response.put("currentPage", page);
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
        String roomNumber = payload.get("roomNumber") != null ? payload.get("roomNumber").toString().trim() : "";

        if (roomNumber.isBlank()) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "Số phòng không được để trống."
            ));
        }

        com.hotel.entity.RoomType roomType = roomTypeRepository.findById(typeId).orElse(null);
        if (roomType == null) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "Loại phòng không tồn tại."
            ));
        }

        Room room;
        if (roomId != null && roomId > 0) {
            room = roomRepository.findById(roomId).orElse(null);
            if (room == null) {
                return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of(
                        "success", false,
                        "message", "Phòng không tồn tại."
                ));
            }
        } else {
            room = new Room();
        }

        java.util.Optional<Room> roomNumberOwner = roomRepository.findByRoomNumber(roomNumber);
        if (roomNumberOwner.isPresent() && (room.getId() == null || !roomNumberOwner.get().getId().equals(room.getId()))) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "Số phòng này đã tồn tại."
            ));
        }

        room.setRoomNumber(roomNumber);
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
