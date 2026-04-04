package com.hotel.controller.api;

import com.hotel.config.VNPayConfig;
import com.hotel.entity.User;
import com.hotel.service.BookingService;
import com.hotel.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/vnpay")
public class VNPayController {

    @Autowired
    private VNPayService vnPayService;

    @Autowired
    private BookingService bookingService;

    private User getSessionUser(HttpSession session) {
        Object userObj = session.getAttribute("user");
        return userObj instanceof User ? (User) userObj : null;
    }

    private ResponseEntity<Map<String, Object>> authRequiredResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Vui long dang nhap de tiep tuc.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @GetMapping("/create-payment")
    public ResponseEntity<?> createPayment(
            @RequestParam("bookingId") Integer bookingId,
            @RequestParam(value = "paymentMode", required = false) String paymentMode,
            HttpServletRequest request,
            HttpSession session
    ) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }

        Map<String, Object> response = new HashMap<>();
        try {
            String normalizedPaymentMode = VNPayConfig.normalizePaymentMode(paymentMode);
            String paymentUrl = vnPayService.createPaymentUrl(bookingId, currentUser.getId(), normalizedPaymentMode, request);
            response.put("success", true);
            response.put("paymentUrl", paymentUrl);
            response.put("paymentMode", normalizedPaymentMode);
            return ResponseEntity.ok(response);
        } catch (SecurityException ex) {
            response.put("success", false);
            response.put("message", ex.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (IllegalArgumentException ex) {
            response.put("success", false);
            response.put("message", ex.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception ex) {
            response.put("success", false);
            response.put("message", ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/return")
    public ResponseEntity<Void> paymentReturn(@RequestParam Map<String, String> queryParams) {
        String redirectUrl = vnPayService.buildFrontendReturnUrl(queryParams);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirectUrl)
                .build();
    }

    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> paymentIpn(@RequestParam Map<String, String> queryParams) {
        return ResponseEntity.ok(vnPayService.processIpnCallback(queryParams));
    }

    @PostMapping("/demo-success")
    public ResponseEntity<Map<String, Object>> demoSuccess(
            @RequestBody Map<String, String> payload,
            HttpSession session
    ) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }

        Map<String, Object> response = new HashMap<>();
        try {
            Integer bookingId = Integer.parseInt(payload.get("bookingId"));
            String paymentMode = VNPayConfig.normalizePaymentMode(payload.get("paymentMode"));
            var booking = vnPayService.confirmDemoPayment(bookingId, currentUser.getId(), paymentMode);
            response.put("success", true);
            response.put(
                    "message",
                    "deposit".equals(paymentMode)
                            ? "Da mo phong thanh toan dat coc thanh cong. Booking da duoc xac nhan."
                            : "Da mo phong thanh toan toan bo thanh cong. Booking da duoc xac nhan."
            );
            response.put("bookingId", booking.getId());
            response.put("bookingStatus", booking.getStatus());
            response.put("paymentStatus", booking.getPaymentStatus());
            response.put("paymentMode", paymentMode);
            response.put("booking", bookingService.normalizeBookingFinancials(booking));
            return ResponseEntity.ok(response);
        } catch (NumberFormatException ex) {
            response.put("success", false);
            response.put("message", "Ma booking khong hop le.");
            return ResponseEntity.badRequest().body(response);
        } catch (SecurityException ex) {
            response.put("success", false);
            response.put("message", ex.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (IllegalArgumentException ex) {
            response.put("success", false);
            response.put("message", ex.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
