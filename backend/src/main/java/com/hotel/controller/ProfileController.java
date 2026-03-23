package com.hotel.controller;

import com.hotel.entity.User;
import com.hotel.repository.UserRepository;
import com.hotel.service.FileUploadService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


// Controller quản lý thông tin cá nhân của người dùng (Đổi tên, số điện thoại, Avatar)
@Controller
@SuppressWarnings("null")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileUploadService fileUploadService;

    
    // Hiển thị form cập nhật thông tin cá nhân
    // Lưu ý: Tuyến đường /profile đã được bảo vệ bởi AuthInterceptor nên chắc chắn tới được đây là phải đăng nhập rồi
    @GetMapping("/profile")
    public String profilePage() {
        return "profile";
    }

    
    // Nhận dữ liệu khi người dùng ấn Lưu lại (Form phải có enctype="multipart/form-data" để nhận file ảnh avatar)
    @PostMapping("/profile")
    public String updateProfile(@RequestParam String full_name,
                                @RequestParam String phone,
                                @RequestParam(required = false) MultipartFile avatar, // required=false vì có thể sửa tên nhưng không chọn ảnh mới
                                HttpSession session,
                                Model model) {
        // 1. Lấy thông tin user hiện tại đang giữ trong session
        User sessionUser = (User) session.getAttribute("user");

        // 2. Chọc thẳng xuống DB để móc lên dữ liệu mới nhất (chắc cú vì DB có thể vừa thay đổi)
        User user = userRepository.findById(sessionUser.getId()).orElse(null);
        if (user == null) return "redirect:/logout";

        // 3. Ghi đè Tên và Số ĐT
        user.setFullName(full_name);
        user.setPhone(phone);

        // 4. Xử lý ảnh đại diện nếu người dùng có chọn upload file mới
        if (avatar != null && !avatar.isEmpty()) {
            try {
                // Đẩy file lên thư mục tĩnh, hàm uploadUserAvatar tự thu dọn file cũ và trả về tên file mới
                String fileName = fileUploadService.uploadUserAvatar(avatar, user.getId());
                user.setImage(fileName); // Gắn tên file vừa lưu thẳng vào Entity để lưu DB
            } catch (Exception e) {
                model.addAttribute("error", "Lỗi upload ảnh: " + e.getMessage());
                return "profile";
            }
        }

        // 5. Cập nhật record trong DB với các trường vừa bị thay đổi
        userRepository.save(user);

        // 6. Ghi đẻ biến Session bằng class User mới (để Header góc trên cùng bên phải thay đổi theo liền)
        session.setAttribute("user", user);

        // Bắn alert thành công ra giao diện
        model.addAttribute("success", "Cập nhật thông tin thành công!");
        return "profile";
    }
}
