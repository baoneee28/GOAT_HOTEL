package com.hotel.service;

import com.hotel.entity.User;
import com.hotel.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private HttpSession session;

    @InjectMocks
    private AuthService authService;

    // ── Role checks ──

    @Test
    void isAdminRoleReturnsTrueForAdmin() {
        assertThat(authService.isAdminRole("admin")).isTrue();
        assertThat(authService.isAdminRole("ADMIN")).isTrue();
        assertThat(authService.isAdminRole(" Admin ")).isTrue();
    }

    @Test
    void isAdminRoleReturnsFalseForNonAdmin() {
        assertThat(authService.isAdminRole("customer")).isFalse();
        assertThat(authService.isAdminRole("staff")).isFalse();
        assertThat(authService.isAdminRole(null)).isFalse();
        assertThat(authService.isAdminRole("")).isFalse();
    }

    @Test
    void isStaffRoleReturnsTrueForStaff() {
        assertThat(authService.isStaffRole("staff")).isTrue();
        assertThat(authService.isStaffRole("STAFF")).isTrue();
    }

    @Test
    void isBackofficeRoleReturnsTrueForAdminAndStaff() {
        assertThat(authService.isBackofficeRole("admin")).isTrue();
        assertThat(authService.isBackofficeRole("staff")).isTrue();
        assertThat(authService.isBackofficeRole("customer")).isFalse();
    }

    @Test
    void resolveClientRoleReturnsCorrectRole() {
        User admin = new User();
        admin.setRole("admin");
        assertThat(authService.resolveClientRole(admin)).isEqualTo("ADMIN");

        User staff = new User();
        staff.setRole("staff");
        assertThat(authService.resolveClientRole(staff)).isEqualTo("STAFF");

        User customer = new User();
        customer.setRole("customer");
        assertThat(authService.resolveClientRole(customer)).isEqualTo("USER");
    }

    // ── Password hashing ──

    @Test
    void isPasswordHashedReturnsTrueForBcryptHash() {
        String bcryptHash = "$2a$10$xFm5bx0.lwf/YPDD1ntz2.1CdBUrPwPD4fBMEsDEg6BEKSD1QVQ2K";
        assertThat(authService.isPasswordHashed(bcryptHash)).isTrue();
    }

    @Test
    void isPasswordHashedReturnsFalseForPlaintext() {
        assertThat(authService.isPasswordHashed("password123")).isFalse();
        assertThat(authService.isPasswordHashed("")).isFalse();
        assertThat(authService.isPasswordHashed(null)).isFalse();
    }

    @Test
    void encodePasswordDelegatesToPasswordEncoder() {
        when(passwordEncoder.encode("test")).thenReturn("$2a$10$encoded");

        String result = authService.encodePassword("test");

        assertThat(result).isEqualTo("$2a$10$encoded");
        verify(passwordEncoder).encode("test");
    }

    // ── Login ──

    @Test
    void loginReturnsNullForNullInputs() {
        assertThat(authService.login(null, "pass", null)).isNull();
        assertThat(authService.login("email", null, null)).isNull();
    }

    @Test
    void loginReturnsNullForNonExistentUser() {
        when(userRepository.findByEmailIgnoreCase("missing@test.com")).thenReturn(Optional.empty());

        User result = authService.login("missing@test.com", "pass", null);

        assertThat(result).isNull();
    }

    @Test
    void loginAuthenticatesWithBcryptPassword() {
        // BCrypt hash must be exactly 60 chars: $2a$10$ + 53 chars of [./A-Za-z0-9]
        String validBcryptHash = "$2a$10$xFm5bx0.lwf/YPDD1ntz2.1CdBUrPwPD4fBMEsDEg6BEKSD1QVQ2K";
        User user = new User();
        user.setId(1);
        user.setEmail("test@test.com");
        user.setPassword(validBcryptHash);

        when(userRepository.findByEmailIgnoreCase("test@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correctpass", validBcryptHash)).thenReturn(true);
        when(userRepository.save(isA(User.class))).thenAnswer(invocation -> invocation.getArgument(0, User.class));

        User result = authService.login("test@test.com", "correctpass", null);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("test@test.com");
    }

    @Test
    void loginStoresIncrementedSessionVersionForCurrentBrowserSession() {
        String validBcryptHash = "$2a$10$xFm5bx0.lwf/YPDD1ntz2.1CdBUrPwPD4fBMEsDEg6BEKSD1QVQ2K";
        User user = new User();
        user.setId(1);
        user.setEmail("test@test.com");
        user.setPassword(validBcryptHash);
        user.setSessionVersion(2);

        when(userRepository.findByEmailIgnoreCase("test@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correctpass", validBcryptHash)).thenReturn(true);
        when(userRepository.save(isA(User.class))).thenAnswer(invocation -> invocation.getArgument(0, User.class));

        User result = authService.login("test@test.com", "correctpass", session);

        assertThat(result).isNotNull();
        assertThat(result.getSessionVersion()).isEqualTo(3);
        verify(session).setAttribute(AuthService.SESSION_USER_KEY, user);
        verify(session).setAttribute(AuthService.SESSION_VERSION_KEY, 3);
    }

    @Test
    void loginReturnsNullForWrongPassword() {
        String validBcryptHash = "$2a$10$xFm5bx0.lwf/YPDD1ntz2.1CdBUrPwPD4fBMEsDEg6BEKSD1QVQ2K";
        User user = new User();
        user.setId(1);
        user.setEmail("test@test.com");
        user.setPassword(validBcryptHash);

        when(userRepository.findByEmailIgnoreCase("test@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", validBcryptHash)).thenReturn(false);

        User result = authService.login("test@test.com", "wrongpass", null);

        assertThat(result).isNull();
    }

    @Test
    void loginUpgradesLegacyPlaintextPasswordToBcryptAndSavesUser() {
        User user = new User();
        user.setId(1);
        user.setEmail("legacy@test.com");
        user.setPassword("legacy123");

        when(userRepository.findByEmailIgnoreCase("legacy@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("legacy123")).thenReturn("$2a$10$rehashedLegacyPasswordValue123456789012345678901234");
        when(userRepository.save(isA(User.class))).thenAnswer(invocation -> invocation.getArgument(0, User.class));

        User result = authService.login("legacy@test.com", "legacy123", null);

        assertThat(result).isNotNull();
        assertThat(result.getPassword()).isEqualTo("$2a$10$rehashedLegacyPasswordValue123456789012345678901234");
        verify(passwordEncoder).encode("legacy123");
        verify(userRepository).save(user);
    }

    @Test
    void getValidSessionUserRefreshesCurrentSessionWhenVersionMatches() {
        User sessionUser = new User();
        sessionUser.setId(1);

        User storedUser = new User();
        storedUser.setId(1);
        storedUser.setEmail("test@test.com");
        storedUser.setSessionVersion(4);

        when(session.getAttribute(AuthService.SESSION_USER_KEY)).thenReturn(sessionUser);
        when(session.getAttribute(AuthService.SESSION_VERSION_KEY)).thenReturn(4);
        when(userRepository.findById(1)).thenReturn(Optional.of(storedUser));

        User result = authService.getValidSessionUser(session);

        assertThat(result).isSameAs(storedUser);
        verify(session).setAttribute(AuthService.SESSION_USER_KEY, storedUser);
        verify(session).setAttribute(AuthService.SESSION_VERSION_KEY, 4);
        verify(session, never()).invalidate();
    }

    @Test
    void getValidSessionUserInvalidatesStaleSessionWhenVersionDiffers() {
        User sessionUser = new User();
        sessionUser.setId(1);

        User storedUser = new User();
        storedUser.setId(1);
        storedUser.setSessionVersion(5);

        when(session.getAttribute(AuthService.SESSION_USER_KEY)).thenReturn(sessionUser);
        when(session.getAttribute(AuthService.SESSION_VERSION_KEY)).thenReturn(4);
        when(userRepository.findById(1)).thenReturn(Optional.of(storedUser));

        User result = authService.getValidSessionUser(session);

        assertThat(result).isNull();
        verify(session).invalidate();
    }

    // ── Register ──

    @Test
    void registerReturnsErrorWhenEmailExists() {
        when(userRepository.findByEmail("existing@test.com")).thenReturn(Optional.of(new User()));

        String result = authService.register("Test", "existing@test.com", "pass123", "0901234567");

        assertThat(result).isEqualTo("Email này đã được sử dụng!");
        verify(userRepository, never()).save(isA(User.class));
    }

    @Test
    void registerCreatesNewUserWithHashedPassword() {
        when(userRepository.findByEmail("new@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pass123")).thenReturn("$2a$10$hashed");
        when(userRepository.save(isA(User.class))).thenAnswer(invocation -> invocation.getArgument(0, User.class));

        String result = authService.register("Test User", "new@test.com", "pass123", "0901234567");

        assertThat(result).isNull(); // null = success
        verify(passwordEncoder).encode("pass123");
        verify(userRepository).save(isA(User.class));
    }

    // ── toClientUser ──

    @Test
    void toClientUserStripsPassword() {
        User source = new User();
        source.setId(1);
        source.setFullName("Test");
        source.setEmail("test@test.com");
        source.setPassword("$2a$10$secret");
        source.setRole("customer");

        User safe = authService.toClientUser(source);

        assertThat(safe).isNotNull();
        assertThat(safe.getId()).isEqualTo(1);
        assertThat(safe.getFullName()).isEqualTo("Test");
        assertThat(safe.getPassword()).isNull(); // password not copied
    }

    @Test
    void toClientUserReturnsNullForNullInput() {
        assertThat(authService.toClientUser(null)).isNull();
    }
}
