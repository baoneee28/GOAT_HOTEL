const fs = require('fs');
const file = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\controller\\api\\BookingApiController.java';
let content = fs.readFileSync(file, 'utf-8');

// 1. Add import
if (!content.includes('import com.hotel.service.NotificationService;')) {
    content = content.replace(
        'import com.hotel.service.BookingService;', 
        'import com.hotel.service.BookingService;\nimport com.hotel.service.NotificationService;'
    );
}

// 2. Add Autowired
if (!content.includes('private NotificationService notificationService;')) {
    content = content.replace(
        '    private AuthService authService;', 
        '    private AuthService authService;\n\n    @Autowired\n    private NotificationService notificationService;'
    );
}

// 3. Add to checkoutAdmin
if (!content.includes('notificationService.sendReviewPrompt')) {
    content = content.replace(
        'roomRepository.save(room);\n        }',
        `roomRepository.save(room);\n        }\n\n        if (booking.getUser() != null) {\n            notificationService.sendReviewPrompt(booking);\n        }`
    );
}

fs.writeFileSync(file, content, 'utf-8');
console.log('BookApiController modified successfully.');
