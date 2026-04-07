package com.hotel.service;

import com.hotel.entity.ContactMessage;
import com.hotel.repository.ContactMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class ContactMessageService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("new", "in_progress", "resolved");

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    public ContactMessage createMessage(String firstName, String lastName, String email, String message) {
        ContactMessage contactMessage = new ContactMessage();
        contactMessage.setFirstName(firstName.trim());
        contactMessage.setLastName(lastName.trim());
        contactMessage.setEmail(email.trim());
        contactMessage.setMessage(message.trim());
        contactMessage.setStatus("new");
        contactMessage.setAdminNote("");
        return contactMessageRepository.save(contactMessage);
    }

    public Page<ContactMessage> getAdminMessages(String search, String status, int page, int pageSize) {
        return contactMessageRepository.findWithFilters(
                search == null || search.isBlank() ? null : search.trim(),
                normalizeOptionalStatus(status),
                PageRequest.of(Math.max(0, page - 1), pageSize, Sort.by("id").descending())
        );
    }

    public Optional<ContactMessage> getMessageById(@NonNull Integer id) {
        return contactMessageRepository.findById(id);
    }

    public ContactMessage updateMessage(ContactMessage existing, String status, String adminNote) {
        if (status != null && !status.isBlank()) {
            existing.setStatus(normalizeRequiredStatus(status));
        }
        existing.setAdminNote(adminNote == null ? "" : adminNote.trim());
        return contactMessageRepository.save(existing);
    }

    public void deleteMessage(@NonNull Integer id) {
        contactMessageRepository.deleteById(id);
    }

    public long countNewMessages() {
        return contactMessageRepository.countByStatus("new");
    }

    public Map<String, Long> countByAdminStatuses() {
        Map<String, Long> summary = new LinkedHashMap<>();
        summary.put("new", contactMessageRepository.countByStatus("new"));
        summary.put("in_progress", contactMessageRepository.countByStatus("in_progress"));
        summary.put("resolved", contactMessageRepository.countByStatus("resolved"));
        return summary;
    }

    private String normalizeOptionalStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        return normalizeRequiredStatus(status);
    }

    private String normalizeRequiredStatus(String status) {
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Trạng thái liên hệ không hợp lệ.");
        }
        return normalized;
    }
}
