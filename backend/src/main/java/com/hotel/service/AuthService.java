package com.hotel.service;

import com.hotel.entity.User;
import com.hotel.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;


// Service xử lý toàn bộ nghiệp vụ Xác thực người dùng (Đăng nhập, Đăng ký, Đăng xuất)
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public boolean isAdminRole(String role) {
        return role != null && "admin".equalsIgnoreCase(role.trim());
    }

    public boolean isAdmin(User user) {
        return user != null && isAdminRole(user.getRole());
    }

    public String resolveClientRole(User user) {
        return isAdmin(user) ? "ADMIN" : "USER";
    }

    public String resolveDefaultRedirect(User user) {
        return isAdmin(user) ? "/admin" : "/";
    }

    public User toClientUser(User source) {
        if (source == null) {
            return null;
        }

        User safeUser = new User();
        safeUser.setId(source.getId());
        safeUser.setFullName(source.getFullName());
        safeUser.setEmail(source.getEmail());
        safeUser.setPhone(source.getPhone());
        safeUser.setImage(source.getImage());
        safeUser.setRole(source.getRole());
        safeUser.setCreatedAt(source.getCreatedAt());
        return safeUser;
    }

    
    // Hàm xử lý Đăng nhập: Gọi xuống DB xem có ông nào khớp email & password không
    public User login(String email, String password, HttpSession session) {
        Optional<User> optUser = userRepository.findByEmailAndPassword(email, password);
        // Nếu DB trả về có người dùng (isPresent)
        if (optUser.isPresent()) {
            User user = optUser.get();
            // Ném user vào Session để nhớ mặt (nếu được truyền vào session)
            if (session != null) {
                session.setAttribute("user", user);
            }
            return user;
        }
        return null; // Tịt -> Sai email hoặc password
    }

    
    // Hàm xử lý Đăng ký tài khoản
    // @Transactional đảm bảo nếu luồng ghi DB lỗi giữa chừng thì sẽ Rollback lại, Database không bị rác
    @Transactional
    public String register(String fullName, String email, String password, String phone) {
        // Quét xem email này đã từng có ai đăng ký chưa (Email là duy nhất)
        if (userRepository.findByEmail(email).isPresent()) {
            return "Email này đã được sử dụng!"; // Trả về thông báo lỗi cho Controller
        }

        // Tạo Entity User mới và cắm data từ Form vào
        User newUser = new User();
        newUser.setFullName(fullName);
        newUser.setEmail(email);
        newUser.setPassword(password); // Thực tế sinh viên có thể dùng PasswordEncoder, nhưng đồ án nhỏ thì để thẳng
        newUser.setPhone(phone);
        newUser.setRole("customer"); // Mặc định tự đăng ký thì chỉ là Khách hàng (customer) thôi
        
        // Ghi xuống DB
        userRepository.save(newUser);

        return null; // Trả về null = Không có lỗi
    }

    
    public void logout(HttpSession session) {
        session.invalidate();
    }
}
