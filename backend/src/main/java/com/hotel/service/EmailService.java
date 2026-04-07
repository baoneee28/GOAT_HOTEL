package com.hotel.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendPasswordResetOtp(@NonNull String toEmail, @NonNull String otp) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom("goathotelvua@gmail.com", "GOAT Hotel");
        helper.setTo(toEmail);
        helper.setSubject("[GOAT HOTEL] Ma xac nhan dat lai mat khau");

        String html =
            "<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:16px;\">" +
            "  <div style=\"text-align:center;margin-bottom:24px;\">" +
            "    <h1 style=\"font-size:24px;font-weight:800;color:#1a1a2e;letter-spacing:-0.5px;\">GOAT HOTEL</h1>" +
            "  </div>" +
            "  <div style=\"background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);\">" +
            "    <h2 style=\"font-size:18px;color:#1a1a2e;margin:0 0 8px;\">Dat lai mat khau</h2>" +
            "    <p style=\"color:#64748b;font-size:14px;margin:0 0 24px;\">Chung toi nhan duoc yeu cau dat lai mat khau. Su dung ma OTP ben duoi:</p>" +
            "    <div style=\"background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;\">" +
            "      <span style=\"font-size:40px;font-weight:900;letter-spacing:12px;color:#1e293b;font-family:monospace;\">" + otp + "</span>" +
            "    </div>" +
            "    <p style=\"color:#94a3b8;font-size:13px;margin:0;\">Ma co hieu luc trong <strong>10 phut</strong>. Neu ban khong yeu cau, hay bo qua email nay.</p>" +
            "  </div>" +
            "  <p style=\"text-align:center;color:#cbd5e1;font-size:12px;margin-top:20px;\">2026 GOAT Hotel. All rights reserved.</p>" +
            "</div>";

        helper.setText(html, true);
        mailSender.send(message);
    }
}
