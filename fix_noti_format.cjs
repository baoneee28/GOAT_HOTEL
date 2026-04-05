const fs = require('fs');
const file = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\service\\NotificationService.java';
let content = fs.readFileSync(file, 'utf-8');

const badCode = `if ("fixed".equals(reward.getDiscountType()))`;
const goodCode = `if ("FIXED".equalsIgnoreCase(reward.getDiscountType()))`;

if (content.includes(badCode)) {
    content = content.replace(badCode, goodCode);
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Fixed ignoreCase in NotificationService');
} else {
    console.log('Already fixed or not found in NotificationService');
}
