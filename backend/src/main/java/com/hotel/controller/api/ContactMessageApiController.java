package com.hotel.controller.api;

import com.hotel.dto.ContactMessageCreateRequest;
import com.hotel.dto.ContactMessageUpdateRequest;
import com.hotel.entity.ContactMessage;
import com.hotel.service.ContactMessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class ContactMessageApiController {

    @Autowired
    private ContactMessageService contactMessageService;

    @PostMapping("/contact")
    public ResponseEntity<Map<String, Object>> createMessage(@Valid @RequestBody ContactMessageCreateRequest request) {
        ContactMessage created = contactMessageService.createMessage(
                request.firstName(),
                request.lastName(),
                request.email(),
                request.message()
        );
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã gửi tin nhắn thành công.",
                "contactMessageId", created.getId()
        ));
    }

    @GetMapping("/admin/contact-messages")
    public ResponseEntity<Map<String, Object>> listAdminMessages(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "1") int page) {
        Page<ContactMessage> messagePage;
        try {
            int safePage = normalizePage(page);
            messagePage = contactMessageService.getAdminMessages(q, status, safePage, 8);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("messages", messagePage.getContent());
        response.put("totalPages", messagePage.getTotalPages());
        response.put("currentPage", messagePage.getNumber() + 1);
        response.put("search", q);
        response.put("status", status);
        response.put("newCount", contactMessageService.countNewMessages());
        response.put("statusSummary", contactMessageService.countByAdminStatuses());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/contact-messages/{id}")
    public ResponseEntity<Map<String, Object>> getAdminMessage(@PathVariable Integer id) {
        Optional<ContactMessage> messageOpt = contactMessageService.getMessageById(id);
        if (messageOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Không tìm thấy liên hệ."
            ));
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "messageItem", messageOpt.get()
        ));
    }

    @PutMapping("/admin/contact-messages/{id}")
    public ResponseEntity<Map<String, Object>> updateAdminMessage(@PathVariable Integer id,
                                                                  @Valid @RequestBody ContactMessageUpdateRequest request) {
        Optional<ContactMessage> messageOpt = contactMessageService.getMessageById(id);
        if (messageOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Không tìm thấy liên hệ."
            ));
        }

        try {
            ContactMessage updated = contactMessageService.updateMessage(
                    messageOpt.get(),
                    request.status(),
                    request.adminNote()
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã cập nhật trạng thái liên hệ.",
                    "messageItem", updated
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }

    @DeleteMapping("/admin/contact-messages/{id}")
    public ResponseEntity<Map<String, Object>> deleteAdminMessage(@PathVariable Integer id) {
        Optional<ContactMessage> messageOpt = contactMessageService.getMessageById(id);
        if (messageOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Không tìm thấy liên hệ."
            ));
        }
        contactMessageService.deleteMessage(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã xóa liên hệ."
        ));
    }

    private int normalizePage(int page) {
        return Math.max(1, page);
    }
}
