package com.hotel.dto;

import com.hotel.entity.Booking;
import com.hotel.entity.BookingDetail;
import com.hotel.entity.Room;
import com.hotel.entity.RoomType;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

public record BookingResponse(
        Integer id,
        UserResponse user,
        Double totalPrice,
        String couponCode,
        Double discountAmount,
        Double depositAmount,
        Double finalAmount,
        String status,
        String paymentStatus,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        String pendingHoldDisplayText,
        List<BookingDetailResponse> details,
        Double paidAmount,
        Double remainingAmount,
        Double depositOutstandingAmount
) {

    public static BookingResponse from(Booking booking) {
        if (booking == null) {
            return null;
        }

        double totalPrice = booking.getTotalPrice() == null ? 0.0 : booking.getTotalPrice();
        double discountAmount = booking.getDiscountAmount() == null ? 0.0 : booking.getDiscountAmount();
        double finalAmount = booking.getFinalAmount() != null
                ? booking.getFinalAmount()
                : Math.max(0.0, totalPrice - discountAmount);
        double depositAmount = booking.getDepositAmount() == null ? 0.0 : booking.getDepositAmount();
        double paidAmount = resolvePaidAmount(booking, finalAmount, depositAmount);
        double remainingAmount = resolveRemainingAmount(booking, finalAmount, paidAmount);
        double depositOutstandingAmount = resolveDepositOutstandingAmount(booking, depositAmount, paidAmount);

        return new BookingResponse(
                booking.getId(),
                UserResponse.from(booking.getUser()),
                totalPrice,
                booking.getCouponCode(),
                discountAmount,
                depositAmount,
                finalAmount,
                booking.getStatus(),
                booking.getPaymentStatus(),
                booking.getCreatedAt(),
                booking.getExpiresAt(),
                resolvePendingHoldDisplayText(booking),
                BookingDetailResponse.fromList(booking.getDetails()),
                paidAmount,
                remainingAmount,
                depositOutstandingAmount
        );
    }

    public static List<BookingResponse> fromList(List<Booking> bookings) {
        if (bookings == null || bookings.isEmpty()) {
            return List.of();
        }

        return bookings.stream()
                .map(BookingResponse::from)
                .toList();
    }

    private static double resolvePaidAmount(Booking booking, double finalAmount, double depositAmount) {
        if (booking.getPaidAmount() != null && booking.getPaidAmount() > 0.01) {
            return booking.getPaidAmount();
        }

        String paymentStatus = booking.getPaymentStatus() == null ? "" : booking.getPaymentStatus().trim().toLowerCase();
        return switch (paymentStatus) {
            case "paid" -> finalAmount;
            case "deposit_paid" -> Math.min(depositAmount, finalAmount);
            default -> 0.0;
        };
    }

    private static double resolveRemainingAmount(Booking booking, double finalAmount, double paidAmount) {
        if (booking.getRemainingAmount() != null && booking.getRemainingAmount() > 0.01) {
            return booking.getRemainingAmount();
        }
        return Math.max(0.0, finalAmount - paidAmount);
    }

    private static double resolveDepositOutstandingAmount(Booking booking, double depositAmount, double paidAmount) {
        if (booking.getDepositOutstandingAmount() != null && booking.getDepositOutstandingAmount() > 0.01) {
            return booking.getDepositOutstandingAmount();
        }
        return Math.max(0.0, depositAmount - paidAmount);
    }

    private static String resolvePendingHoldDisplayText(Booking booking) {
        if (booking == null || booking.getCreatedAt() == null || booking.getExpiresAt() == null) {
            return null;
        }

        long totalSeconds = Duration.between(booking.getCreatedAt(), booking.getExpiresAt()).getSeconds();
        if (totalSeconds <= 0) {
            return null;
        }

        if (totalSeconds < 60) {
            return totalSeconds + " giây";
        }

        if (totalSeconds % 60 == 0) {
            return (totalSeconds / 60) + " phút";
        }

        long minutes = totalSeconds / 60;
        long seconds = totalSeconds % 60;
        return minutes + " phút " + seconds + " giây";
    }

    public record BookingDetailResponse(
            Integer id,
            RoomResponse room,
            Double priceAtBooking,
            LocalDateTime checkIn,
            LocalDateTime checkOut,
            LocalDateTime checkInActual,
            LocalDateTime checkOutActual,
            Integer guestCount,
            Double totalHours
    ) {

        public static BookingDetailResponse from(BookingDetail detail) {
            if (detail == null) {
                return null;
            }

            return new BookingDetailResponse(
                    detail.getId(),
                    RoomResponse.from(detail.getRoom()),
                    detail.getPriceAtBooking(),
                    detail.getCheckIn(),
                    detail.getCheckOut(),
                    detail.getCheckInActual(),
                    detail.getCheckOutActual(),
                    detail.getGuestCount(),
                    detail.getTotalHours()
            );
        }

        public static List<BookingDetailResponse> fromList(List<BookingDetail> details) {
            if (details == null || details.isEmpty()) {
                return List.of();
            }

            return details.stream()
                    .filter(Objects::nonNull)
                    .map(BookingDetailResponse::from)
                    .toList();
        }
    }

    public record RoomResponse(
            Integer id,
            String roomNumber,
            String status,
            String effectiveStatus,
            Integer relatedBookingId,
            String effectiveStatusReason,
            RoomTypeResponse roomType
    ) {

        public static RoomResponse from(Room room) {
            if (room == null) {
                return null;
            }

            return new RoomResponse(
                    room.getId(),
                    room.getRoomNumber(),
                    room.getStatus(),
                    room.getEffectiveStatus(),
                    room.getRelatedBookingId(),
                    room.getEffectiveStatusReason(),
                    RoomTypeResponse.from(room.getRoomType())
            );
        }
    }

    public record RoomTypeResponse(
            Integer id,
            String typeName,
            Double pricePerNight,
            Integer capacity,
            String size,
            String beds,
            String view,
            String description,
            String image
    ) {

        public static RoomTypeResponse from(RoomType roomType) {
            if (roomType == null) {
                return null;
            }

            return new RoomTypeResponse(
                    roomType.getId(),
                    roomType.getTypeName(),
                    roomType.getPricePerNight(),
                    roomType.getCapacity(),
                    roomType.getSize(),
                    roomType.getBeds(),
                    roomType.getView(),
                    roomType.getDescription(),
                    roomType.getImage()
            );
        }
    }
}
