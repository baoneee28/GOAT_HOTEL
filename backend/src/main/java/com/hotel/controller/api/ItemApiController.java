package com.hotel.controller.api;

import com.hotel.entity.Item;
import com.hotel.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/items")

public class ItemApiController {

    @Autowired
    private ItemRepository itemRepository;

    @GetMapping("/all")
    public java.util.List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listItems(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "1") int page) {
        
        int pageSize = 10;
        Page<Item> itemPage = itemRepository.findWithSearch(
                q.isBlank() ? null : q,
                PageRequest.of(page - 1, pageSize, Sort.by("id").descending()));

        Map<String, Object> response = new HashMap<>();
        response.put("items", itemPage.getContent());
        response.put("totalPages", itemPage.getTotalPages());
        response.put("currentPage", page);
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
    public ResponseEntity<Map<String, Object>> deleteItem(@PathVariable("id") Integer id) {
        Map<String, Object> response = new HashMap<>();
        try {
            itemRepository.deleteById(id);
            response.put("success", true);
            response.put("message", "Xóa thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Không thể xóa tiện ích do ràng buộc khóa ngoại đang dính ở các Phòng");
            return ResponseEntity.badRequest().body(response);
        }
    }
}
