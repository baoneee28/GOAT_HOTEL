package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
@Data
@Entity
@Table(name = "room_type_items")
@IdClass(RoomTypeItem.RoomTypeItemId.class)
public class RoomTypeItem {
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("items")
    private RoomType roomType;

    @Id
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id")
    private Item item;

    @Data
    public static class RoomTypeItemId implements Serializable {
        private Integer roomType;
        private Integer item;
    }
}
