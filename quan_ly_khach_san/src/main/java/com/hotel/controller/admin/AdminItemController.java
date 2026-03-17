package com.hotel.controller.admin;

import com.hotel.entity.Item;
import com.hotel.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;


// Controller quản lý danh mục Tiện ích (Bồn tắm, TV, Tủ lạnh...)
@Controller
@RequestMapping("/admin/items")
@SuppressWarnings("null")
public class AdminItemController {

    @Autowired
    private ItemRepository itemRepository;

    private static final int PAGE_SIZE = 10;

    // Hiển thị danh sách tiện ích (có phân trang và tìm kiếm theo tên)
    @GetMapping
    public String listItems(@RequestParam(defaultValue = "") String q,
                            @RequestParam(defaultValue = "1") int page,
                            Model model) {
        Page<Item> itemPage = itemRepository.findWithSearch(
                q.isBlank() ? null : q,
                PageRequest.of(page - 1, PAGE_SIZE, Sort.by("id").descending()));

        model.addAttribute("items", itemPage.getContent());
        model.addAttribute("total_pages", itemPage.getTotalPages());
        model.addAttribute("page", page);
        model.addAttribute("search", q);

        return "admin/items";
    }

    // Xử lý Thêm mới hoặc Cập nhật tiện ích
    // Chạy khi nhấn nút Lưu trên form Modal
    @PostMapping(params = "action=save")
    public String saveItem(@RequestParam(required = false) Integer item_id,
                           @RequestParam String name,
                           @RequestParam String image) {
        Item item;
        if (item_id != null && item_id > 0) {
            item = itemRepository.findById(item_id).orElse(new Item());
        } else {
            item = new Item();
        }
        item.setName(name);
        item.setImage(image);
        itemRepository.save(item);
        return "redirect:/admin/items";
    }

    // Xóa Tiện ích
    @PostMapping(params = "action=delete")
    public String deleteItem(@RequestParam Integer id) {
        try {
            // Bao bọc bằng try catch để lỡ thiết bị này đang được gắn trong 1 phòng nào đó (có khóa ngoại) thì khi xóa bị văng lỗi sẽ không làm sập server
            itemRepository.deleteById(id);
        } catch (Exception ignored) {}
        return "redirect:/admin/items";
    }
}
