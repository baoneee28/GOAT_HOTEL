
package com.hotel.controller.api;

import com.hotel.entity.RoomType;
import com.hotel.entity.RoomTypeItem;
import com.hotel.entity.Item;
import com.hotel.repository.RoomTypeRepository;
import com.hotel.repository.RoomTypeItemRepository;
import com.hotel.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/room-types")
@SuppressWarnings("null")
public class RoomTypeApiController {

    @Autowired
    private RoomTypeRepository roomTypeRepository;
    
    @Autowired
    private RoomTypeItemRepository roomTypeItemRepository;
    
    @Autowired
    private ItemRepository itemRepository;

    @GetMapping
    public org.springframework.http.ResponseEntity<?> getAllRoomTypes(
            @RequestParam(value = "checkIn", required = false) String checkIn,
            @RequestParam(value = "checkOut", required = false) String checkOut) {
        
        List<RoomType> types = roomTypeRepository.findAll();
        
        if (checkIn != null && !checkIn.isBlank() && checkOut != null && !checkOut.isBlank()) {
            try {
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
                String startStr = checkIn.contains("T") ? checkIn.replace("T", " ") : checkIn;
                String endStr = checkOut.contains("T") ? checkOut.replace("T", " ") : checkOut;
                if (startStr.length() == 10) startStr += " 12:00";
                if (endStr.length() == 10) endStr += " 12:00";
                
                java.time.LocalDateTime start = java.time.LocalDateTime.parse(startStr, formatter);
                java.time.LocalDateTime end = java.time.LocalDateTime.parse(endStr, formatter);
                
                List<Object[]> counts = roomTypeRepository.countAvailableRoomsByDate(start, end);
                Map<Integer, Long> countMap = counts.stream()
                        .collect(Collectors.toMap(
                                row -> (Integer) row[0],
                                row -> (Long) row[1]
                        ));

                List<Map<String, Object>> result = types.stream().map(type -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", type.getId());
                    map.put("typeName", type.getTypeName());
                    map.put("pricePerNight", type.getPricePerNight());
                    map.put("capacity", type.getCapacity());
                    map.put("image", type.getImage());
                    map.put("description", type.getDescription());
                    map.put("items", type.getItems());
                    map.put("availableCount", countMap.getOrDefault(type.getId(), 0L));
                    return map;
                }).collect(Collectors.toList());
                
                return org.springframework.http.ResponseEntity.ok(result);
                
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        
        return org.springframework.http.ResponseEntity.ok(types);
    }

    @GetMapping("/{id}")
    public RoomType getRoomTypeById(@PathVariable("id") Integer id) {
        return roomTypeRepository.findById(id).orElse(null);
    }

    @GetMapping("/admin")
    public org.springframework.http.ResponseEntity<Map<String, Object>> listRoomTypesForAdmin(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "1") int page) {
        int pageSize = 5;
        org.springframework.data.domain.Page<RoomType> typePage = roomTypeRepository.findWithSearch(
                q.isBlank() ? null : q,
                org.springframework.data.domain.PageRequest.of(page - 1, pageSize, org.springframework.data.domain.Sort.by("id").descending())
        );
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("roomTypes", typePage.getContent());
        response.put("totalPages", typePage.getTotalPages());
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @PostMapping("/admin")
    @Transactional
    public org.springframework.http.ResponseEntity<Map<String, Object>> saveRoomType(@RequestBody Map<String, Object> payload) {
        RoomType roomType;
        Integer id = null;
        if(payload.get("id") != null && !payload.get("id").toString().isBlank()) {
            id = Integer.parseInt(payload.get("id").toString());
        }
        
        if (id != null) {
            roomType = roomTypeRepository.findById(id).orElse(new RoomType());
        } else {
            roomType = new RoomType();
        }
        
        roomType.setTypeName(payload.get("typeName").toString());
        roomType.setPricePerNight(Double.parseDouble(payload.get("pricePerNight").toString()));
        roomType.setCapacity(Integer.parseInt(payload.get("capacity").toString()));
        roomType.setDescription(payload.get("description") != null ? payload.get("description").toString() : "");
        roomType.setImage(payload.get("image") != null ? payload.get("image").toString() : "");

        roomType = roomTypeRepository.save(roomType);
        
        // Handle itemsIds
        if (id != null) {
            roomTypeItemRepository.deleteByRoomTypeId(id);
        }
        
        if (payload.get("itemsIds") != null) {
            String itemsIdsStr = payload.get("itemsIds").toString();
            if(!itemsIdsStr.isBlank()) {
                String[] itemsIdArray = itemsIdsStr.split(",");
                for (String itemIdStr : itemsIdArray) {
                    try {
                        Integer itemId = Integer.parseInt(itemIdStr.trim());
                        Item item = itemRepository.findById(itemId).orElse(null);
                        if(item != null){
                            RoomTypeItem rti = new RoomTypeItem();
                            rti.setRoomType(roomType);
                            rti.setItem(item);
                            roomTypeItemRepository.save(rti);
                        }
                    } catch(Exception ignored) {}
                }
            }
        }
        
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @DeleteMapping("/admin/{id}")
    public org.springframework.http.ResponseEntity<Map<String, Object>> deleteRoomType(@PathVariable("id") Integer id) {
        Map<String, Object> response = new java.util.HashMap<>();
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
