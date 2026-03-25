import os

file_path = r"d:\webProject\GOAT_HOTEL\backend\src\main\java\com\hotel\repository\BookingRepository.java"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Query 1
content = content.replace(
    '"JOIN FETCH b.room r JOIN FETCH r.roomType t " +\n           "WHERE b.user.id = :userId',
    '"WHERE b.user.id = :userId'
)

# Replace Query 2
content = content.replace(
    'value = "SELECT b FROM Booking b JOIN FETCH b.room r JOIN FETCH r.roomType t " +\n           "WHERE b.user.id = :userId',
    'value = "SELECT b FROM Booking b " +\n           "WHERE b.user.id = :userId'
)

# Replace Query 3
content = content.replace(
    '"SELECT b FROM Booking b JOIN FETCH b.user u JOIN FETCH b.room r JOIN FETCH r.roomType t " +\n           "WHERE (:status IS NULL OR :status = \'\' OR b.status = :status) " +\n           "ORDER BY b.id DESC")',
    'value = "SELECT b FROM Booking b JOIN FETCH b.user u " +\n           "WHERE (:status IS NULL OR :status = \'\' OR b.status = :status) " +\n           "ORDER BY b.id DESC", countQuery = "SELECT COUNT(b) FROM Booking b WHERE (:status IS NULL OR :status = \'\' OR b.status = :status)")'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("BookingRepository.java fixed")
