package com.hotel.service;

import com.hotel.config.VNPayConfig;
import com.hotel.entity.Booking;
import com.hotel.repository.BookingRepository;
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
import java.util.Objects;
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
    private String vnpFrontendReturnUrl = "http://localhost:5173/vnpay-return";

    @Value("${booking.pending-hold-seconds:180}")
    private long pendingHoldSeconds;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private PaymentService paymentService;

    public String createPaymentUrl(Integer bookingId,
                                   Integer currentUserId,
                                   String paymentMode,
                                   HttpServletRequest request) throws Exception {
        validateConfiguration();

        if (bookingId == null) {
            throw new IllegalArgumentException("Thieu ma booking de khoi tao thanh toan.");
        }
        if (currentUserId == null) {
            throw new SecurityException("Phien dang nhap khong hop le.");
        }

        String normalizedPaymentMode = VNPayConfig.normalizePaymentMode(paymentMode);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay don dat phong."));

        if (booking.getUser() == null || !currentUserId.equals(booking.getUser().getId())) {
            throw new SecurityException("Ban khong co quyen thanh toan don dat phong nay.");
        }

        bookingService.normalizeBookingFinancials(booking);
        validatePayableBooking(booking, normalizedPaymentMode);

        double bookingAmount = resolveExpectedAmount(booking, normalizedPaymentMode);
        if (bookingAmount <= 0) {
            throw new IllegalArgumentException("Don dat phong khong con so du hop le de thanh toan.");
        }

        if (shouldMarkPendingPayment(booking, normalizedPaymentMode)) {
            booking.setPaymentStatus("pending_payment");
            bookingRepository.save(booking);
        }

        long amount = Math.round(bookingAmount * 100L);
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnpTmnCode.trim());
        params.put("vnp_Amount", String.valueOf(amount));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", VNPayConfig.buildTxnRef(bookingId, normalizedPaymentMode));
        params.put(
                "vnp_OrderInfo",
                "deposit".equals(normalizedPaymentMode)
                        ? "Dat coc booking " + bookingId
                        : "Thanh toan booking " + bookingId
        );
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnpReturnUrl.trim());
        params.put("vnp_IpAddr", VNPayConfig.getIpAddress(request));

        TimeZone timeZone = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
        Calendar calendar = Calendar.getInstance(timeZone);
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(timeZone);
        params.put("vnp_CreateDate", formatter.format(calendar.getTime()));

        calendar.add(Calendar.SECOND, (int) Math.max(0L, pendingHoldSeconds));
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
            confirmPaymentByMode(validation.booking(), validation.paymentMode(), "VNPay");
        }

        String frontendReturnUrl = vnpFrontendReturnUrl.trim();
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(frontendReturnUrl)
                .queryParam("status", validation.success() ? "success" : "error")
                .queryParam("message", validation.message());

        if (validation.bookingId() != null) {
            builder.queryParam("bookingId", validation.bookingId());
        }
        if (validation.paymentMode() != null) {
            builder.queryParam("paymentMode", validation.paymentMode());
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
            confirmPaymentByMode(validation.booking(), validation.paymentMode(), "VNPay");
            return createIpnResponse("00", "Confirm Success");
        }

        return createIpnResponse("00", "Payment Failed");
    }

    private VNPayValidationResult validateCallback(Map<String, String> queryParams) {
        Map<String, String> fields = new HashMap<>(queryParams);
        String secureHash = fields.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank()) {
            return new VNPayValidationResult(false, false, false, null, null, "full", "Thieu chu ky xac thuc tu VNPay.");
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
            return new VNPayValidationResult(false, false, false, null, null, "full", "Chu ky VNPay khong hop le.");
        }

        VNPayConfig.TxnRefData txnRefData = VNPayConfig.parseTxnRef(fields.get("vnp_TxnRef"));
        if (txnRefData == null || txnRefData.bookingId() == null) {
            return new VNPayValidationResult(true, false, false, null, null, "full", "Khong xac dinh duoc booking tu giao dich VNPay.");
        }

        Integer bookingId = Objects.requireNonNull(txnRefData.bookingId());
        String paymentMode = txnRefData.paymentMode();
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            return new VNPayValidationResult(true, false, false, bookingId, null, paymentMode, "Khong tim thay don dat phong tuong ung.");
        }

        bookingService.normalizeBookingFinancials(booking);
        try {
            validatePayableBooking(booking, paymentMode);
        } catch (IllegalArgumentException ex) {
            return new VNPayValidationResult(true, false, true, bookingId, booking, paymentMode, ex.getMessage());
        }

        long expectedAmount = Math.round(resolveExpectedAmount(booking, paymentMode) * 100L);
        boolean amountValid = String.valueOf(expectedAmount).equals(fields.get("vnp_Amount"));
        if (!amountValid) {
            return new VNPayValidationResult(true, false, false, bookingId, booking, paymentMode, "So tien VNPay tra ve khong khop voi booking.");
        }

        String responseCode = fields.get("vnp_ResponseCode");
        String transactionStatus = fields.get("vnp_TransactionStatus");
        boolean paymentSuccess = "00".equals(responseCode) && "00".equals(transactionStatus);

        if (paymentSuccess) {
            return new VNPayValidationResult(
                    true,
                    true,
                    true,
                    bookingId,
                    booking,
                    paymentMode,
                    "deposit".equals(paymentMode)
                            ? "Thanh toan dat coc VNPay thanh cong."
                            : "Thanh toan VNPay thanh cong."
            );
        }

        return new VNPayValidationResult(true, false, true, bookingId, booking, paymentMode, "Thanh toan chua thanh cong hoac da bi huy.");
    }

    private void confirmPaymentByMode(Booking booking, String paymentMode, String paymentMethod) {
        String normalizedPaymentMode = VNPayConfig.normalizePaymentMode(paymentMode);
        if ("deposit".equals(normalizedPaymentMode)) {
            paymentService.confirmBookingDeposit(booking, paymentMethod, true, null);
            return;
        }
        paymentService.confirmBookingPayment(booking, paymentMethod, true, null);
    }

    private double resolveExpectedAmount(Booking booking, String paymentMode) {
        String normalizedPaymentMode = VNPayConfig.normalizePaymentMode(paymentMode);
        if ("deposit".equals(normalizedPaymentMode)) {
            return paymentService.resolveDepositPayableAmount(booking);
        }
        return paymentService.resolvePayableAmount(booking);
    }

    private boolean shouldMarkPendingPayment(Booking booking, String paymentMode) {
        String paymentStatus = booking.getPaymentStatus() == null
                ? ""
                : booking.getPaymentStatus().trim().toLowerCase();
        if ("paid".equals(paymentStatus)) {
            return false;
        }
        if ("deposit".equals(VNPayConfig.normalizePaymentMode(paymentMode))) {
            return !"deposit_paid".equals(paymentStatus);
        }
        return !"deposit_paid".equals(paymentStatus) && !"pending_payment".equals(paymentStatus);
    }

    private void validatePayableBooking(Booking booking, String paymentMode) {
        if ("expired".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Booking nay da het thoi gian giu cho. Vui long tao yeu cau dat phong moi.");
        }
        if ("cancelled".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Booking da bi huy nen khong the tiep tuc thanh toan VNPay.");
        }
        if ("completed".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Booking da hoan thanh nen khong can thanh toan VNPay nua.");
        }
        if (!"pending".equalsIgnoreCase(booking.getStatus()) && !"confirmed".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Chi co the thanh toan VNPay cho booking dang cho xu ly hoac da xac nhan.");
        }
        if ("paid".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new IllegalArgumentException("Booking nay da duoc danh dau da thanh toan.");
        }

        String normalizedPaymentMode = VNPayConfig.normalizePaymentMode(paymentMode);
        if ("deposit".equals(normalizedPaymentMode)) {
            if (paymentService.resolveDepositPayableAmount(booking) <= 0) {
                throw new IllegalArgumentException("Booking nay khong con so tien dat coc hop le.");
            }
            return;
        }

        if (paymentService.resolvePayableAmount(booking) <= 0) {
            throw new IllegalArgumentException("Booking nay khong con so du hop le de thanh toan.");
        }
    }

    private void validateConfiguration() {
        if (vnpTmnCode == null || vnpTmnCode.isBlank()) {
            throw new IllegalArgumentException("Thieu cau hinh VNPay: vnp.tmnCode");
        }
        if (vnpHashSecret == null || vnpHashSecret.isBlank()) {
            throw new IllegalArgumentException("Thieu cau hinh VNPay: vnp.hashSecret");
        }
        if (vnpPayUrl == null || vnpPayUrl.isBlank()) {
            throw new IllegalArgumentException("Thieu cau hinh VNPay: vnp.url");
        }
        if (vnpReturnUrl == null || vnpReturnUrl.isBlank()) {
            throw new IllegalArgumentException("Thieu cau hinh VNPay: vnp.returnUrl");
        }
        if (vnpFrontendReturnUrl == null || vnpFrontendReturnUrl.isBlank()) {
            throw new IllegalArgumentException("Thieu cau hinh VNPay: vnp.frontendReturnUrl");
        }
    }

    private Map<String, String> createIpnResponse(String rspCode, String message) {
        Map<String, String> response = new HashMap<>();
        response.put("RspCode", rspCode);
        response.put("Message", message);
        return response;
    }

    @Transactional
    public Booking confirmDemoPayment(Integer bookingId, Integer currentUserId, String paymentMode) {
        if (bookingId == null) {
            throw new IllegalArgumentException("Thieu booking de xac nhan thanh toan demo.");
        }
        if (currentUserId == null) {
            throw new SecurityException("Phien dang nhap khong hop le.");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay don dat phong."));

        if (booking.getUser() == null || !currentUserId.equals(booking.getUser().getId())) {
            throw new SecurityException("Ban khong co quyen thao tac don dat phong nay.");
        }

        bookingService.normalizeBookingFinancials(booking);
        validatePayableBooking(booking, paymentMode);
        confirmPaymentByMode(booking, paymentMode, "VNPay Demo");
        return booking;
    }

    private record VNPayValidationResult(
            boolean signatureValid,
            boolean paymentSuccess,
            boolean amountValid,
            Integer bookingId,
            Booking booking,
            String paymentMode,
            String message
    ) {
        private boolean success() {
            return signatureValid && paymentSuccess && amountValid;
        }
    }
}
