const fs = require('fs');
const file = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\controller\\api\\ReviewApiController.java';
let content = fs.readFileSync(file, 'utf-8');

// Replace the bad insertion
const badInsertion = `        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        
    @GetMapping("/room/{roomId}")
    public ResponseEntity<?> getReviewsByRoom(@PathVariable Integer roomId) {
        // Fetch reviews by tracking their booking details or directly fetching by roomType
        // Since Review has roomType, we should actually fetch by roomType.id 
        // We'll trust the parameter 'roomId' means 'roomTypeId' in this context of the frontend
        List<Review> list = reviewRepository.findByRoomTypeIdOrderByCreatedAtDesc(roomId);
        return ResponseEntity.ok(Map.of("reviews", list));
    }
}`;

const goodCode = `        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }`;

content = content.replace(badInsertion, goodCode);

if (!content.includes('getReviewsByRoom')) {
    const endEndpoint = `
    @GetMapping("/room/{roomId}")
    public ResponseEntity<?> getReviewsByRoom(@PathVariable Integer roomId) {
        List<Review> list = reviewRepository.findByRoomTypeIdOrderByCreatedAtDesc(roomId);
        return ResponseEntity.ok(Map.of("reviews", list));
    }`;
    content = content.replace(/}\s*$/, endEndpoint + '\n}');
}

fs.writeFileSync(file, content, 'utf-8');
