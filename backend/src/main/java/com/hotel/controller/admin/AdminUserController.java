package com.hotel.controller.admin;

import com.hotel.entity.User;
import com.hotel.repository.UserRepository;
import com.hotel.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


// Controller quản lý danh sách Tài Khoản Người Dùng (Bao gồm Admin và Khách Hàng)
@Controller
@RequestMapping("/admin/users")
@SuppressWarnings("null")
public class AdminUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileUploadService fileUploadService;

    private static final int PAGE_SIZE = 5;

    // Hiển thị danh sách User có phân trang
    @GetMapping
    public String listUsers(@RequestParam(defaultValue = "") String q,
                            @RequestParam(defaultValue = "1") int page,
                            Model model) {

        Page<User> userPage;
        // Nếu không có từ khóa tìm kiếm -> Lấy toàn bộ vứt ra màn hình
        // Lấy danh sách (Tính năng Search bị hỏng từ đầu do đồ án gốc chưa viết Custom Query)
        userPage = userRepository.findAll(
                PageRequest.of(page - 1, PAGE_SIZE, Sort.by("id").descending()));

        model.addAttribute("users", userPage.getContent());
        model.addAttribute("total_pages", userPage.getTotalPages());
        model.addAttribute("page", page);
        model.addAttribute("search", q);

        return "admin/users";
    }

    // Nút Lưu trên Form (Dùng chung cho cả Thêm Mới và Sửa)
    @PostMapping(params = "action=save")
    public String saveUser(@RequestParam(required = false) Integer user_id,
                           @RequestParam String full_name,
                           @RequestParam String email,
                           @RequestParam(defaultValue = "") String password,
                           @RequestParam(defaultValue = "") String phone,
                           @RequestParam String role,
                           @RequestParam(required = false) String current_image,
                           @RequestParam(required = false) MultipartFile image) {
        User user;
        // 1. TRƯỜNG HỢP SỬA (Có truyền ID)
        if (user_id != null && user_id > 0) {

            user = userRepository.findById(user_id).orElse(null);
            if (user != null) {
                user.setRole(role);
                userRepository.save(user);
            }
            return "redirect:/admin/users";
        } 
        
        // 2. TRƯỜNG HỢP THÊM MỚI (Không có ID)
        user = new User();
        user.setFullName(full_name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(role);
        // Nếu Form có gõ Mật khẩu mới thì Set vào, không thì giữ nguyên mật khẩu cũ
        if (!password.isBlank()) {
            user.setPassword(password);
        }

        // Tải ảnh đại diện (avatar) của họ lên host
        String imgName = current_image;
        if (image != null && !image.isEmpty()) {
            try {

                imgName = fileUploadService.uploadGeneral(image, "user_");
            } catch (Exception ignored) {}
        }
        user.setImage(imgName);

        userRepository.save(user);
        return "redirect:/admin/users";
    }

    // Xóa User thủ công (Tránh xóa nhầm người có đơn hàng -> bọc Try/Catch)
    @PostMapping(params = "action=delete")
    public String deleteUser(@RequestParam Integer id) {
        try {
            userRepository.deleteById(id);
        } catch (Exception ignored) {}
        return "redirect:/admin/users";
    }
}
