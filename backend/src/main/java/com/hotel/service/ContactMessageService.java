package com.hotel.service;

import com.hotel.entity.ContactMessage;
import com.hotel.repository.ContactMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ContactMessageService {

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
                status == null || status.isBlank() ? null : status.trim(),
                PageRequest.of(page - 1, pageSize, Sort.by("id").descending())
        );
    }

    public Optional<ContactMessage> getMessageById(Integer id) {
        return contactMessageRepository.findById(id);
    }

    public ContactMessage updateMessage(ContactMessage existing, String status, String adminNote) {
        if (status != null && !status.isBlank()) {
            existing.setStatus(status.trim());
        }
        existing.setAdminNote(adminNote == null ? "" : adminNote.trim());
        return contactMessageRepository.save(existing);
    }

    public void deleteMessage(Integer id) {
        contactMessageRepository.deleteById(id);
    }

    public long countNewMessages() {
        return contactMessageRepository.countByStatus("new");
    }
}
