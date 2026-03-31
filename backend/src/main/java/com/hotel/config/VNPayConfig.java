package com.hotel.config;

import jakarta.servlet.http.HttpServletRequest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Random;

public class VNPayConfig {

    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException();
            }

            Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);

            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder builder = new StringBuilder(result.length * 2);
            for (byte b : result) {
                builder.append(String.format("%02x", b & 0xff));
            }
            return builder.toString();
        } catch (Exception ex) {
            return "";
        }
    }

    public static String getIpAddress(HttpServletRequest request) {
        String ipAddress;
        try {
            ipAddress = request.getHeader("X-FORWARDED-FOR");
            if (ipAddress == null || ipAddress.isBlank()) {
                ipAddress = request.getRemoteAddr();
            }
            if (ipAddress != null && ipAddress.contains(",")) {
                ipAddress = ipAddress.split(",")[0].trim();
            }
            if ("0:0:0:0:0:0:0:1".equals(ipAddress) || "::1".equals(ipAddress)) {
                return "127.0.0.1";
            }
            return ipAddress;
        } catch (Exception ex) {
            return "127.0.0.1";
        }
    }

    public static String getRandomNumber(int len) {
        Random random = new Random();
        String chars = "0123456789";
        StringBuilder builder = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            builder.append(chars.charAt(random.nextInt(chars.length())));
        }
        return builder.toString();
    }

    public static String buildTxnRef(Integer bookingId) {
        return "B" + bookingId + "R" + getRandomNumber(8);
    }

    public static Integer extractBookingId(String txnRef) {
        if (txnRef == null || !txnRef.startsWith("B")) {
            return null;
        }

        int separatorIndex = txnRef.indexOf('R', 1);
        if (separatorIndex <= 1) {
            return null;
        }

        try {
            return Integer.parseInt(txnRef.substring(1, separatorIndex));
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
