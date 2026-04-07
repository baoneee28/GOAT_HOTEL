package com.hotel.service;

import com.hotel.entity.User;
import com.hotel.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Objects;
import java.util.regex.Pattern;


// Service xử lý toàn bộ nghiệp vụ Xác thực người dùng (Đăng nhập, Đăng ký, Đăng xuất)
@Service
public class AuthService {

    public static final String SESSION_USER_KEY = "user";
    public static final String SESSION_VERSION_KEY = "sessionVersion";

    private static final Pattern BCRYPT_PATTERN = Pattern.compile("^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean isAdminRole(String role) {
        return role != null && "admin".equalsIgnoreCase(role.trim());
    }

    public boolean isStaffRole(String role) {
        return role != null && "staff".equalsIgnoreCase(role.trim());
    }

    public boolean isBackofficeRole(String role) {
        return isAdminRole(role) || isStaffRole(role);
    }

    public boolean isAdmin(User user) {
        return user != null && isAdminRole(user.getRole());
    }

    public boolean isStaff(User user) {
        return user != null && isStaffRole(user.getRole());
    }

    public boolean isBackoffice(User user) {
        return user != null && isBackofficeRole(user.getRole());
    }

    public String resolveClientRole(User user) {
        if (isAdmin(user)) {
            return "ADMIN";
        }
        if (isStaff(user)) {
            return "STAFF";
        }
        return "USER";
    }

    public String resolveDefaultRedirect(User user) {
        return isBackoffice(user) ? "/admin" : "/";
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

    
    // Hàm xử lý Đăng nhập: Tìm user theo email rồi so mật khẩu đã băm bằng PasswordEncoder
    @Transactional
    public User login(String email, String password, HttpSession session) {
        if (email == null || password == null) {
            return null;
        }

        Optional<User> optUser = userRepository.findByEmailIgnoreCase(email.trim());
        if (optUser.isEmpty()) {
            return null;
        }

        User user = optUser.get();
        String storedPassword = user.getPassword();
        if (storedPassword == null || storedPassword.isBlank()) {
            return null;
        }

        boolean authenticated = isPasswordHashed(storedPassword)
                ? passwordEncoder.matches(password, storedPassword)
                : password.equals(storedPassword);

        if (!authenticated) {
            return null;
        }

        if (!isPasswordHashed(storedPassword)) {
            user.setPassword(encodePassword(storedPassword));
        }

        user.setSessionVersion(nextSessionVersion(user.getSessionVersion()));
        user = userRepository.save(user);

        attachAuthenticatedUser(session, user);
        return user;
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
        newUser.setPassword(encodePassword(password));
        newUser.setPhone(phone);
        newUser.setRole("customer"); // Mặc định tự đăng ký thì chỉ là Khách hàng (customer) thôi
        
        // Ghi xuống DB
        userRepository.save(newUser);

        return null; // Trả về null = Không có lỗi
    }

    
    public void logout(HttpSession session) {
        if (session == null) {
            return;
        }
        session.invalidate();
    }

    public User getValidSessionUser(HttpSession session) {
        if (session == null) {
            return null;
        }

        Object userObj = session.getAttribute(SESSION_USER_KEY);
        if (!(userObj instanceof User sessionUser)) {
            return null;
        }

        Integer sessionVersion = extractSessionVersion(session.getAttribute(SESSION_VERSION_KEY));
        if (sessionUser.getId() == null || sessionVersion == null) {
            invalidateQuietly(session);
            return null;
        }

        Optional<User> optUser = userRepository.findById(sessionUser.getId());
        if (optUser.isEmpty()) {
            invalidateQuietly(session);
            return null;
        }

        User currentUser = optUser.get();
        if (currentUser.getSessionVersion() == null
                || !Objects.equals(currentUser.getSessionVersion(), sessionVersion)) {
            invalidateQuietly(session);
            return null;
        }

        attachAuthenticatedUser(session, currentUser);
        return currentUser;
    }

    private void attachAuthenticatedUser(HttpSession session, User user) {
        if (session == null || user == null) {
            return;
        }

        session.setAttribute(SESSION_USER_KEY, user);
        session.setAttribute(SESSION_VERSION_KEY, user.getSessionVersion());
    }

    private Integer extractSessionVersion(Object rawValue) {
        if (rawValue instanceof Number number) {
            return number.intValue();
        }
        return null;
    }

    private int nextSessionVersion(Integer currentVersion) {
        return currentVersion == null ? 1 : currentVersion + 1;
    }

    private void invalidateQuietly(HttpSession session) {
        try {
            session.invalidate();
        } catch (IllegalStateException ignored) {
            // Session đã bị invalidate trước đó thì không cần xử lý thêm.
        }
    }

    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    public boolean isPasswordHashed(String password) {
        return password != null && BCRYPT_PATTERN.matcher(password).matches();
    }
}
