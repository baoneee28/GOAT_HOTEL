package com.hotel.controller.api;

import com.hotel.entity.Notification;
import com.hotel.entity.User;
import com.hotel.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class NotificationApiController {

    @Autowired
    private NotificationService notificationService;

    private User getSessionUser(HttpSession session) {
        return (User) session.getAttribute("user");
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyNotifications(HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        List<Notification> allNotes = notificationService.getUserNotifications(user.getId());
        long unreadCount = allNotes.stream().filter(n -> !n.getIsRead()).count();

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", allNotes);
        response.put("unreadCount", unreadCount);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer id, HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(Map.of("message", "All marked as read"));
    }
}
