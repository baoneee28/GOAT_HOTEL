import sys
import random
from datetime import datetime, timedelta

def generate_db_script():
    out = []
    out.append("USE goat_hotel;")
    out.append("GO")

    # Drops
    out.append("IF OBJECT_ID('dbo.reviews', 'U') IS NOT NULL DROP TABLE dbo.reviews;")
    out.append("IF OBJECT_ID('dbo.booking_services', 'U') IS NOT NULL DROP TABLE dbo.booking_services;")
    out.append("IF OBJECT_ID('dbo.booking_details', 'U') IS NOT NULL DROP TABLE dbo.booking_details;")
    out.append("IF OBJECT_ID('dbo.payments', 'U') IS NOT NULL DROP TABLE dbo.payments;")
    out.append("IF OBJECT_ID('dbo.services', 'U') IS NOT NULL DROP TABLE dbo.services;")
    out.append("IF OBJECT_ID('dbo.room_type_items', 'U') IS NOT NULL DROP TABLE dbo.room_type_items;")
    out.append("IF OBJECT_ID('dbo.room_items', 'U') IS NOT NULL DROP TABLE dbo.room_items;")
    out.append("IF OBJECT_ID('dbo.bookings', 'U') IS NOT NULL DROP TABLE dbo.bookings;")
    out.append("IF OBJECT_ID('dbo.rooms', 'U') IS NOT NULL DROP TABLE dbo.rooms;")
    out.append("IF OBJECT_ID('dbo.room_types', 'U') IS NOT NULL DROP TABLE dbo.room_types;")
    out.append("IF OBJECT_ID('dbo.items', 'U') IS NOT NULL DROP TABLE dbo.items;")
    out.append("IF OBJECT_ID('dbo.news', 'U') IS NOT NULL DROP TABLE dbo.news;")
    out.append("IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;")
    out.append("GO")

    # Creates
    out.append("CREATE TABLE dbo.users (id INT IDENTITY(1,1) PRIMARY KEY, full_name NVARCHAR(100) NOT NULL, email NVARCHAR(100) NOT NULL UNIQUE, password NVARCHAR(255) NOT NULL, phone NVARCHAR(15) NULL, image NVARCHAR(255) NULL, role NVARCHAR(20) NOT NULL DEFAULT 'customer', created_at DATETIME2 NOT NULL DEFAULT GETDATE());")
    out.append("CREATE TABLE dbo.room_types (id INT IDENTITY(1,1) PRIMARY KEY, type_name NVARCHAR(100) NOT NULL, price_per_night FLOAT NOT NULL, capacity INT NOT NULL, description NVARCHAR(MAX) NULL, image NVARCHAR(255) NULL);")
    out.append("CREATE TABLE dbo.rooms (id INT IDENTITY(1,1) PRIMARY KEY, room_number NVARCHAR(10) NOT NULL UNIQUE, type_id INT NULL FOREIGN KEY REFERENCES dbo.room_types(id) ON DELETE SET NULL, status NVARCHAR(20) NOT NULL DEFAULT 'available');")
    out.append("CREATE TABLE dbo.items (id INT IDENTITY(1,1) PRIMARY KEY, name NVARCHAR(100) NOT NULL, image NVARCHAR(255) NULL);")
    out.append("CREATE TABLE dbo.room_type_items (type_id INT NOT NULL FOREIGN KEY REFERENCES dbo.room_types(id) ON DELETE CASCADE, item_id INT NOT NULL FOREIGN KEY REFERENCES dbo.items(id) ON DELETE CASCADE, PRIMARY KEY (type_id, item_id));")
    out.append("CREATE TABLE dbo.bookings (id INT IDENTITY(1,1) PRIMARY KEY, user_id INT NULL FOREIGN KEY REFERENCES dbo.users(id) ON DELETE SET NULL, total_price FLOAT NULL, status NVARCHAR(20) NOT NULL DEFAULT 'pending', created_at DATETIME2 NOT NULL DEFAULT GETDATE());")
    out.append("CREATE TABLE dbo.booking_details (id INT IDENTITY(1,1) PRIMARY KEY, booking_id INT NOT NULL FOREIGN KEY REFERENCES dbo.bookings(id) ON DELETE CASCADE, room_id INT NULL FOREIGN KEY REFERENCES dbo.rooms(id) ON DELETE SET NULL, price_at_booking FLOAT NOT NULL, check_in DATETIME2 NULL, check_out DATETIME2 NULL, check_in_actual DATETIME2 NULL, check_out_actual DATETIME2 NULL, total_hours FLOAT NOT NULL DEFAULT 0.0);")
    out.append("CREATE TABLE dbo.payments (id INT IDENTITY(1,1) PRIMARY KEY, booking_id INT NOT NULL FOREIGN KEY REFERENCES dbo.bookings(id) ON DELETE CASCADE, amount FLOAT NOT NULL, payment_method NVARCHAR(50) NOT NULL, payment_date DATETIME2 NOT NULL DEFAULT GETDATE(), status NVARCHAR(20) NOT NULL DEFAULT 'completed');")
    out.append("CREATE TABLE dbo.services (id INT IDENTITY(1,1) PRIMARY KEY, name NVARCHAR(100) NOT NULL, price FLOAT NOT NULL, description NVARCHAR(MAX) NULL, image NVARCHAR(255) NULL);")
    out.append("CREATE TABLE dbo.booking_services (id INT IDENTITY(1,1) PRIMARY KEY, booking_id INT NOT NULL FOREIGN KEY REFERENCES dbo.bookings(id) ON DELETE CASCADE, service_id INT NULL FOREIGN KEY REFERENCES dbo.services(id) ON DELETE SET NULL, quantity INT NOT NULL DEFAULT 1, price_at_booking FLOAT NOT NULL, created_at DATETIME2 NOT NULL DEFAULT GETDATE());")
    out.append("CREATE TABLE dbo.reviews (id INT IDENTITY(1,1) PRIMARY KEY, user_id INT NULL FOREIGN KEY REFERENCES dbo.users(id) ON DELETE SET NULL, room_type_id INT NULL FOREIGN KEY REFERENCES dbo.room_types(id) ON DELETE SET NULL, booking_id INT NULL FOREIGN KEY REFERENCES dbo.bookings(id) ON DELETE SET NULL, rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), comment NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT GETDATE());")
    out.append("CREATE TABLE dbo.news (id INT IDENTITY(1,1) PRIMARY KEY, title NVARCHAR(255) NOT NULL, slug NVARCHAR(255) NOT NULL UNIQUE, summary NVARCHAR(MAX) NULL, content NVARCHAR(MAX) NULL, image NVARCHAR(255) NULL, created_at DATETIME2 NOT NULL DEFAULT GETDATE());")
    out.append("GO")

    # Users
    users_insert = "INSERT INTO dbo.users (full_name, email, password, phone, role) VALUES "
    users_data = ["(N'Admin GOAT Hotel', 'admin@goathotel.com', 'admin123', '0901234567', 'admin')"]
    for i in range(2, 41):
        users_data.append(f"(N'Khach Hang {i}', 'khachhang{i}@gmail.com', '123456', '09{random.randint(10000000, 99999999)}', 'customer')")
    out.append(users_insert + ",\n".join(users_data) + ";\nGO")

    # Room Types
    rt_insert = "INSERT INTO dbo.room_types (type_name, price_per_night, capacity, description, image) VALUES "
    rts = [
        "(N'Phòng Standard', 500000, 2, N'Phòng cơ bản, đầy đủ tiện nghi, phù hợp 2 người.', 'standard.jpg')",
        "(N'Phòng Superior', 800000, 2, N'Phòng rộng hơn Standard, view thoáng mát.', 'superior.jpg')",
        "(N'Phòng Deluxe', 1200000, 2, N'Phòng cao cấp, có bồn tắm, view đẹp.', 'deluxe.jpg')",
        "(N'Phòng Family', 1500000, 4, N'Phòng lớn dành cho gia đình 4 người.', 'family.jpg')",
        "(N'Phòng Suite VIP', 3000000, 4, N'Phòng hoàng gia, không gian siêu sang trọng.', 'suite.jpg')"
    ]
    out.append(rt_insert + ",\n".join(rts) + ";\nGO")

    # Rooms
    rooms_insert = "INSERT INTO dbo.rooms (room_number, type_id, status) VALUES "
    rooms = []
    prices = [500000, 800000, 1200000, 1500000, 3000000]
    for floor in range(1, 6):
        for number in range(1, 11):
            rt_id = 1 if floor == 1 else (2 if floor == 2 else (3 if floor in (3, 4) else (5 if floor == 5 and number > 8 else 4)))
            status = 'available'
            rooms.append(f"('{floor}{number:02d}', {rt_id}, '{status}')")
    out.append(rooms_insert + ",\n".join(rooms) + ";\nGO")

    # Items
    items_insert = "INSERT INTO dbo.items (name, image) VALUES "
    items = [ "(N'Máy lạnh', 'ac.png')", "(N'TV Smart', 'tv.png')", "(N'Tủ lạnh mini', 'fridge.png')",
              "(N'Bồn tắm', 'bathtub.png')", "(N'WiFi VIP', 'wifi.png')", "(N'Két sắt', 'safe.png')",
              "(N'Máy sấy tóc', 'hairdryer.png')", "(N'Bàn ủi', 'iron.png')", "(N'Ban công', 'balcony.png')",
              "(N'Ghế tình yêu', 'sofa.png')" ]
    out.append(items_insert + ",\n".join(items) + ";\nGO")

    # RoomTypeItems
    rti_insert = "INSERT INTO dbo.room_type_items (type_id, item_id) VALUES "
    rtis = []
    for type_id in range(1, 6):
        num_items = type_id + 3 
        valid_items = random.sample(range(1, 11), min(num_items, 10))
        for item_id in valid_items:
            rtis.append(f"({type_id}, {item_id})")
    out.append(rti_insert + ",\n".join(rtis) + ";\nGO")

    # Services
    services_insert = "INSERT INTO dbo.services (name, price, description, image) VALUES "
    services = [ "(N'Giặt ủi', 50000, N'Dịch vụ giặt ủi lấy liền, tính theo kg', 'laundry.jpg')",
                 "(N'Đưa đón sân bay', 250000, N'Xe 4 chỗ đón/tiễn sân bay 2 chiều', 'transfer.jpg')",
                 "(N'Ăn sáng Buffet', 150000, N'Buffet sáng hải sản 5 sao', 'breakfast.jpg')",
                 "(N'Thuê xe máy', 120000, N'Thuê xe tay ga đời mới 24h', 'bike.jpg')",
                 "(N'Spa & Massage', 400000, N'Gói massage toàn thân 60 phút', 'spa.jpg')" ]
    out.append(services_insert + ",\n".join(services) + ";\nGO")

    # Bookings -> BookingDetails -> BookingServices -> Payments -> Reviews
    # Generate 50 bookings
    bookings_out = []
    details_out = []
    bs_out = []
    pay_out = []
    rev_out = []

    start_date = datetime.now() - timedelta(days=90)
    for b_id in range(1, 51):
        u_id = random.randint(2, 40)
        status = random.choice(['completed', 'completed', 'completed', 'confirmed', 'pending', 'cancelled'])
        total_price = 0
        
        created_at = start_date + timedelta(days=random.randint(0, 80))
        
        # Details
        num_rooms = random.randint(1, 3)
        room_ids = random.sample(range(1, 51), num_rooms)
        check_in = created_at + timedelta(days=random.randint(1, 10))
        length = random.randint(1, 4)
        check_out = check_in + timedelta(days=length)
        
        # Room price calculation
        rooms_total = 0
        rt_for_reviews = []
        for r_id in room_ids:
            # Figure out type based on exact generation logic above to get correct price
            floor = (r_id - 1) // 10 + 1
            number = (r_id - 1) % 10 + 1
            rt_id = 1 if floor == 1 else (2 if floor == 2 else (3 if floor in (3, 4) else (5 if floor == 5 and number > 8 else 4)))
            rt_for_reviews.append(rt_id)
            price_at_booking = prices[rt_id - 1]
            rooms_total += price_at_booking * length
            
            c_in_a = check_in.strftime('%Y-%m-%d %H:%M:%S') if status == 'completed' else 'NULL'
            c_out_a = check_out.strftime('%Y-%m-%d %H:%M:%S') if status == 'completed' else 'NULL'
            c_in_a_str = f"'{c_in_a}'" if c_in_a != 'NULL' else "NULL"
            c_out_a_str = f"'{c_out_a}'" if c_out_a != 'NULL' else "NULL"
            t_hours = length * 24 if status == 'completed' else 0
            
            details_out.append(f"({b_id}, {r_id}, {price_at_booking}, '{check_in.strftime('%Y-%m-%d %H:%M:%S')}', '{check_out.strftime('%Y-%m-%d %H:%M:%S')}', {c_in_a_str}, {c_out_a_str}, {t_hours})")
            
        total_price += rooms_total
        
        # Services
        if status in ('confirmed', 'completed') and random.random() > 0.5:
            num_srv = random.randint(1, 3)
            srv_ids = random.sample(range(1, 6), num_srv)
            for s_id in srv_ids:
                s_prices = [50000, 250000, 150000, 120000, 400000]
                qty = random.randint(1, 3)
                p_srv = s_prices[s_id - 1]
                total_price += p_srv * qty
                bs_out.append(f"({b_id}, {s_id}, {qty}, {p_srv}, '{created_at.strftime('%Y-%m-%d %H:%M:%S')}')")
                
        bookings_out.append(f"({u_id}, {total_price}, '{status}', '{created_at.strftime('%Y-%m-%d %H:%M:%S')}')")
        
        # Payments
        if status in ('confirmed', 'completed'):
            pay_out.append(f"({b_id}, {total_price}, '{random.choice(['VNPay', 'Cash', 'Credit Card'])}', '{created_at.strftime('%Y-%m-%d %H:%M:%S')}', 'completed')")
            
        # Reviews
        if status == 'completed' and random.random() > 0.3:
            for rt_id in list(set(rt_for_reviews)):
                txt = random.choice(['Phòng rất đẹp và sạch sẽ!', 'Nhân viên phục vụ tốt.', 'Wifi hơi yếu nhưng phòng ổn định.', 'View đẹp, sẽ quay lại!', 'Đáng giá tiền.'])
                rating = random.randint(3, 5)
                rev_out.append(f"({u_id}, {rt_id}, {b_id}, {rating}, N'{txt}', '{check_out.strftime('%Y-%m-%d %H:%M:%S')}')")

    out.append("INSERT INTO dbo.bookings (user_id, total_price, status, created_at) VALUES \n" + ",\n".join(bookings_out) + ";\nGO")
    out.append("INSERT INTO dbo.booking_details (booking_id, room_id, price_at_booking, check_in, check_out, check_in_actual, check_out_actual, total_hours) VALUES \n" + ",\n".join(details_out) + ";\nGO")
    if bs_out:
        out.append("INSERT INTO dbo.booking_services (booking_id, service_id, quantity, price_at_booking, created_at) VALUES \n" + ",\n".join(bs_out) + ";\nGO")
    if pay_out:
        out.append("INSERT INTO dbo.payments (booking_id, amount, payment_method, payment_date, status) VALUES \n" + ",\n".join(pay_out) + ";\nGO")
    if rev_out:
        out.append("INSERT INTO dbo.reviews (user_id, room_type_id, booking_id, rating, comment, created_at) VALUES \n" + ",\n".join(rev_out) + ";\nGO")
        
    # News
    news_insert = "INSERT INTO dbo.news (title, slug, summary, content, image) VALUES "
    news_items = [
        "(N'Khai Trương Mùa Du Lịch', 'khai-truong', N'Mùa hè vẫy gọi', N'<p>Cơ hội vàng...</p>', 'news1.jpg')",
        "(N'Tri ân khách hàng', 'tri-an', N'Giảm giá 50%', N'<p>Chi tiết...</p>', 'news2.jpg')"
    ]
    out.append(news_insert + ",\n".join(news_items) + ";\nGO")
    out.append("PRINT 'DA CHAY THANH CONG SCRIPT NEW FULL DB';")

    with open(r'd:\webProject\GOAT_HOTEL\goat_hotel_full_demo.sql', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    
generate_db_script()
