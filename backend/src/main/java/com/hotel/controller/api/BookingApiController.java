package com.hotel.controller.api;

import com.hotel.dto.AdminBookingCheckoutRequest;
import com.hotel.dto.AdminBookingUpsertRequest;
import com.hotel.dto.ApiResponse;
import com.hotel.dto.BookRoomRequest;
import com.hotel.dto.BookingPageMeta;
import com.hotel.dto.BookingResponse;
import com.hotel.entity.Booking;
import com.hotel.entity.BookingDetail;
import com.hotel.entity.Room;
import com.hotel.entity.User;
import com.hotel.repository.BookingDetailRepository;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.AuthService;
import com.hotel.service.BookingService;
import com.hotel.service.NotificationService;
import com.hotel.service.PaymentService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class BookingApiController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private BookingDetailRepository bookingDetailRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private AuthService authService;

    @Autowired
    private NotificationService notificationService;
    private static final LocalTime DEFAULT_CHECK_IN_TIME = LocalTime.of(14, 0);
    private static final LocalTime DEFAULT_CHECK_OUT_TIME = LocalTime.of(12, 0);
    private static final LocalTime FILTER_START_TIME = LocalTime.of(0, 0);
    private static final LocalTime FILTER_END_TIME = LocalTime.of(23, 59);
    private static final int DEFAULT_PAGE_SIZE = 5;
    private static final int MAX_PAGE_SIZE = 100;

    private User getSessionUser(HttpSession session) {
        Object userObj = session.getAttribute("user");
        return userObj instanceof User ? (User) userObj : null;
    }

    private <T> ResponseEntity<ApiResponse<T>> authRequiredResponse() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Vui lòng đăng nhập để tiếp tục."));
    }

    private <T> ResponseEntity<ApiResponse<T>> forbiddenResponse(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(message));
    }

    private <T> ResponseEntity<ApiResponse<T>> badRequestResponse(String message) {
        return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }

    private <T> ResponseEntity<ApiResponse<T>> notFoundResponse(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(message));
    }

    private <T> ResponseEntity<ApiResponse<T>> methodNotAllowedResponse(String message) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(ApiResponse.error(message));
    }

    private <T> ResponseEntity<ApiResponse<T>> requireBackofficeAccess(HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }
        if (!authService.isBackoffice(currentUser)) {
            return forbiddenResponse("Bạn không có quyền xử lý nghiệp vụ booking quản trị.");
        }
        return null;
    }

    private <T> ResponseEntity<ApiResponse<T>> requireAdminBookingEditor(HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }
        if (!authService.isAdmin(currentUser)) {
            return forbiddenResponse("Nhân viên chỉ được xử lý vận hành booking, không được tạo hoặc sửa booking.");
        }
        return null;
    }

    private LocalDateTime parseDate(String dateStr, LocalTime defaultTime, String label) {
        if (dateStr == null || dateStr.isBlank()) {
            throw new IllegalArgumentException(label + " không được để trống.");
        }

        String normalized = dateStr.trim();
        try {
            if (normalized.length() == 10) {
                return LocalDate.parse(normalized).atTime(defaultTime);
            }
            if (normalized.contains(" ")) {
                normalized = normalized.replace(" ", "T");
            }
            return LocalDateTime.parse(normalized);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(label + " không hợp lệ.");
        }
    }

    private LocalDateTime parseCheckInDate(String dateStr) {
        return parseDate(dateStr, DEFAULT_CHECK_IN_TIME, "Ngày nhận phòng");
    }

    private LocalDateTime parseCheckOutDate(String dateStr) {
        return parseDate(dateStr, DEFAULT_CHECK_OUT_TIME, "Ngày trả phòng");
    }

    private LocalDateTime parseFilterDate(String dateStr, boolean inclusiveEnd) {
        return parseDate(dateStr, inclusiveEnd ? FILTER_END_TIME : FILTER_START_TIME, "Khoảng thời gian lọc");
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeStatusFilter(String status) {
        String normalized = normalizeText(status);
        return normalized == null ? null : normalized.toLowerCase();
    }

    private int normalizePage(int page) {
        return Math.max(1, page);
    }

    private int normalizePageSize(int pageSize) {
        return Math.max(1, Math.min(pageSize, MAX_PAGE_SIZE));
    }

    private BookingPageMeta buildPageMeta(Page<?> page, int pageSize, Map<String, Long> statusSummary) {
        int totalPages = Math.max(1, page.getTotalPages());
        int currentPage = Math.min(Math.max(1, page.getNumber() + 1), totalPages);
        return new BookingPageMeta(
                currentPage,
                pageSize,
                totalPages,
                page.getTotalElements(),
                statusSummary
        );
    }

    private BookingPageMeta buildPageMeta(int currentPage,
                                          int pageSize,
                                          long totalElements,
                                          int totalPages,
                                          Map<String, Long> statusSummary) {
        int normalizedTotalPages = Math.max(1, totalPages);
        int normalizedCurrentPage = Math.min(Math.max(1, currentPage), normalizedTotalPages);
        return new BookingPageMeta(
                normalizedCurrentPage,
                pageSize,
                normalizedTotalPages,
                totalElements,
                statusSummary
        );
    }

    private BookingResponse reloadBookingResponse(Integer bookingId) {
        if (bookingId == null) {
            return null;
        }
        return bookingRepository.findById(bookingId)
                .map(bookingService::normalizeBookingFinancials)
                .map(BookingResponse::from)
                .orElse(null);
    }

    private String buildBookingCreatedMessage(String paymentFlow) {
        if ("vnpay".equalsIgnoreCase(paymentFlow) || "vnpay_demo".equalsIgnoreCase(paymentFlow)) {
            return "Đã tạo booking giữ chỗ chờ thanh toán VNPay demo. Giữ chỗ có hiệu lực trong "
                    + bookingService.getPendingHoldDisplayText() + ".";
        }
        return "Đã tạo booking giữ chỗ. Phòng sẽ được giữ trong "
                + bookingService.getPendingHoldDisplayText() + " để chờ khách sạn xác nhận.";
    }

    private Page<Booking> findAdminBookingsPage(String status,
                                                LocalDateTime fromDateTime,
                                                LocalDateTime toDateTime,
                                                int page,
                                                int pageSize) {
        int safePage = normalizePage(page);
        Page<Booking> bookingPage = bookingRepository.findAdminBookingsByFilters(
                status,
                fromDateTime,
                toDateTime,
                PageRequest.of(safePage - 1, pageSize)
        );

        if (bookingPage.getTotalPages() > 0 && safePage > bookingPage.getTotalPages()) {
            return bookingRepository.findAdminBookingsByFilters(
                    status,
                    fromDateTime,
                    toDateTime,
                    PageRequest.of(bookingPage.getTotalPages() - 1, pageSize)
            );
        }

        return bookingPage;
    }

    @PostMapping("/bookings")
    public ResponseEntity<ApiResponse<BookingResponse>> bookRoom(@Valid @RequestBody BookRoomRequest request,
                                                                 HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }

        try {
            String paymentFlow = normalizeText(request.paymentFlow());
            String couponCode = normalizeText(request.couponCode());
            LocalDateTime checkIn = parseCheckInDate(request.checkIn());
            LocalDateTime checkOut = parseCheckOutDate(request.checkOut());

            Booking createdBooking = bookingService.createBooking(
                    currentUser,
                    request.roomId(),
                    checkIn,
                    checkOut,
                    paymentFlow,
                    couponCode
            );

            return ResponseEntity.ok(ApiResponse.ok(
                    buildBookingCreatedMessage(paymentFlow),
                    reloadBookingResponse(createdBooking.getId())
            ));
        } catch (IllegalArgumentException ex) {
            return badRequestResponse(ex.getMessage());
        }
    }

    @GetMapping("/bookings/history")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getHistory(
            @RequestParam(value = "status", defaultValue = "") String status,
            @RequestParam(value = "page", defaultValue = "1") int page,
            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }

        Page<Booking> historyPage = bookingService.getHistory(
                currentUser.getId(),
                normalizeStatusFilter(status),
                page
        );
        List<BookingResponse> bookings = BookingResponse.fromList(
                bookingService.normalizeBookingFinancials(historyPage.getContent())
        );
        Map<String, Long> statusSummary = bookingService.countHistoryStatuses(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(
                bookings,
                buildPageMeta(historyPage, historyPage.getSize(), statusSummary)
        ));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingDetail(@PathVariable("id") @NonNull Integer id,
                                                                         HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }

        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return notFoundResponse("Không tìm thấy đơn đặt phòng.");
        }

        Booking booking = bookingOpt.get();
        if (booking.getUser() == null || !currentUser.getId().equals(booking.getUser().getId())) {
            return forbiddenResponse("Bạn không có quyền xem đơn đặt phòng này.");
        }

        return ResponseEntity.ok(ApiResponse.ok(
                BookingResponse.from(bookingService.normalizeBookingFinancials(booking))
        ));
    }

    @PostMapping("/bookings/{id}/deposit")
    public ResponseEntity<ApiResponse<BookingResponse>> collectDepositPayment(@PathVariable("id") @NonNull Integer id,
                                                                              HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }

        try {
            Booking booking = paymentService.collectDepositPayment(id, currentUser.getId());
            return ResponseEntity.ok(ApiResponse.ok(
                    "Đã ghi nhận đặt cọc 30% và xác nhận booking.",
                    reloadBookingResponse(booking.getId())
            ));
        } catch (SecurityException ex) {
            return forbiddenResponse(ex.getMessage());
        } catch (IllegalArgumentException ex) {
            return badRequestResponse(ex.getMessage());
        }
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(@PathVariable("id") @NonNull Integer id,
                                                                      HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }

        try {
            bookingService.cancelBooking(id, currentUser.getId());
            return ResponseEntity.ok(ApiResponse.ok(
                    "Hủy phòng thành công",
                    reloadBookingResponse(id)
            ));
        } catch (SecurityException ex) {
            return forbiddenResponse(ex.getMessage());
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return badRequestResponse(ex.getMessage());
        }
    }

    @GetMapping("/admin/bookings")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> listAdminBookings(
            @RequestParam(value = "status", defaultValue = "") String status,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "pageSize", defaultValue = "" + DEFAULT_PAGE_SIZE) int pageSize,
            @RequestParam(value = "bookingId", required = false) Integer bookingId,
            @RequestParam(value = "fromDateTime", required = false) String fromDateTime,
            @RequestParam(value = "toDateTime", required = false) String toDateTime,
            HttpSession session) {
        ResponseEntity<ApiResponse<List<BookingResponse>>> authError = requireBackofficeAccess(session);
        if (authError != null) {
            return authError;
        }

        int safePageSize = normalizePageSize(pageSize);
        if (bookingId != null) {
            Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
            List<BookingResponse> bookings = bookingOpt
                    .map(booking -> List.of(BookingResponse.from(bookingService.normalizeBookingFinancials(booking))))
                    .orElseGet(List::of);
            return ResponseEntity.ok(ApiResponse.ok(
                    bookings,
                    buildPageMeta(1, safePageSize, bookings.size(), 1, null)
            ));
        }

        boolean hasFromFilter = normalizeText(fromDateTime) != null;
        boolean hasToFilter = normalizeText(toDateTime) != null;
        if (hasFromFilter != hasToFilter) {
            return badRequestResponse("Cần truyền đủ fromDateTime và toDateTime để lọc booking.");
        }

        LocalDateTime from = null;
        LocalDateTime to = null;
        if (hasFromFilter) {
            from = parseFilterDate(fromDateTime, false);
            to = parseFilterDate(toDateTime, true);
            if (!to.isAfter(from)) {
                return badRequestResponse("Khoảng thời gian lọc booking không hợp lệ.");
            }
        }

        Page<Booking> bookingPage = findAdminBookingsPage(
                normalizeStatusFilter(status),
                from,
                to,
                page,
                safePageSize
        );

        List<BookingResponse> bookings = BookingResponse.fromList(
                bookingService.normalizeBookingFinancials(bookingPage.getContent())
        );
        return ResponseEntity.ok(ApiResponse.ok(
                bookings,
                buildPageMeta(bookingPage, safePageSize, null)
        ));
    }

    @PostMapping("/admin/bookings")
    public ResponseEntity<ApiResponse<BookingResponse>> saveAdminBooking(
            @Valid @RequestBody AdminBookingUpsertRequest request,
            HttpSession session) {
        ResponseEntity<ApiResponse<BookingResponse>> authError = requireAdminBookingEditor(session);
        if (authError != null) {
            return authError;
        }

        try {
            LocalDateTime checkIn = parseCheckInDate(request.checkIn());
            LocalDateTime checkOut = parseCheckOutDate(request.checkOut());
            String requestedStatus = normalizeText(request.status());
            Integer roomId = Objects.requireNonNull(request.roomId());

            Optional<Room> roomOpt = roomRepository.findById(roomId);
            if (roomOpt.isEmpty()) {
                return badRequestResponse("Phòng không tồn tại");
            }

            Room room = roomOpt.get();
            double pricePerNight = room.getRoomType().getPricePerNight();
            Map<String, Double> priceInfo = bookingService.calculateBookingPriceAdmin(checkIn, checkOut, pricePerNight);
            double totalHours = priceInfo.get("hours");
            double totalPrice = priceInfo.get("total");
            LocalDateTime now = LocalDateTime.now();
            Integer bookingId = request.id();

            if (bookingId != null) {
                Optional<Booking> existingOpt = bookingRepository.findById(bookingId);
                if (existingOpt.isEmpty()) {
                    return badRequestResponse("Không tìm thấy đơn đặt phòng.");
                }
                
                Booking existing = existingOpt.get();
                bookingService.normalizeBookingFinancials(existing);
                String previousStatus = existing.getStatus();
                String nextStatus = bookingService.validateAdminEditableStatus(previousStatus, requestedStatus);
                long overlapCount = bookingRepository.countOverlappingBookingsExcept(
                        roomId,
                        checkIn,
                        checkOut,
                        bookingId,
                        now
                );
                if (overlapCount > 0
                        && !"cancelled".equalsIgnoreCase(nextStatus)
                        && !"expired".equalsIgnoreCase(nextStatus)
                        && !"refused".equalsIgnoreCase(nextStatus)) {
                    return badRequestResponse("Xung đột lịch! Đã có đơn đặt phòng khác được duyệt trong thời gian này.");
                }

                existing.setTotalPrice(totalPrice);
                existing.setFinalAmount(Math.max(0.0, totalPrice - (existing.getDiscountAmount() == null ? 0.0 : existing.getDiscountAmount())));
                existing.setStatus(nextStatus);
                existing.setPaymentStatus(bookingService.normalizeAdminPaymentStatus(existing.getPaymentStatus(), nextStatus));
                bookingService.preparePendingBooking(existing, previousStatus);
                bookingRepository.save(existing);
                
                if (existing.getDetails() != null && !existing.getDetails().isEmpty()) {
                    BookingDetail detail = existing.getDetails().get(0);
                    detail.setCheckIn(checkIn);
                    detail.setCheckOut(checkOut);
                    detail.setTotalHours(totalHours);
                    detail.setRoom(room);
                    bookingDetailRepository.save(detail);
                }

            } else {
                Integer userId = Objects.requireNonNull(request.userId());
                User user = userRepository.findById(userId).orElse(null);
                if (user == null) {
                    return badRequestResponse("Khách hàng không tồn tại!");
                }

                String initialStatus = bookingService.validateAdminCreateStatus(requestedStatus);
                long overlapCount = bookingRepository.countOverlappingBookings(roomId, checkIn, checkOut, now);
                if (overlapCount > 0
                        && !"cancelled".equalsIgnoreCase(initialStatus)
                        && !"expired".equalsIgnoreCase(initialStatus)
                        && !"refused".equalsIgnoreCase(initialStatus)) {
                    return badRequestResponse("Xung đột lịch! Đã có đơn đặt phòng khác được duyệt trong thời gian này.");
                }

                Booking booking = new Booking();
                booking.setUser(user);
                booking.setStatus(initialStatus);
                booking.setPaymentStatus(bookingService.normalizeAdminPaymentStatus(null, initialStatus));
                booking.setTotalPrice(totalPrice);
                booking.setFinalAmount(totalPrice);
                bookingService.preparePendingBooking(booking, null);
                booking = bookingRepository.save(booking);
                bookingId = booking.getId();
                
                BookingDetail detail = new BookingDetail();
                detail.setBooking(booking);
                detail.setRoom(room);
                detail.setPriceAtBooking(pricePerNight);
                detail.setCheckIn(checkIn);
                detail.setCheckOut(checkOut);
                detail.setTotalHours(totalHours);
                bookingDetailRepository.save(detail);
            }

            return ResponseEntity.ok(ApiResponse.ok(
                    "Đã lưu đơn đặt phòng.",
                    reloadBookingResponse(bookingId)
            ));
        } catch (IllegalArgumentException ex) {
            return badRequestResponse(ex.getMessage());
        }
    }

    @PostMapping("/admin/bookings/{id}/checkout")
    public ResponseEntity<ApiResponse<BookingResponse>> checkoutAdmin(
            @PathVariable("id") @NonNull Integer id,
            @Valid @RequestBody AdminBookingCheckoutRequest request,
            HttpSession session) {
        ResponseEntity<ApiResponse<BookingResponse>> authError = requireBackofficeAccess(session);
        if (authError != null) {
            return authError;
        }
        
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return badRequestResponse("Đơn không tồn tại.");
        }

        Booking booking = bookingOpt.get();
        if (booking.getDetails() == null || booking.getDetails().isEmpty()) {
            return badRequestResponse("Đơn lưu trú không có phòng.");
        }
        
        BookingDetail detail = booking.getDetails().get(0);
        if (!"confirmed".equalsIgnoreCase(booking.getStatus())) {
            return badRequestResponse("Chỉ có thể trả phòng cho đơn đã xác nhận.");
        }
        if (detail.getCheckInActual() == null) {
            return badRequestResponse("Khách chưa nhận phòng. Hãy check-in trước khi checkout.");
        }
        if (detail.getCheckOutActual() != null) {
            return badRequestResponse("Đơn này đã được checkout trước đó.");
        }
        if (!"paid".equalsIgnoreCase(booking.getPaymentStatus())) {
            return badRequestResponse("Chỉ có thể checkout booking đã thanh toán. Hãy thu tiền trước khi checkout.");
        }

        if ("recalc".equals(request.checkoutType())) {
            LocalDateTime now = LocalDateTime.now();
            double pricePerNight = detail.getPriceAtBooking();
            LocalDateTime actualStayStart = detail.getCheckInActual() != null ? detail.getCheckInActual() : detail.getCheckIn();
            Map<String, Double> priceInfo = bookingService.calculateBookingPriceAdmin(actualStayStart, now, pricePerNight);

            detail.setCheckOutActual(now);
            detail.setTotalHours(priceInfo.get("hours"));
            bookingDetailRepository.save(detail);
            
            booking.setTotalPrice(priceInfo.get("total"));
            booking.setFinalAmount(Math.max(0.0, priceInfo.get("total") - (booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount())));
            booking.setStatus("completed");
        } else {
            detail.setCheckOutActual(LocalDateTime.now());
            bookingDetailRepository.save(detail);
            booking.setStatus("completed");
            booking.setFinalAmount(Math.max(0.0, (booking.getTotalPrice() != null ? booking.getTotalPrice() : 0.0) - (booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount())));
        }
        bookingRepository.save(booking);

        if (booking.getUser() != null) {
            notificationService.sendReviewPrompt(booking);
        }

        return ResponseEntity.ok(ApiResponse.ok(
                "Checkout đơn đặt phòng thành công.",
                reloadBookingResponse(booking.getId())
        ));
    }

    @PostMapping("/admin/bookings/{id}/checkin")
    public ResponseEntity<ApiResponse<BookingResponse>> checkInAdmin(@PathVariable("id") @NonNull Integer id,
                                                                     HttpSession session) {
        ResponseEntity<ApiResponse<BookingResponse>> authError = requireBackofficeAccess(session);
        if (authError != null) {
            return authError;
        }

        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return badRequestResponse("Đơn không tồn tại.");
        }

        Booking booking = bookingOpt.get();
        if (!"confirmed".equalsIgnoreCase(booking.getStatus())) {
            return badRequestResponse("Chỉ có thể nhận phòng cho đơn đã xác nhận.");
        }
        if (booking.getDetails() == null || booking.getDetails().isEmpty()) {
            return badRequestResponse("Đơn lưu trú không có phòng.");
        }

        BookingDetail detail = booking.getDetails().get(0);
        if (detail.getCheckInActual() != null && detail.getCheckOutActual() == null) {
            return badRequestResponse("Khách đã nhận phòng rồi.");
        }
        if (detail.getCheckOutActual() != null) {
            return badRequestResponse("Đơn này đã checkout, không thể check-in lại.");
        }

        LocalDateTime now = LocalDateTime.now();
        try {
            bookingService.validateAdminCheckInTime(detail, now);
        } catch (IllegalArgumentException ex) {
            return badRequestResponse(ex.getMessage());
        }

        if (detail.getRoom() != null && "maintenance".equalsIgnoreCase(detail.getRoom().getStatus())) {
            return badRequestResponse("Phòng đang ở trạng thái bảo trì, không thể check-in.");
        }

        detail.setCheckInActual(now);
        detail.setCheckOutActual(null);
        bookingDetailRepository.save(detail);

        return ResponseEntity.ok(ApiResponse.ok(
                "Đã nhận phòng thành công.",
                reloadBookingResponse(booking.getId())
        ));
    }

    @PostMapping("/admin/bookings/{id}/approve")
    public ResponseEntity<ApiResponse<BookingResponse>> approveAdminBooking(@PathVariable("id") @NonNull Integer id,
                                                                            HttpSession session) {
        ResponseEntity<ApiResponse<BookingResponse>> authError = requireBackofficeAccess(session);
        if (authError != null) {
            return authError;
        }

        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return badRequestResponse("Đơn không tồn tại.");
        }
        Booking booking = bookingOpt.get();
        bookingService.normalizeBookingFinancials(booking);
        if (!"pending".equalsIgnoreCase(booking.getStatus())) {
            if ("expired".equalsIgnoreCase(booking.getStatus())) {
                return badRequestResponse("Đơn này đã hết hạn giữ chỗ nên không thể duyệt nữa.");
            }
            if ("cancelled".equalsIgnoreCase(booking.getStatus())) {
                return badRequestResponse("Đơn này đã bị hủy nên không thể duyệt.");
            }
            if ("confirmed".equalsIgnoreCase(booking.getStatus())) {
                return badRequestResponse("Đơn này đã được duyệt trước đó.");
            }
            if ("completed".equalsIgnoreCase(booking.getStatus())) {
                return badRequestResponse("Đơn này đã hoàn thành nên không thể duyệt lại.");
            }
            return badRequestResponse("Chỉ có thể duyệt đơn đang chờ.");
        }
        booking.setStatus("confirmed");
        booking.setPaymentStatus(bookingService.normalizeAdminPaymentStatus(booking.getPaymentStatus(), "confirmed"));
        bookingRepository.save(booking);
        return ResponseEntity.ok(ApiResponse.ok(
                "Đã duyệt đơn phòng.",
                reloadBookingResponse(booking.getId())
        ));
    }

    @PostMapping("/admin/bookings/{id}/collect-cash-payment")
    public ResponseEntity<ApiResponse<BookingResponse>> collectCashPayment(@PathVariable("id") @NonNull Integer id,
                                                                           HttpSession session) {
        ResponseEntity<ApiResponse<BookingResponse>> authError = requireBackofficeAccess(session);
        if (authError != null) {
            return authError;
        }

        try {
            Booking booking = paymentService.collectCashPayment(id);
            return ResponseEntity.ok(ApiResponse.ok(
                    "Đã ghi nhận thanh toán tiền mặt.",
                    reloadBookingResponse(booking.getId())
            ));
        } catch (IllegalArgumentException ex) {
            return badRequestResponse(ex.getMessage());
        }
    }

    @DeleteMapping("/admin/bookings/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAdminBooking(@PathVariable("id") @NonNull Integer id,
                                                                HttpSession session) {
        ResponseEntity<ApiResponse<Void>> authError = requireBackofficeAccess(session);
        if (authError != null) {
            return authError;
        }

        if (bookingRepository.findById(id).isEmpty()) {
            return notFoundResponse("Không tìm thấy đơn đặt phòng.");
        }

        return methodNotAllowedResponse("GOAT HOTEL không hỗ trợ xóa cứng booking. Hãy giữ đơn ở trạng thái cancelled để lưu lịch sử.");
    }
}
