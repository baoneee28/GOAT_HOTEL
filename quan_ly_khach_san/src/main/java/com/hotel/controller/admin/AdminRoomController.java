package com.hotel.controller.admin;

import com.hotel.entity.Item;
import com.hotel.entity.Room;
import com.hotel.entity.RoomItem;
import com.hotel.entity.RoomType;
import com.hotel.repository.ItemRepository;
import com.hotel.repository.RoomItemRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.RoomTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;


import java.util.List;




// Controller quản lý danh sách Phòng trong trang Admin
@Controller
@RequestMapping("/admin/rooms")
@SuppressWarnings("null")
public class AdminRoomController {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private RoomItemRepository roomItemRepository;

    @Autowired
    private ItemRepository itemRepository;

    private static final int PAGE_SIZE = 5;

    @GetMapping
    public String listRooms(@RequestParam(defaultValue = "") String q,
                            @RequestParam(defaultValue = "") String status,
                            @RequestParam(defaultValue = "1") int page,
                            Model model) {
        Page<Room> roomPage = roomRepository.findWithFilter(
                q.isBlank() ? null : q,
                status.isBlank() ? null : status,
                PageRequest.of(page - 1, PAGE_SIZE, Sort.by("id").descending()));


        List<RoomType> types = roomTypeRepository.findAll();
        List<Item> allItems = itemRepository.findAll();



        model.addAttribute("rooms", roomPage.getContent());
        model.addAttribute("totalPages", roomPage.getTotalPages());
        model.addAttribute("totalRows", roomPage.getTotalElements());
        model.addAttribute("currentPage", page);
        model.addAttribute("search", q);
        model.addAttribute("statusFilter", status);
        model.addAttribute("types", types);
        model.addAttribute("all_items", allItems);

        return "admin/rooms";
    }

    
    // Hàm Xử lý thêm mới HOẶC cập nhật Phòng
    // Tham số `items_ids` chính là danh sách ID của các Thiết bị trong phòng (TV, Điều hòa...) được gửi lên từ UI dạng chuỗi "1,3,5"
    @PostMapping(params = "action=save")
    public String saveRoom(@RequestParam(required = false) Integer room_id,
                           @RequestParam Integer type_id,
                           @RequestParam String status,
                           @RequestParam(defaultValue = "") String items_ids,
                           Model model) {
        RoomType roomType = roomTypeRepository.findById(type_id).orElse(null);
        if (roomType == null) return "redirect:/admin/rooms";

        Room room;
        if (room_id != null && room_id > 0) {
            // Nếu có room_id gửi lên -> Đây là form Edit (Sửa)
            room = roomRepository.findById(room_id).orElse(null);
            if (room == null) return "redirect:/admin/rooms";
        } else {
            // Không có room_id -> Đây là lệnh Add (Thêm mới)
            room = new Room();

            // Logic tự động đẻ ra Số phòng mới: Tự tìm ID lớn nhất trong DB, tạo số phòng kiểu "P008" thay vì bắt người đăng tự nhập
            Integer maxId = roomRepository.findMaxId();
            int nextId = (maxId != null ? maxId : 0) + 1;
            String roomNumber = "P" + String.format("%03d", nextId);
            room.setRoomNumber(roomNumber);
        }

        // Cập nhật hoặc lưu mới dữ liệu vào bảng rooms
        room.setRoomType(roomType);
        room.setStatus(status);
        room = roomRepository.save(room);

        // --- XỬ LÝ TIỆN ÍCH TRONG PHÒNG CỦA MỐI QUAN HỆ NHIỀU-NHIỀU ---
        // Xoá sạch tiện ích cũ của phòng này trong DB
        roomItemRepository.deleteByRoomId(room.getId());
        
        // Cắt chuỗi "1,3,5" thành mảng và lưu lại từng dòng tiện ích mới
        if (!items_ids.isBlank()) {
            String[] idArr = items_ids.split(",");
            for (String idStr : idArr) {
                try {
                    int itemId = Integer.parseInt(idStr.trim());
                    RoomItem ri = new RoomItem();
                    ri.setRoomId(room.getId());
                    ri.setItemId(itemId);
                    roomItemRepository.save(ri);
                } catch (NumberFormatException ignored) {}
            }
        }

        return "redirect:/admin/rooms";
    }

    @PostMapping(params = "action=delete")
    public String deleteRoom(@RequestParam Integer id) {
        roomRepository.deleteById(id);
        return "redirect:/admin/rooms";
    }

    
    @GetMapping("/items/{roomId}")
    @ResponseBody
    public List<Integer> getRoomItems(@PathVariable Integer roomId) {
        return roomItemRepository.findItemIdsByRoomId(roomId);
    }
}
