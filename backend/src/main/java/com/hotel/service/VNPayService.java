package com.hotel.service;

import com.hotel.config.VNPayConfig;
import com.hotel.entity.Booking;
import com.hotel.entity.Payment;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.PaymentRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

@Service
public class VNPayService {

    @Value("${vnp.tmnCode:}")
    private String vnpTmnCode;

    @Value("${vnp.hashSecret:}")
    private String vnpHashSecret;

    @Value("${vnp.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpPayUrl;

    @Value("${vnp.returnUrl:http://localhost:8080/api/vnpay/return}")
    private String vnpReturnUrl;

    @Value("${vnp.frontendReturnUrl:http://localhost:5173/vnpay-return}")
    private String vnpFrontendReturnUrl;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingService bookingService;

    public String createPaymentUrl(Integer bookingId, Integer currentUserId, HttpServletRequest request) throws Exception {
        validateConfiguration();

        if (bookingId == null) {
            throw new IllegalArgumentException("Thiếu mã booking để khởi tạo thanh toán.");
        }
        if (currentUserId == null) {
            throw new SecurityException("Phiên đăng nhập không hợp lệ.");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng."));

        if (booking.getUser() == null || !currentUserId.equals(booking.getUser().getId())) {
            throw new SecurityException("Bạn không có quyền thanh toán đơn đặt phòng này.");
        }

        if (!"pending".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể thanh toán booking đang ở trạng thái chờ xử lý.");
        }
        if ("paid".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new IllegalArgumentException("Booking này đã được đánh dấu đã thanh toán.");
        }

        bookingService.normalizeBookingFinancials(booking);
        double bookingTotal = booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0;
        if (bookingTotal <= 0) {
            throw new IllegalArgumentException("Đơn đặt phòng chưa có số tiền hợp lệ để thanh toán.");
        }

        if (!"pending_payment".equalsIgnoreCase(booking.getPaymentStatus())) {
            booking.setPaymentStatus("pending_payment");
            bookingRepository.save(booking);
        }

        long amount = Math.round(bookingTotal * 100L);
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnpTmnCode.trim());
        params.put("vnp_Amount", String.valueOf(amount));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", VNPayConfig.buildTxnRef(bookingId));
        params.put("vnp_OrderInfo", "Thanh toan booking " + bookingId);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnpReturnUrl.trim());
        params.put("vnp_IpAddr", VNPayConfig.getIpAddress(request));

        TimeZone timeZone = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
        Calendar calendar = Calendar.getInstance(timeZone);
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(timeZone);
        params.put("vnp_CreateDate", formatter.format(calendar.getTime()));

        calendar.add(Calendar.MINUTE, 15);
        params.put("vnp_ExpireDate", formatter.format(calendar.getTime()));

        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> iterator = fieldNames.iterator();
        while (iterator.hasNext()) {
            String fieldName = iterator.next();
            String fieldValue = params.get(fieldName);
            if (fieldValue == null || fieldValue.isBlank()) {
                continue;
            }

            hashData.append(fieldName)
                    .append('=')
                    .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
            query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                    .append('=')
                    .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));

            if (iterator.hasNext()) {
                hashData.append('&');
                query.append('&');
            }
        }

        String secureHash = VNPayConfig.hmacSHA512(vnpHashSecret.trim(), hashData.toString());
        return vnpPayUrl.trim() + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    @Transactional
    public String buildFrontendReturnUrl(Map<String, String> queryParams) {
        VNPayValidationResult validation = validateCallback(queryParams);
        if (validation.success() && validation.booking() != null) {
            confirmBookingPayment(validation.booking(), "VNPay");
        }

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(vnpFrontendReturnUrl.trim())
                .queryParam("status", validation.success() ? "success" : "error")
                .queryParam("message", validation.message());

        if (validation.bookingId() != null) {
            builder.queryParam("bookingId", validation.bookingId());
        }

        return builder.build().encode().toUriString();
    }

    @Transactional
    public Map<String, String> processIpnCallback(Map<String, String> queryParams) {
        VNPayValidationResult validation = validateCallback(queryParams);

        if (!validation.signatureValid()) {
            return createIpnResponse("97", "Invalid signature");
        }
        if (validation.booking() == null) {
            return createIpnResponse("01", "Order not found");
        }
        if (!validation.amountValid()) {
            return createIpnResponse("04", "Invalid amount");
        }

        if (validation.paymentSuccess()) {
            confirmBookingPayment(validation.booking(), "VNPay");
            return createIpnResponse("00", "Confirm Success");
        }

        return createIpnResponse("00", "Payment Failed");
    }

    private VNPayValidationResult validateCallback(Map<String, String> queryParams) {
        Map<String, String> fields = new HashMap<>(queryParams);
        String secureHash = fields.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank()) {
            return new VNPayValidationResult(false, false, false, null, null, "Thiếu chữ ký xác thực từ VNPay.");
        }

        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        Iterator<String> iterator = fieldNames.iterator();
        while (iterator.hasNext()) {
            String fieldName = iterator.next();
            String fieldValue = fields.get(fieldName);
            if (fieldValue == null || fieldValue.isBlank()) {
                continue;
            }

            hashData.append(fieldName)
                    .append('=')
                    .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
            if (iterator.hasNext()) {
                hashData.append('&');
            }
        }

        String signedValue = VNPayConfig.hmacSHA512(vnpHashSecret.trim(), hashData.toString());
        if (!signedValue.equalsIgnoreCase(secureHash)) {
            return new VNPayValidationResult(false, false, false, null, null, "Chữ ký VNPay không hợp lệ.");
        }

        Integer bookingId = VNPayConfig.extractBookingId(fields.get("vnp_TxnRef"));
        if (bookingId == null) {
            return new VNPayValidationResult(true, false, false, null, null, "Không xác định được booking từ giao dịch VNPay.");
        }

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            return new VNPayValidationResult(true, false, false, bookingId, null, "Không tìm thấy đơn đặt phòng tương ứng.");
        }

        bookingService.normalizeBookingFinancials(booking);
        long expectedAmount = Math.round((booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0) * 100L);
        boolean amountValid = String.valueOf(expectedAmount).equals(fields.get("vnp_Amount"));
        if (!amountValid) {
            return new VNPayValidationResult(true, false, false, bookingId, booking, "Số tiền VNPay trả về không khớp với booking.");
        }

        String responseCode = fields.get("vnp_ResponseCode");
        String transactionStatus = fields.get("vnp_TransactionStatus");
        boolean paymentSuccess = "00".equals(responseCode) && "00".equals(transactionStatus);

        if (paymentSuccess) {
            return new VNPayValidationResult(true, true, true, bookingId, booking, "Thanh toán VNPay thành công.");
        }

        return new VNPayValidationResult(true, false, true, bookingId, booking, "Thanh toán chưa thành công hoặc đã bị hủy.");
    }

    private void validateConfiguration() {
        if (vnpTmnCode == null || vnpTmnCode.isBlank()) {
            throw new IllegalArgumentException("Thiếu cấu hình VNPay: vnp.tmnCode");
        }
        if (vnpHashSecret == null || vnpHashSecret.isBlank()) {
            throw new IllegalArgumentException("Thiếu cấu hình VNPay: vnp.hashSecret");
        }
        if (vnpPayUrl == null || vnpPayUrl.isBlank()) {
            throw new IllegalArgumentException("Thiếu cấu hình VNPay: vnp.url");
        }
        if (vnpReturnUrl == null || vnpReturnUrl.isBlank()) {
            throw new IllegalArgumentException("Thiếu cấu hình VNPay: vnp.returnUrl");
        }
        if (vnpFrontendReturnUrl == null || vnpFrontendReturnUrl.isBlank()) {
            throw new IllegalArgumentException("Thiếu cấu hình VNPay: vnp.frontendReturnUrl");
        }
    }

    private Map<String, String> createIpnResponse(String rspCode, String message) {
        Map<String, String> response = new HashMap<>();
        response.put("RspCode", rspCode);
        response.put("Message", message);
        return response;
    }

    @Transactional
    public Booking confirmDemoPayment(Integer bookingId, Integer currentUserId) {
        if (bookingId == null) {
            throw new IllegalArgumentException("Thiếu booking để xác nhận thanh toán demo.");
        }
        if (currentUserId == null) {
            throw new SecurityException("Phiên đăng nhập không hợp lệ.");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt phòng."));

        if (booking.getUser() == null || !currentUserId.equals(booking.getUser().getId())) {
            throw new SecurityException("Bạn không có quyền thao tác đơn đặt phòng này.");
        }
        if ("cancelled".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Booking đã bị hủy nên không thể mô phỏng thanh toán.");
        }
        if (!"pending".equalsIgnoreCase(booking.getStatus()) && !"confirmed".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể mô phỏng thanh toán cho booking đang chờ hoặc đã xác nhận.");
        }

        confirmBookingPayment(booking, "VNPay Demo");
        return booking;
    }

    private void confirmBookingPayment(Booking booking, String paymentMethod) {
        if (booking == null || "cancelled".equalsIgnoreCase(booking.getStatus())) {
            return;
        }

        boolean changed = false;
        if ("pending".equalsIgnoreCase(booking.getStatus())) {
            booking.setStatus("confirmed");
            changed = true;
        }
        if (!"paid".equalsIgnoreCase(booking.getPaymentStatus())) {
            booking.setPaymentStatus("paid");
            changed = true;
        }
        if (changed) {
            bookingRepository.save(booking);
        }

        if (!paymentRepository.existsByBooking_Id(booking.getId())) {
            Payment payment = new Payment();
            payment.setBooking(booking);
            payment.setAmount(booking.getTotalPrice());
            payment.setPaymentMethod(paymentMethod);
            payment.setPaymentDate(java.time.LocalDateTime.now());
            payment.setStatus("paid");
            paymentRepository.save(payment);
        }
    }

    private record VNPayValidationResult(
            boolean signatureValid,
            boolean paymentSuccess,
            boolean amountValid,
            Integer bookingId,
            Booking booking,
            String message
    ) {
        private boolean success() {
            return signatureValid && paymentSuccess && amountValid;
        }
    }
}
