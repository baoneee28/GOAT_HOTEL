package com.hotel.controller;

import com.hotel.entity.Room;
import com.hotel.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


// Tương tác trực tiếp qua AJAX (bất đồng bộ) từ giao diện, trả về cục HTML hoặc JSON chứ không trả về trang Web nguyên xi
@RestController
@SuppressWarnings("null")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private com.hotel.repository.ItemRepository itemRepository;

    // Hàm này được gọi bằng Javascript (fetch/AJAX) mỗi khi khách đổi tab Loại phòng (Tiêu chuẩn, VIP...)
    // Nó sẽ tự lắp ghép chuỗi HTML rồi ném thẳng ra giao diện cho Javascript nhúng vào
    @PostMapping(value = "/get-rooms", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getRoomsByType(@RequestParam Integer type_id) {
        // Tìm toàn bộ phòng thuộc hạng phòng được chọn, xếp theo tên A-Z
        List<Room> rooms = roomRepository.findByRoomTypeIdOrderByRoomNumberAsc(type_id);

        if (rooms.isEmpty()) {

            return ResponseEntity.ok("<div class=\"col-12 text-center text-muted\">Chưa có phòng nào thuộc hạng mục này.</div>");
        }

        StringBuilder html = new StringBuilder();
        // Lặp qua từng phòng để vẽ ra cục div hình vuông
        for (Room room : rooms) {
            String statusValue = room.getStatus();
            boolean isAvailable = "available".equals(statusValue);
            
            String statusClass;
            String statusText;
            
            if ("available".equals(statusValue)) {
                statusClass = "room-available";
                statusText = "Trống";
            } else if ("maintenance".equals(statusValue)) {
                statusClass = "bg-secondary text-white";
                statusText = "Đang sửa";
            } else {
                statusClass = "room-occupied";
                statusText = "Đang có khách";
            }


            // --- XỬ LÝ RÚT TRÍCH TIỆN ÍCH PHÒNG ĐỂ HIỂN THỊ ICON ---
            List<com.hotel.entity.RoomItem> roomItems = room.getRoomItems();
            StringBuilder itemIconsHtml = new StringBuilder(); // Chứa mã HTML <img> để vẽ icon
            StringBuilder itemNamesJson = new StringBuilder(); // Chứa chuỗi JSON mảng để gửi cho Javascript vẽ popup lúc click vào
            
            if (roomItems != null && !roomItems.isEmpty()) {
                itemNamesJson.append("[");
                int count = 0;
                for (com.hotel.entity.RoomItem ri : roomItems) {
                    com.hotel.entity.Item item = itemRepository.findById(ri.getItemId()).orElse(null);
                    if (item != null) {

                        if (count < 3) {
                             itemIconsHtml.append("<img src=\"").append(item.getImage()).append("\" style=\"width:16px;height:16px;margin:0 2px;\" title=\"").append(item.getName()).append("\">");
                        }
                        

                        if (count > 0) itemNamesJson.append(",");
                        itemNamesJson.append("{\"name\":\"").append(item.getName().replace("\"", "\\\"")).append("\",\"icon\":\"").append(item.getImage()).append("\"}");
                        
                        count++;
                    }
                }
                itemNamesJson.append("]");
                if (count > 3) {
                    itemIconsHtml.append("<span style=\"font-size:10px; margin-left:2px;\">+").append(count - 3).append("</span>");
                }
            } else {
                itemNamesJson.append("[]");
            }


            // Biến chuỗi text bình thường thành dạng JSON an toàn, tránh lỗi nhảy nháy kép làm sập giao diện
            String safeJson = itemNamesJson.toString().replace("'", "&#39;");


            // Ráp sự kiện onClick="selectRoom(...)" cho mấy cái cục phòng, khi ấn vào sẽ hiện popup
            String onclick = isAvailable
                    ? "onclick=\"selectRoom(this, " + room.getId() + ", '" + room.getRoomNumber() + "')\" data-items='" + safeJson + "'"
                    : "";


            html.append("<div class=\"col-6 col-md-4 col-lg-3\">");
            html.append("<div class=\"room-box ").append(statusClass).append("\" ").append(onclick).append(" style=\"display:flex; flex-direction:column; align-items:center; justify-content:center;\">");
            

            html.append("<div style=\"margin-bottom:5px; height:20px;\">").append(itemIconsHtml.toString()).append("</div>");
            
            html.append("<div class=\"room-number\">").append(room.getRoomNumber()).append("</div>");
            html.append("<div style=\"font-size:0.85rem; margin-top:5px; opacity:0.9;\">").append(statusText).append("</div>");
            html.append("</div></div>");
        }

        return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=UTF-8")
                .body(html.toString());
    }
}
