package com.hotel.service;

import com.hotel.entity.Room;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.RoomTypeItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class RoomStatusService {

    private static final DateTimeFormatter RESERVATION_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter HOLD_UNTIL_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM");
    private static final LocalTime FILTER_START_TIME = LocalTime.of(0, 0);
    private static final LocalTime FILTER_END_TIME = LocalTime.of(23, 59);

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingDetailRepository bookingDetailRepository;

    @Autowired
    private RoomTypeItemRepository roomTypeItemRepository;

    public String resolveEffectiveStatus(Room room, Set<Integer> occupiedRoomIds, Set<Integer> reservedRoomIds) {
        if (room == null) {
            return "available";
        }

        String persistedStatus = room.getStatus() == null ? "available" : room.getStatus().trim().toLowerCase();
        if ("maintenance".equals(persistedStatus)) {
            return "maintenance";
        }
        if (room.getId() != null && occupiedRoomIds.contains(room.getId())) {
            return "booked";
        }
        if ("booked".equals(persistedStatus)) {
            return "booked";
        }
        if (room.getId() != null && reservedRoomIds.contains(room.getId())) {
            return "reserved";
        }
        return "available";
    }

    public void applyEffectiveStatuses(List<Room> rooms) {
        LocalDateTime now = LocalDateTime.now();
        Set<Integer> occupiedRoomIds = new HashSet<>(bookingDetailRepository.findOccupiedRoomIdsAt(now));
        Map<Integer, com.hotel.entity.BookingDetail> reservedBookingDetails = findReservedBookingDetails(rooms, now);
        Set<Integer> reservedRoomIds = new HashSet<>(reservedBookingDetails.keySet());
        for (Room room : rooms) {
            room.setRelatedBookingId(null);
            room.setEffectiveStatusReason(null);
            room.setEffectiveStatus(resolveEffectiveStatus(room, occupiedRoomIds, reservedRoomIds));
            if (room.getId() != null && "reserved".equalsIgnoreCase(room.getEffectiveStatus())) {
                com.hotel.entity.BookingDetail reservedDetail = reservedBookingDetails.get(room.getId());
                if (reservedDetail != null && reservedDetail.getBooking() != null) {
                    room.setRelatedBookingId(reservedDetail.getBooking().getId());
                    room.setEffectiveStatusReason(buildReservedStatusReason(reservedDetail, now));
                }
            }
        }
    }

    public Map<String, Long> countEffectiveStatuses() {
        List<Room> rooms = roomRepository.findAll();
        applyEffectiveStatuses(rooms);

        long available = 0;
        long booked = 0;
        long reserved = 0;
        long maintenance = 0;

        for (Room room : rooms) {
            String effectiveStatus = room.getEffectiveStatus();
            if ("booked".equalsIgnoreCase(effectiveStatus)) {
                booked++;
            } else if ("reserved".equalsIgnoreCase(effectiveStatus)) {
                reserved++;
            } else if ("maintenance".equalsIgnoreCase(effectiveStatus)) {
                maintenance++;
            } else {
                available++;
            }
        }

        Map<String, Long> counts = new HashMap<>();
        counts.put("available", available);
        counts.put("booked", booked);
        counts.put("reserved", reserved);
        counts.put("maintenance", maintenance);
        return counts;
    }

    public Map<String, Object> buildAdminRoomPage(String search, String status, int page, int pageSize) {
        return buildAdminRoomPage(search, status, page, pageSize, null, null);
    }

    public Map<String, Object> buildAdminRoomPage(String search,
                                                  String status,
                                                  int page,
                                                  int pageSize,
                                                  String availableFrom,
                                                  String availableTo) {
        List<Room> rooms = (search == null || search.isBlank())
                ? roomRepository.findAllByOrderByIdDesc()
                : roomRepository.findByRoomNumberContainingOrderByIdDesc(search.trim());

        applyEffectiveStatuses(rooms);
        applyRoomTypeItemCounts(rooms);

        String normalizedStatus = status == null ? "" : status.trim().toLowerCase();
        Set<Integer> availableRoomIds = resolveAvailableRoomIdsForWindow(availableFrom, availableTo);
        List<Room> filteredRooms = rooms.stream()
                .filter(room -> normalizedStatus.isBlank()
                        || normalizedStatus.equalsIgnoreCase(room.getEffectiveStatus()))
                .filter(room -> availableRoomIds == null
                        || (room.getId() != null && availableRoomIds.contains(room.getId())))
                .toList();

        int safePageSize = Math.max(1, pageSize);
        int totalPages = Math.max(1, (int) Math.ceil((double) filteredRooms.size() / safePageSize));
        int safePage = Math.min(Math.max(1, page), totalPages);
        int fromIndex = Math.min((safePage - 1) * safePageSize, filteredRooms.size());
        int toIndex = Math.min(fromIndex + safePageSize, filteredRooms.size());

        Map<String, Object> response = new HashMap<>();
        response.put("rooms", filteredRooms.subList(fromIndex, toIndex));
        response.put("totalPages", totalPages);
        response.put("currentPage", safePage);
        return response;
    }

    private Set<Integer> resolveAvailableRoomIdsForWindow(String availableFrom, String availableTo) {
        if (availableFrom == null || availableFrom.isBlank() || availableTo == null || availableTo.isBlank()) {
            return null;
        }

        LocalDateTime start = parseDateTimeParam(availableFrom, FILTER_START_TIME);
        LocalDateTime end = parseDateTimeParam(availableTo, FILTER_END_TIME);
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("Khoang thoi gian tim phong trong khong hop le.");
        }

        Set<Integer> availableRoomIds = new HashSet<>();
        for (Room room : roomRepository.findAvailableRoomsForDate(start, end, LocalDateTime.now(), null)) {
            if (room != null && room.getId() != null) {
                availableRoomIds.add(room.getId());
            }
        }
        return availableRoomIds;
    }

    private LocalDateTime parseDateTimeParam(String value, LocalTime defaultTime) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Khoang thoi gian tim phong trong khong hop le.");
        }

        try {
            if (normalized.length() == 10) {
                return LocalDate.parse(normalized).atTime(defaultTime);
            }
            if (normalized.contains(" ")) {
                normalized = normalized.replace(" ", "T");
            }
            return LocalDateTime.parse(normalized);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Khoang thoi gian tim phong trong khong hop le.");
        }
    }

    private void applyRoomTypeItemCounts(List<Room> rooms) {
        List<Integer> roomTypeIds = new ArrayList<>();
        for (Room room : rooms) {
            if (room == null || room.getRoomType() == null || room.getRoomType().getId() == null) {
                continue;
            }
            Integer roomTypeId = room.getRoomType().getId();
            if (!roomTypeIds.contains(roomTypeId)) {
                roomTypeIds.add(roomTypeId);
            }
        }

        if (roomTypeIds.isEmpty()) {
            return;
        }

        Map<Integer, Integer> itemCountMap = new HashMap<>();
        for (Object[] row : roomTypeItemRepository.countItemsByRoomTypeIds(roomTypeIds)) {
            itemCountMap.put((Integer) row[0], ((Long) row[1]).intValue());
        }

        for (Room room : rooms) {
            if (room == null || room.getRoomType() == null || room.getRoomType().getId() == null) {
                continue;
            }
            room.getRoomType().setItemCount(itemCountMap.getOrDefault(room.getRoomType().getId(), 0));
        }
    }

    private Map<Integer, com.hotel.entity.BookingDetail> findReservedBookingDetails(List<Room> rooms, LocalDateTime now) {
        List<Integer> roomIds = new ArrayList<>();
        for (Room room : rooms) {
            if (room != null && room.getId() != null && !roomIds.contains(room.getId())) {
                roomIds.add(room.getId());
            }
        }

        if (roomIds.isEmpty()) {
            return Map.of();
        }

        Map<Integer, com.hotel.entity.BookingDetail> reservedDetails = new LinkedHashMap<>();
        for (com.hotel.entity.BookingDetail detail : bookingDetailRepository.findReservedBookingDetailsAfter(roomIds, now)) {
            if (detail == null || detail.getRoom() == null || detail.getRoom().getId() == null) {
                continue;
            }
            reservedDetails.putIfAbsent(detail.getRoom().getId(), detail);
        }
        return reservedDetails;
    }

    private String buildReservedStatusReason(com.hotel.entity.BookingDetail detail, LocalDateTime now) {
        if (detail == null || detail.getBooking() == null) {
            return null;
        }

        Integer bookingId = detail.getBooking().getId();
        String prefix = bookingId == null ? "Booking liên quan" : "Booking #" + bookingId;
        String bookingStatus = detail.getBooking().getStatus() == null
                ? ""
                : detail.getBooking().getStatus().trim().toLowerCase();

        if ("pending".equals(bookingStatus) && detail.getBooking().getExpiresAt() != null && detail.getBooking().getExpiresAt().isAfter(now)) {
            return prefix + ", giữ đến " + detail.getBooking().getExpiresAt().format(HOLD_UNTIL_FORMATTER);
        }

        if (detail.getCheckIn() != null && detail.getCheckOut() != null) {
            String dateRange = detail.getCheckIn().format(RESERVATION_DATE_FORMATTER)
                    + " - "
                    + detail.getCheckOut().format(RESERVATION_DATE_FORMATTER);
            if ("confirmed".equals(bookingStatus) && detail.getCheckInActual() == null) {
                return prefix + ", " + dateRange + ", chưa check-in";
            }
            if ("pending".equals(bookingStatus)) {
                return prefix + ", " + dateRange + ", chờ duyệt";
            }
            return prefix + ", " + dateRange;
        }

        if ("confirmed".equals(bookingStatus) && detail.getCheckInActual() == null) {
            return prefix + ", chưa check-in";
        }

        return prefix;
    }
}
