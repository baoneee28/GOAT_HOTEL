package com.hotel.controller.api;

import com.hotel.entity.Room;
import com.hotel.entity.User;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.service.AuthService;
import com.hotel.service.RoomStatusService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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

    @Autowired
    private AuthService authService;

    @Autowired
    private com.hotel.repository.RoomTypeRepository roomTypeRepository;

    @GetMapping
    public List<Room> getAllRooms(
            @RequestParam(value = "checkIn", required = false) String checkIn,
            @RequestParam(value = "checkOut", required = false) String checkOut,
            @RequestParam(value = "excludeBookingId", required = false) Integer excludeBookingId) {
        if (hasDateRange(checkIn, checkOut)) {
            try {
                LocalDateTime start = parseDateTimeParam(checkIn);
                LocalDateTime end = parseDateTimeParam(checkOut);
                List<Room> availableRooms = roomRepository.findAvailableRoomsForDate(
                        start,
                        end,
                        LocalDateTime.now(),
                        excludeBookingId
                );
                return sanitizePublicRooms(availableRooms);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return sanitizePublicRooms(roomRepository.findAll());
    }

    @GetMapping("/{id}")
    public Room getRoomById(@PathVariable("id") Integer id) {
        Room room = roomRepository.findById(id).orElse(null);
        return sanitizePublicRoom(room);
    }

    @GetMapping("/type/{typeId}")
    public List<Room> getRoomsByType(
            @PathVariable("typeId") Integer typeId,
            @RequestParam(value = "status", defaultValue = "available") String status,
            @RequestParam(value = "checkIn", required = false) String checkIn,
            @RequestParam(value = "checkOut", required = false) String checkOut) {
        if ("all".equalsIgnoreCase(status)) {
            return roomRepository.findByRoomTypeIdOrderByRoomNumberAsc(typeId);
        }

        if (hasDateRange(checkIn, checkOut)) {
            try {
                LocalDateTime start = parseDateTimeParam(checkIn);
                LocalDateTime end = parseDateTimeParam(checkOut);
                List<Room> availableRooms = roomRepository.findAvailableRoomsByDate(
                        typeId,
                        start,
                        end,
                        LocalDateTime.now()
                );
                return sanitizePublicRooms(availableRooms);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return sanitizePublicRooms(roomRepository.findByRoomTypeIdAndStatusOrderByRoomNumberAsc(typeId, status));
    }

    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> listRoomsForAdmin(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(value = "availableFrom", required = false) String availableFrom,
            @RequestParam(value = "availableTo", required = false) String availableTo) {
        try {
            return ResponseEntity.ok(
                    roomStatusService.buildAdminRoomPage(q, status, Math.max(1, page), 5, availableFrom, availableTo)
            );
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        }
    }

    @PostMapping("/admin")
    public ResponseEntity<Map<String, Object>> saveRoom(@RequestBody Map<String, Object> payload, HttpSession session) {
        try {
            User currentUser = getSessionUser(session);
            boolean isAdmin = authService.isAdmin(currentUser);

            Integer roomId = parseNullableInteger(payload.get("id"), "Ma phong");
            Integer typeId = parseRequiredInteger(payload.get("typeId"), "Loai phong");
            String status = normalizeRoomStatus(payload.get("status"));
            String roomNumber = normalizeRoomNumber(payload.get("roomNumber"));

            if (!isAdmin && (roomId == null || roomId <= 0)) {
                return forbidden("Nhan vien chi duoc cap nhat trang thai van hanh cua phong hien co.");
            }
            if (roomNumber.isBlank()) {
                return badRequest("So phong khong duoc de trong.");
            }
            if (roomNumber.length() > 10) {
                return badRequest("So phong toi da 10 ky tu.");
            }

            com.hotel.entity.RoomType roomType = roomTypeRepository.findById(typeId).orElse(null);
            if (roomType == null) {
                return badRequest("Loai phong khong ton tai.");
            }

            Room room;
            if (roomId != null && roomId > 0) {
                room = roomRepository.findById(roomId).orElse(null);
                if (room == null) {
                    return badRequest("Phong khong ton tai.");
                }
            } else {
                room = new Room();
            }

            if (!isAdmin) {
                room.setStatus(status);
                room = roomRepository.save(room);
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Da cap nhat trang thai van hanh cua phong.");
                response.put("room", room);
                return ResponseEntity.ok(response);
            }

            Optional<Room> roomNumberOwner = roomRepository.findByRoomNumber(roomNumber);
            if (roomNumberOwner.isPresent() && (room.getId() == null || !roomNumberOwner.get().getId().equals(room.getId()))) {
                return badRequest("So phong nay da ton tai.");
            }

            room.setRoomNumber(roomNumber);
            room.setRoomType(roomType);
            room.setStatus(status);
            room = roomRepository.save(room);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", room.getId() != null && roomId != null ? "Da cap nhat thong tin phong." : "Da them phong moi.");
            response.put("room", room);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return badRequest(ex.getMessage());
        } catch (Exception ex) {
            return badRequest("Khong the luu thong tin phong luc nay.");
        }
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Map<String, Object>> deleteRoom(@PathVariable("id") Integer id, HttpSession session) {
        User currentUser = getSessionUser(session);
        if (!authService.isAdmin(currentUser)) {
            return forbidden("Nhan vien khong duoc xoa phong.");
        }

        Map<String, Object> response = new HashMap<>();
        Room room = roomRepository.findById(id).orElse(null);
        if (room == null) {
            response.put("success", false);
            response.put("message", "Phong khong ton tai.");
            return ResponseEntity.status(404).body(response);
        }

        if (bookingDetailRepository.existsByRoom_Id(id)) {
            response.put("success", false);
            response.put("message", "Phong nay da phat sinh booking nen khong the xoa.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            roomRepository.delete(room);
            roomRepository.flush();
            response.put("success", true);
            response.put("message", "Da xoa phong thanh cong.");
        } catch (DataIntegrityViolationException e) {
            response.put("success", false);
            response.put("message", "Phong dang duoc tham chieu boi du lieu khac nen khong the xoa.");
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    private User getSessionUser(HttpSession session) {
        Object userObj = session == null ? null : session.getAttribute("user");
        return userObj instanceof User ? (User) userObj : null;
    }

    private ResponseEntity<Map<String, Object>> badRequest(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return ResponseEntity.badRequest().body(response);
    }

    private ResponseEntity<Map<String, Object>> forbidden(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return ResponseEntity.status(403).body(response);
    }

    private Integer parseRequiredInteger(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException(label + " khong duoc de trong.");
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(label + " khong hop le.");
        }
    }

    private Integer parseNullableInteger(Object value, String label) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(label + " khong hop le.");
        }
    }

    private String normalizeRoomStatus(Object value) {
        String normalized = value == null ? "" : value.toString().trim().toLowerCase();
        if (!ALLOWED_ROOM_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Trang thai phong khong hop le.");
        }
        return normalized;
    }

    private LocalDateTime parseDateTimeParam(String value) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String normalized = value == null ? "" : value.trim();
        if (normalized.contains("T")) {
            normalized = normalized.replace("T", " ");
        }
        if (normalized.length() == 10) {
            normalized += " 12:00";
        }
        return LocalDateTime.parse(normalized, formatter);
    }

    private boolean hasDateRange(String checkIn, String checkOut) {
        return checkIn != null && !checkIn.isBlank() && checkOut != null && !checkOut.isBlank();
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
