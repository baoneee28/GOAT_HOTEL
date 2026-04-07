package com.hotel.controller.api;

import com.hotel.entity.Item;
import com.hotel.repository.ItemRepository;
import com.hotel.repository.RoomTypeItemRepository;
import com.hotel.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/items")

public class ItemApiController {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private RoomTypeItemRepository roomTypeItemRepository;

    @Autowired
    private FileUploadService fileUploadService;

    @GetMapping("/all")
    public java.util.List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listItems(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "1") int page) {
        
        int pageSize = 10;
        int safePage = Math.max(1, page);
        Page<Item> itemPage = itemRepository.findWithSearch(
                q.isBlank() ? null : q,
                PageRequest.of(safePage - 1, pageSize, Sort.by("id").descending()));

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("items", itemPage.getContent());
        response.put("totalPages", itemPage.getTotalPages());
        response.put("currentPage", safePage);
        response.put("search", q);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> saveItem(@RequestBody Item payload) {
        Item item;
        if (payload.getId() != null && payload.getId() > 0) {
            item = itemRepository.findById(payload.getId()).orElse(new Item());
        } else {
            item = new Item();
        }
        item.setName(payload.getName());
        item.setImage(payload.getImage());
        itemRepository.save(item);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lưu tiện ích thành công");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteItem(@PathVariable("id") Integer id) {
        Map<String, Object> response = new HashMap<>();
        Item item = itemRepository.findById(id).orElse(null);
        if (item == null) {
            response.put("success", false);
            response.put("message", "Tiện ích không tồn tại.");
            return ResponseEntity.status(404).body(response);
        }

        String image = item.getImage();
        boolean shouldDeleteImage = image != null && !image.isBlank() && itemRepository.countByImage(image) <= 1;

        try {
            roomTypeItemRepository.deleteByItemId(id);
            itemRepository.delete(item);
            itemRepository.flush();

            if (shouldDeleteImage) {
                fileUploadService.deleteUploadedFile(image);
            }

            response.put("success", true);
            response.put("message", "Đã xóa tiện ích và dọn dữ liệu liên quan.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Không thể xóa tiện ích do vẫn còn ràng buộc dữ liệu.");
            return ResponseEntity.badRequest().body(response);
        }
    }
}
