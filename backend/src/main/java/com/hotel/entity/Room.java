package com.hotel.entity;

import jakarta.persistence.*;
import lombok.Data;



// Class đại diện cho bảng 'rooms' (Danh sách phòng vật lý) trong Database
@Data
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "room_number", nullable = false, unique = true, length = 10)
    private String roomNumber;


    // Thuộc tính nối bảng: 1 Phòng sẽ thuộc 1 Hạng Phòng (Khóa ngoại type_id)
    // Ví dụ: Phòng P101 -> Hạng "Phòng Đôi VIP"
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id")
    private RoomType roomType;

    @Column(name = "status", length = 20)
    private String status = "available";

    // Danh sách thiết bị tiện ích trong phòng này (Tivi, Bồn tắm...)
    // FetchType.EAGER: Lấy phòng lên là phải đính kèm luôn list Thiết bị ra để show lên ngay trên giao diện grid
    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id", insertable = false, updatable = false)
    private java.util.List<RoomItem> roomItems;
}
