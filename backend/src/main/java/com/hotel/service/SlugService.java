package com.hotel.service;

import org.springframework.stereotype.Service;


// Service tiện ích chuyên dùng để biến chuỗi tiếng Việt có dấu thành dạng không dấu cách ngang (Slug)
// Ví dụ: "Khách Sạn Huyền" -> "khach-san-huyen" (Dùng làm URL cho chuẩn SEO)
@Service
public class SlugService {

    // Hàm nhận vào chuỗi nguyên thủy và trả ra chuỗi đã Slug hóa
    public String createSlug(String input) {
        if (input == null) return "";
        // Cắt khoảng trắng 2 đầu và đưa hết về chữ thường
        String str = input.trim().toLowerCase();

        // 1. Phá bỏ toàn bộ dấu Tiếng Việt (chuyển ă â -> a, ô ơ -> o...)        str = str.replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a");
        str = str.replaceAll("[èéẹẻẽêềếệểễ]", "e");
        str = str.replaceAll("[ìíịỉĩ]", "i");
        str = str.replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o");
        str = str.replaceAll("[ùúụủũưừứựửữ]", "u");
        str = str.replaceAll("[ỳýỵỷỹ]", "y");
        str = str.replaceAll("[đ]", "d");
        str = str.replaceAll("[đ]", "d");

        // 2. Dùng Regex xóa sổ tất cả các ký tự đặc biệt (!@#$%^&*), CHỈ GIỮ LẠI chữ cái, số, dấu trừ và khoảng trắng
        str = str.replaceAll("[^a-z0-9\\-\\s]", "");

        // 3. Biến tất cả khoảng trắng (dù 1 hay nhiều dấu cách liên tiếp) thành 1 dấu gạch ngang duy nhất "-"        str = str.replaceAll("\\s+", "-");

        return str;
    }
}
