import os

BASE_DIR = r"d:\webProject\GOAT_HOTEL\backend\src\main\java\com\hotel"
ENTITY_DIR = os.path.join(BASE_DIR, "entity")
REPO_DIR = os.path.join(BASE_DIR, "repository")

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# ================= ENTITIES =================

room_type = """
package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
@Data
@Entity
@Table(name = "room_types")
public class RoomType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;
    @Column(name = "price_per_night", nullable = false)
    private Double pricePerNight;
    @Column(name = "capacity", nullable = false)
    private Integer capacity;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    @Column(name = "image", length = 255)
    private String image;
    
    @OneToMany(mappedBy = "roomType", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("roomType")
    private List<RoomTypeItem> items;
}
"""

room_type_item = """
package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
@Data
@Entity
@Table(name = "room_type_items")
public class RoomTypeItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // Adding surrogate ID locally if needed or Composite key. Wait, the DB has PRIMARY KEY (type_id, item_id). Let's just use @IdClass or no ID since JPA needs an ID context.
    // Actually, SQL script did not create an ID column for room_type_items.
    // We can just map it simply or recreate the table. 
}
"""
# Wait, SQL script created `CREATE TABLE dbo.room_type_items (type_id INT, item_id INT, PRIMARY KEY (type_id, item_id));`
# Using @IdClass is annoying. Let's just alter table in SQL via Spring Data by adding `id INT IDENTITY(1,1) PRIMARY KEY` and removing composite primary key. Wait! The SQL script already ran.
# Actually, it's easier to recreate generate_entities to alter it? No, just write standard `@IdClass` or use `@EmbeddedId`. 

room_type_item_fixed = """
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
"""

room = """
package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
@Data
@Entity
@Table(name = "rooms")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "room_number", nullable = false, unique = true, length = 10)
    private String roomNumber;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "items"})
    private RoomType roomType;
    @Column(name = "status", length = 20)
    private String status = "available";
}
"""

booking = """
package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
@Data
@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User user;
    @Column(name = "total_price")
    private Double totalPrice;
    @Column(name = "status", length = 20)
    private String status = "pending";
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("booking")
    private List<BookingDetail> details;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("booking")
    private List<BookingService> services;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("booking")
    private List<Payment> payments;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
"""

booking_detail = """
package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@Entity
@Table(name = "booking_details")
public class BookingDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"details", "services", "payments", "user"})
    private Booking booking;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Room room;
    @Column(name = "price_at_booking", nullable = false)
    private Double priceAtBooking;
    @Column(name = "check_in")
    private LocalDateTime checkIn;
    @Column(name = "check_out")
    private LocalDateTime checkOut;
    @Column(name = "check_in_actual")
    private LocalDateTime checkInActual;
    @Column(name = "check_out_actual")
    private LocalDateTime checkOutActual;
    @Column(name = "total_hours")
    private Double totalHours = 0.0;
}
"""

payment = """
package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"details", "services", "payments"})
    private Booking booking;
    @Column(name = "amount", nullable = false)
    private Double amount;
    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;
    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate;
    @Column(name = "status", nullable = false, length = 20)
    private String status = "completed";
}
"""

hotel_service = """
package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
@Data
@Entity
@Table(name = "services")
public class HotelService {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    @Column(name = "price", nullable = false)
    private Double price;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    @Column(name = "image", length = 255)
    private String image;
}
"""

booking_service = """
package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@Entity
@Table(name = "booking_services")
public class BookingService {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"details", "services", "payments"})
    private Booking booking;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private HotelService service;
    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;
    @Column(name = "price_at_booking", nullable = false)
    private Double priceAtBooking;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
"""

review = """
package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@Entity
@Table(name = "reviews")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "items"})
    private RoomType roomType;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"details", "services", "payments"})
    private Booking booking;
    @Column(name = "rating", nullable = false)
    private Integer rating;
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
"""

write_file(os.path.join(ENTITY_DIR, "RoomType.java"), room_type)
write_file(os.path.join(ENTITY_DIR, "RoomTypeItem.java"), room_type_item_fixed)
write_file(os.path.join(ENTITY_DIR, "Room.java"), room)
write_file(os.path.join(ENTITY_DIR, "Booking.java"), booking)
write_file(os.path.join(ENTITY_DIR, "BookingDetail.java"), booking_detail)
write_file(os.path.join(ENTITY_DIR, "Payment.java"), payment)
write_file(os.path.join(ENTITY_DIR, "HotelService.java"), hotel_service)
write_file(os.path.join(ENTITY_DIR, "BookingService.java"), booking_service)
write_file(os.path.join(ENTITY_DIR, "Review.java"), review)

# Clean up old RoomItem.java if exists
old_room_item = os.path.join(ENTITY_DIR, "RoomItem.java")
if os.path.exists(old_room_item):
    os.remove(old_room_item)

# ================= REPOSITORIES =================

repo_template = """
package com.hotel.repository;
import com.hotel.entity.{EntityName};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface {EntityName}Repository extends JpaRepository<{EntityName}, Integer> {
}
"""
def create_repo(entity_name):
    content = repo_template.replace("{EntityName}", entity_name)
    write_file(os.path.join(REPO_DIR, f"{entity_name}Repository.java"), content)

create_repo("BookingDetail")
create_repo("Payment")
create_repo("HotelService")
create_repo("BookingService")
create_repo("Review")
create_repo("RoomTypeItem")

# Clean up old RoomItemRepository
old_room_item_repo = os.path.join(REPO_DIR, "RoomItemRepository.java")
if os.path.exists(old_room_item_repo):
    os.remove(old_room_item_repo)

print("Entities and Repositories generated successfully!")
