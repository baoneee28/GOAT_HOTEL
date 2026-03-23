package com.hotel.controller.admin;

import com.hotel.entity.RoomType;
import com.hotel.repository.RoomTypeRepository;
import com.hotel.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;




// Controller quản lý danh mục Loại Phòng (Phòng Đơn, Phòng Đôi VIP, Phòng Tổng Thống...)
@Controller
@RequestMapping("/admin/room-types")
@SuppressWarnings("null")
public class AdminRoomTypeController {

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private FileUploadService fileUploadService;

    private static final int PAGE_SIZE = 5;

    @GetMapping
    public String listRoomTypes(@RequestParam(defaultValue = "") String q,
                                @RequestParam(defaultValue = "1") int page,
                                Model model) {
        Page<RoomType> typePage = roomTypeRepository.findWithSearch(
                q.isBlank() ? null : q,
                PageRequest.of(page - 1, PAGE_SIZE, Sort.by("id").descending()));

        model.addAttribute("roomTypes", typePage.getContent());
        model.addAttribute("totalPages", typePage.getTotalPages());
        model.addAttribute("currentPage", page);
        model.addAttribute("search", q);

        return "admin/room-types";
    }

    // Form lưu thông tin hạng phòng (Giá cả, sức chứa, mô tả, ảnh thumbnail)
    @PostMapping(params = "action=save")
    public String saveRoomType(@RequestParam(required = false) Integer type_id,
                               @RequestParam String type_name,
                               @RequestParam Double price_per_night,
                               @RequestParam Integer capacity,
                               @RequestParam(defaultValue = "") String description,
                               @RequestParam(required = false) String current_image,
                               @RequestParam(required = false) MultipartFile image,
                               Model model) {
        RoomType roomType;
        if (type_id != null && type_id > 0) {
            roomType = roomTypeRepository.findById(type_id).orElse(new RoomType());
        } else {
            roomType = new RoomType();
        }

        roomType.setTypeName(type_name);
        roomType.setPricePerNight(price_per_night);
        roomType.setCapacity(capacity);
        roomType.setDescription(description);


        // Tương tự xử lý Update ảnh nếu có thư mục mới tải lên
        String imgName = current_image;
        if (image != null && !image.isEmpty()) {
            try {
                // Đẩy ảnh vào mục tĩnh static/uploads
                imgName = fileUploadService.uploadGeneral(image, "");
            } catch (Exception e) {

            }
        }
        roomType.setImage(imgName);

        roomTypeRepository.save(roomType);
        return "redirect:/admin/room-types";
    }

    @PostMapping(params = "action=delete")
    public String deleteRoomType(@RequestParam Integer id) {
        try {
            roomTypeRepository.deleteById(id);
        } catch (Exception e) {


        }
        return "redirect:/admin/room-types";
    }
}
