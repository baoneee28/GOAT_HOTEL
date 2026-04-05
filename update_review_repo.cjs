const fs = require('fs');
const file = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\repository\\ReviewRepository.java';
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('findByRoomTypeIdOrderByCreatedAtDesc')) {
    content = content.replace(
        'List<Review> findByBookingId(Integer bookingId);',
        'List<Review> findByBookingId(Integer bookingId);\n    List<Review> findByRoomTypeIdOrderByCreatedAtDesc(Integer roomTypeId);'
    );
    fs.writeFileSync(file, content, 'utf-8');
    console.log('ReviewRepository updated');
} else {
    console.log('Already updated');
}
