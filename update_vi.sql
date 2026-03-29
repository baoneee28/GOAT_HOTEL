USE goat_hotel;

UPDATE room_types SET type_name=N'Phòng Đặc Biệt Hoàng Gia', description=N'Trải nghiệm đẳng cấp tột đỉnh với tầm nhìn panorama toàn thành phố, nội thất nhập khẩu từ Ý và dịch vụ quản gia riêng 24/7. Biểu tượng sang trọng dành cho những vị khách tinh tế nhất.' WHERE id=1;
UPDATE room_types SET type_name=N'Phòng Superior Deluxe', description=N'Không gian hài hòa giữa phong cách hiện đại và sự tinh tế thanh lịch. Phòng rộng rãi với đầy đủ tiện nghi cao cấp, phù hợp cho cả công tác lẫn nghỉ dưỡng.' WHERE id=2;
UPDATE room_types SET type_name=N'Phòng Executive Suite', description=N'Lý tưởng cho gia đình và doanh nhân với phòng khách riêng biệt, phòng ngủ tiện nghi và đặc quyền sử dụng tầng hành pháp với dịch vụ check-in ưu tiên.' WHERE id=3;
UPDATE room_types SET type_name=N'Phòng Tổng Thống', description=N'Biểu tượng của xa hoa tuyệt đối. Tầm nhìn toàn cảnh, phòng ăn riêng tư, đầu bếp theo yêu cầu và quản gia cá nhân phục vụ suốt thời gian lưu trú.' WHERE id=4;
UPDATE room_types SET type_name=N'Phòng Hướng Biển', description=N'Thức dậy mỗi sáng với tầm nhìn trực diện ra biển xanh mênh mông. Ban công riêng rộng rãi, nội thất mộc mạc tinh tế mang phong cách resort biển Vũng Tàu.' WHERE id=5;
UPDATE room_types SET type_name=N'Phòng Spa và Sức Khỏe', description=N'Không gian nghỉ dưỡng thiết kế riêng cho sức khỏe và thư giãn. Bao gồm bồn tắm thảo dược, khu yoga riêng và ưu tiên đặt lịch dịch vụ spa cao cấp.' WHERE id=6;

-- News
UPDATE news SET
  title=N'Khai Trương Khu Spa Và Wellness Cao Cấp Tại GOAT HOTEL',
  content=N'GOAT HOTEL tự hào giới thiệu khu Spa và Wellness mới diện tích hơn 500m². Bao gồm bể sục Jacuzzi, phòng xông hơi đá muối Himalaya, phòng massage trị liệu cùng đội ngũ chuyên gia có chứng chỉ quốc tế. Khách lưu trú hạng Suite trở lên được miễn phí sử dụng toàn bộ tiện ích spa.',
  summary=N'Khu Spa và Wellness hơn 500m² chính thức đi vào hoạt động với đầy đủ dịch vụ thư giãn cao cấp.'
WHERE id=1;

UPDATE news SET
  title=N'GOAT HOTEL Vinh Dự Nhận Giải Thưởng Khách Sạn Xuất Sắc Nhất 2024',
  content=N'Trong lễ trao giải của Hiệp hội Du lịch Bà Rịa Vũng Tàu, GOAT HOTEL xuất sắc nhận danh hiệu Khách Sạn Xuất Sắc Nhất năm 2024. Giải thưởng dựa trên tiêu chí chất lượng dịch vụ và độ hài lòng của khách hàng.',
  summary=N'GOAT HOTEL nhận danh hiệu Khách Sạn Xuất Sắc Nhất Vũng Tàu 2024 từ Hiệp hội Du lịch địa phương.'
WHERE id=2;

UPDATE news SET
  title=N'Ưu Đãi Hè 2024: Giảm 30% Cho Đặt Phòng Từ 3 Đêm Trở Lên',
  content=N'GOAT HOTEL triển khai ưu đãi đặc biệt mùa hè dành cho khách lưu trú từ 3 đêm. Giảm trực tiếp 30% giá phòng, bao gồm bữa sáng buffet và một lần dùng spa miễn phí. Áp dụng từ 01/06 đến 31/08/2024.',
  summary=N'Giảm 30% cho đặt phòng từ 3 đêm, kèm bữa sáng và 1 lần spa miễn phí trong mùa hè 2024.'
WHERE id=3;

PRINT 'Done';
GO
