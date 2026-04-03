package com.hotel.controller.api;

import com.hotel.entity.Room;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.service.RoomStatusService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/rooms")

public class RoomApiController {

    private static final Set<String> ALLOWED_ROOM_STATUSES = Set.of("available", "booked", "maintenance");

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomStatusService roomStatusService;

    @Autowired
    private BookingDetailRepository bookingDetailRepository;

    // Trả về tất cả các phòng
    @GetMapping
    public List<Room> getAllRooms(
            @RequestParam(value = "checkIn", required = false) String checkIn,
            @RequestParam(value = "checkOut", required = false) String checkOut,
            @RequestParam(value = "excludeBookingId", required = false) Integer excludeBookingId) {
        if (checkIn != null && !checkIn.isBlank() && checkOut != null && !checkOut.isBlank()) {
            try {
                java.time.LocalDateTime start = parseDateTimeParam(checkIn);
                java.time.LocalDateTime end = parseDateTimeParam(checkOut);
                List<Room> availableRooms = roomRepository.findAvailableRoomsForDate(
                        start,
                        end,
                        java.time.LocalDateTime.now(),
                        excludeBookingId
                );
                return sanitizePublicRooms(availableRooms);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return sanitizePublicRooms(roomRepository.findAll());
    }

    // Lấy chi tiết 1 phòng theo ID
    @GetMapping("/{id}")
    public Room getRoomById(@PathVariable("id") Integer id) {
        Room room = roomRepository.findById(id).orElse(null);
        return sanitizePublicRoom(room);
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

                List<Room> availableRooms = roomRepository.findAvailableRoomsByDate(
                        typeId,
                        start,
                        end,
                        java.time.LocalDateTime.now()
                );
                return sanitizePublicRooms(availableRooms);
            } catch (Exception e) {
                // Ignore parse error, fallback to normal status check
                e.printStackTrace();
            }
        }

        return sanitizePublicRooms(roomRepository.findByRoomTypeIdAndStatusOrderByRoomNumberAsc(typeId, status));
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
        return org.springframework.http.ResponseEntity.ok(
                roomStatusService.buildAdminRoomPage(q, status, Math.max(1, page), 5)
        );
    }

    @PostMapping("/admin")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> saveRoom(@RequestBody java.util.Map<String, Object> payload) {
        try {
            Integer roomId = parseNullableInteger(payload.get("id"), "Mã phòng");
            Integer typeId = parseRequiredInteger(payload.get("typeId"), "Loại phòng");
            String status = normalizeRoomStatus(payload.get("status"));
            String roomNumber = normalizeRoomNumber(payload.get("roomNumber"));

            if (roomNumber.isBlank()) {
                return badRequest("Số phòng không được để trống.");
            }
            if (roomNumber.length() > 10) {
                return badRequest("Số phòng tối đa 10 ký tự.");
            }

            com.hotel.entity.RoomType roomType = roomTypeRepository.findById(typeId).orElse(null);
            if (roomType == null) {
                return badRequest("Loại phòng không tồn tại.");
            }

            Room room;
            if (roomId != null && roomId > 0) {
                room = roomRepository.findById(roomId).orElse(null);
                if (room == null) {
                    return badRequest("Phòng không tồn tại.");
                }
            } else {
                room = new Room();
            }

            Optional<Room> roomNumberOwner = roomRepository.findByRoomNumber(roomNumber);
            if (roomNumberOwner.isPresent() && (room.getId() == null || !roomNumberOwner.get().getId().equals(room.getId()))) {
                return badRequest("Số phòng này đã tồn tại.");
            }

            room.setRoomNumber(roomNumber);
            room.setRoomType(roomType);
            room.setStatus(status);
            room = roomRepository.save(room);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", room.getId() != null && roomId != null ? "Đã cập nhật thông tin phòng." : "Đã thêm phòng mới.");
            response.put("room", room);
            return org.springframework.http.ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        } catch (Exception ex) {
            return badRequest("Không thể lưu thông tin phòng lúc này.");
        }
    }

    @DeleteMapping("/admin/{id}")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> deleteRoom(@PathVariable("id") Integer id) {
        Map<String, Object> response = new HashMap<>();
        Room room = roomRepository.findById(id).orElse(null);
        if (room == null) {
            response.put("success", false);
            response.put("message", "Phòng không tồn tại.");
            return org.springframework.http.ResponseEntity.status(404).body(response);
        }

        if (bookingDetailRepository.existsByRoom_Id(id)) {
            response.put("success", false);
            response.put("message", "Phòng này đã phát sinh booking nên không thể xóa.");
            return org.springframework.http.ResponseEntity.badRequest().body(response);
        }

        try {
            roomRepository.delete(room);
            roomRepository.flush();
            response.put("success", true);
            response.put("message", "Đã xóa phòng thành công.");
        } catch (DataIntegrityViolationException e) {
            response.put("success", false);
            response.put("message", "Phòng đang được tham chiếu bởi dữ liệu khác nên không thể xóa.");
            return org.springframework.http.ResponseEntity.badRequest().body(response);
        }
        return org.springframework.http.ResponseEntity.ok(response);
    }

    private org.springframework.http.ResponseEntity<Map<String, Object>> badRequest(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return org.springframework.http.ResponseEntity.badRequest().body(response);
    }

    private Integer parseRequiredInteger(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException(label + " không được để trống.");
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(label + " không hợp lệ.");
        }
    }

    private Integer parseNullableInteger(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(label + " không hợp lệ.");
        }
    }

    private String normalizeRoomStatus(Object value) {
        String normalized = value == null ? "" : value.toString().trim().toLowerCase();
        if (!ALLOWED_ROOM_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Trạng thái phòng không hợp lệ.");
        }
        return normalized;
    }

    private java.time.LocalDateTime parseDateTimeParam(String value) {
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String normalized = value == null ? "" : value.trim();
        if (normalized.contains("T")) {
            normalized = normalized.replace("T", " ");
        }
        if (normalized.length() == 10) {
            normalized += " 12:00";
        }
        return java.time.LocalDateTime.parse(normalized, formatter);
    }

    private List<Room> sanitizePublicRooms(List<Room> rooms) {
        if (rooms == null) {
            return List.of();
        }
        rooms.forEach(this::sanitizePublicRoom);
        return rooms;
    }

    private Room sanitizePublicRoom(Room room) {
        if (room == null) {
            return null;
        }
        room.setEffectiveStatus(null);
        return room;
    }

    private String normalizeRoomNumber(Object value) {
        return value == null ? "" : value.toString().trim().toUpperCase();
    }
}
