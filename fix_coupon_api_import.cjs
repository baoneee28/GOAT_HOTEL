const fs = require('fs');
const file = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\controller\\api\\CouponApiController.java';
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('import java.util.Optional;')) {
    content = content.replace(
        'import java.util.Map;',
        'import java.util.Map;\nimport java.util.Optional;'
    );
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Fixed CouponApiController import');
} else {
    console.log('Already fixed CouponApiController import');
}
