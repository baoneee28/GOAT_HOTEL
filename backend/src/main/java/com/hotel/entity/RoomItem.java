package com.hotel.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;



// Bảng CẦU NỐI (Join Table) giữa bảng rooms (Phòng) và bảng items (Tiện ích)
// Do 1 phòng có THỂ có nhiều tiện ích, và 1 tiện ích CÓ THỂ nằm ở nhiều phòng (Quan hệ Nhiều - Nhiều / Many-to-Many)
@Data
@Entity
@Table(name = "room_items")
@IdClass(RoomItem.RoomItemId.class) // Đánh dấu bảng này dùng khóa chính KÉP (Gồm cả 2 ID gom lại gánh team)
public class RoomItem {

    // Khóa ngoại trỏ sang bảng rooms
    @Id
    @Column(name = "room_id")
    private Integer roomId;

    // Khóa ngoại trỏ sang bảng items
    @Id
    @Column(name = "item_id")
    private Integer itemId;

    // Do dùng 2 cột làm @Id nên JPA bắt buộc phải chế ra 1 Class phụ implements Serializable để bọc 2 khóa này lại
    @Data
    public static class RoomItemId implements Serializable {
        private Integer roomId;
        private Integer itemId;
    }
}
