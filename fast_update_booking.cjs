const fs = require('fs');
const file = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\controller\\api\\BookingApiController.java';
let content = fs.readFileSync(file, 'utf-8');

// Add import
if (!content.includes('import com.hotel.service.NotificationService;')) {
    content = content.replace(
        'import com.hotel.service.BookingService;', 
        'import com.hotel.service.BookingService;\nimport com.hotel.service.NotificationService;'
    );
}

// Add Autowired
if (!content.includes('private NotificationService notificationService;')) {
    content = content.replace(
        '    private AuthService authService;', 
        '    private AuthService authService;\n\n    @Autowired\n    private NotificationService notificationService;'
    );
}

// Ensure the injection is placed at line ~490 exactly inside checkoutAdmin
if (!content.includes('notificationService.sendReviewPrompt')) {
    const searchString = `        bookingRepository.save(booking);
        if(room != null) {
            room.setStatus("available");
            roomRepository.save(room);
        }

        response.put("success", true);`;

    const replaceString = `        bookingRepository.save(booking);
        if(room != null) {
            room.setStatus("available");
            roomRepository.save(room);
        }

        if (booking.getUser() != null) {
            notificationService.sendReviewPrompt(booking);
        }

        response.put("success", true);`;
        
    content = content.replace(searchString, replaceString);
}

fs.writeFileSync(file, content, 'utf-8');
console.log('BookApiController modified via NodeJS successfully.');
