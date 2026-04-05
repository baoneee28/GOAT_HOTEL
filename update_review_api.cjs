const fs = require('fs');
const file = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\controller\\api\\ReviewApiController.java';
let content = fs.readFileSync(file, 'utf-8');

// Add GetMapping for RoomId
if (!content.includes('getReviewsByRoom')) {
    const newEndpoint = `
    @GetMapping("/room/{roomId}")
    public ResponseEntity<?> getReviewsByRoom(@PathVariable Integer roomId) {
        // Fetch reviews by tracking their booking details or directly fetching by roomType
        // Since Review has roomType, we should actually fetch by roomType.id 
        // We'll trust the parameter 'roomId' means 'roomTypeId' in this context of the frontend
        List<Review> list = reviewRepository.findByRoomTypeIdOrderByCreatedAtDesc(roomId);
        return ResponseEntity.ok(Map.of("reviews", list));
    }`;
    content = content.replace('}\n', newEndpoint + '\n}\n');
    fs.writeFileSync(file, content, 'utf-8');
    console.log('ReviewApiController updated');
} else {
    console.log('Already updated');
}
