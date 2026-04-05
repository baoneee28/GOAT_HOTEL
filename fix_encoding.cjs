const fs = require('fs');

// Fix pom.xml
let pom = fs.readFileSync('d:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\pom.xml', 'utf8');
if (!pom.includes('<project.build.sourceEncoding>')) {
  pom = pom.replace(
    '<java.version>17</java.version>',
    '<java.version>17</java.version>\n        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>\n        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>'
  );
  fs.writeFileSync('d:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\pom.xml', pom, 'utf8');
  console.log('Fixed pom.xml');
}

// Fix CouponApiController.java
let java = fs.readFileSync('d:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\controller\\api\\CouponApiController.java', 'utf8');
const oldFunc = `    private void seedEventIfMissing(String key, String label, String icon, String color, int order, boolean isSystem) {
        if (eventTypeRepository.findByEventKeyIgnoreCase(key).isEmpty()) {
            CouponEventType e = new CouponEventType();
            e.setEventKey(key);
            e.setLabel(label);
            e.setIcon(icon);
            e.setColor(color);
            e.setSortOrder(order);
            e.setIsSystem(isSystem);
            eventTypeRepository.save(e);
        }
    }`;
const newFunc = `    private void seedEventIfMissing(String key, String label, String icon, String color, int order, boolean isSystem) {
        Optional<CouponEventType> opt = eventTypeRepository.findByEventKeyIgnoreCase(key);
        CouponEventType e = opt.orElse(new CouponEventType());
        e.setEventKey(key);
        e.setLabel(label);
        e.setIcon(icon);
        e.setColor(color);
        if (e.getId() == null) {
            e.setSortOrder(order);
        }
        e.setIsSystem(isSystem);
        eventTypeRepository.save(e);
    }`;

if (java.includes(oldFunc)) {
  java = java.replace(oldFunc, newFunc);
  fs.writeFileSync('d:\\GOAT_HOTEL\\GOAT_HOTEL\\backend\\src\\main\\java\\com\\hotel\\controller\\api\\CouponApiController.java', java, 'utf8');
  console.log('Fixed CouponApiController.java');
} else {
  console.log('CouponApiController already updated or not matched');
}
