package com.hotel.config;

import com.hotel.entity.User;
import com.hotel.repository.UserRepository;
import com.hotel.service.AuthService;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class PasswordHashBackfillRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(PasswordHashBackfillRunner.class);

    private final UserRepository userRepository;
    private final AuthService authService;

    public PasswordHashBackfillRunner(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<User> usersToUpdate = new ArrayList<>();

        for (User user : userRepository.findAll()) {
            String password = user.getPassword();
            if (password == null || password.isBlank()) {
                user.setPassword(authService.encodePassword(UUID.randomUUID().toString()));
                usersToUpdate.add(user);
                continue;
            }

            if (authService.isPasswordHashed(password)) {
                continue;
            }

            user.setPassword(authService.encodePassword(password));
            usersToUpdate.add(user);
        }

        if (!usersToUpdate.isEmpty()) {
            userRepository.saveAll(usersToUpdate);
            log.info("PasswordHashBackfillRunner secured {} legacy password record(s).", usersToUpdate.size());
        }
    }
}
