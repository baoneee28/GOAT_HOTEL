const fs = require('fs');

const adminControllerFile = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\controller\\admin\\AdminBookingController.java';
const apiControllerFile = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\controller\\api\\BookingApiController.java';

function replaceReviewPrompt(file) {
    let content = fs.readFileSync(file, 'utf8');
    const oldCall = `        if (booking.getUser() != null) {
            notificationService.createNotification(
                booking.getUser(),
                "Đánh giá chuyến đi " + booking.getId(),
                "Cảm ơn bạn đã lưu trú. Hãy đánh giá chuyến đi để nhận voucher ngay nhé!",
                "REVIEW_PROMPT",
                booking.getId()
            );
        }`;
    const newCall = `        notificationService.sendReviewPrompt(booking);`;
    
    if (content.includes(oldCall)) {
        content = content.replace(oldCall, newCall);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Modified', file);
    } else {
        console.log('Not found in', file);
    }
}

replaceReviewPrompt(adminControllerFile);
replaceReviewPrompt(apiControllerFile);
