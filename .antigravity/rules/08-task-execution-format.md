# 08 — Định Dạng Trả Lời & Báo Cáo Thay Đổi

## Mục Đích
Thống nhất cách AI agent trình bày kết quả cho con người đọc. Agent phải có mindset rằng "Mình dọn dẹp phòng, thì phải chỉ cho chủ phòng mình đã quét chỗ nào, và đụng vào cái tủ nào".

## Áp Dụng Khi Nào
Tất cả các Task yêu cầu sinh ra câu trả lời (sau khi đã write file hoàn tất).

---

## 1. Không Nói Dong Dài "Lý Thuyết"
Trực diện. Dự án sinh viên yêu cầu sự thiết thực. Không giải thích tại sao React hook chạy thế nào nếu không ai hỏi. Tập trung báo cáo những gì **đã thay đổi**.

## 2. Thông Báo Cấu Trúc Khác Biệt Giữa 2 Đầu
Báo cáo lại cấu trúc sau khi bạn thực hiện một Tool call:
```text
## Đã Hoàn Thành:
- `<File>` : Tôi đã sửa hàm A để nó ném Exception nếu ID phòng bị trống.
- `<File>` : Tôi update Hook B bên FE để nó call Axios kèm khối try-catch, đón lấy Exception do Hàm A bên BE ném ra.

## Cần Lưu Ý (Dành cho User): 
- Tôi thấy Component X đang tính tiền sai kiến trúc, nhưng thuộc ngoài Task này, tôi giữ nguyên hiện trạng. 
```

## 3. Nói Rõ Về Mảnh Ghép Bị Thiếu
Bạn có thể đang làm việc trong một luồng Backend chưa có Frontend tương ứng. Hãy trình bày rõ:
"Tôi đã viết xong API GET `/rooms` hoàn chỉnh với Pagination và check Available. Frontend hiện tại chưa có trang tương ứng. Ở đợt task UI tiếp theo, cần nhắc tôi tích hợp API này vào."

## 4. Tôn Trọng Rule Đè
Nếu Task mâu thuẫn với File Rule, bạn có thể giải thích "Tôi đã từ chối chỉnh sửa theo yêu cầu A, vì theo RULE B (03-Backend Là Source Of Truth), FE không được phép làm thay phần này. Tôi đã sửa cách tiếp cận bằng..."

---

## Checklist Trả Lời
- [ ] Tôi có giải thích quá nhiều thứ code hiển nhiên (vòng lặp for, React state cở bản) mà bỏ quên cốt lõi nghiệp vụ hay không?
- [ ] Tôi có trình bày file đã sửa đi theo cặp BE/FE để đảm bảo tính đồng nhất không?
- [ ] Tôi có báo tin "ngoài luồng" nếu đụng mặt lỗi thiết kế bự nhưng chưa có cớ để sửa không?
