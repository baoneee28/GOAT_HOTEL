package com.hotel.controller.admin;

import com.hotel.entity.News;
import com.hotel.repository.NewsRepository;
import com.hotel.service.FileUploadService;
import com.hotel.service.SlugService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;




// Controller quản lý danh mục Tin Tức/Bài Viết (Thêm, Sửa, Xóa tin tức)
@Controller
@RequestMapping("/admin/news")
@SuppressWarnings("null")
public class AdminNewsController {

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private SlugService slugService;

    private static final int PAGE_SIZE = 5;

    // Hàm tải danh sách tin tức (có thanh tìm kiếm và phân trang)
    @GetMapping
    public String listNews(@RequestParam(defaultValue = "") String q,
                           @RequestParam(defaultValue = "1") int page,
                           Model model) {
        // Gọi xuống DB lấy danh sách bài viết gán vào biến newsPage
        Page<News> newsPage = newsRepository.findWithSearch(
                q.isBlank() ? null : q,
                PageRequest.of(page - 1, PAGE_SIZE, Sort.by("id").descending()));

        model.addAttribute("newsList", newsPage.getContent());
        model.addAttribute("totalPages", newsPage.getTotalPages());
        model.addAttribute("currentPage", page);
        model.addAttribute("search", q);

        return "admin/news";
    }

    // Nhận dữ liệu từ form Thêm/Sửa tin tức
    @PostMapping(params = "action=save")
    public String saveNews(@RequestParam(required = false) Integer news_id,
                           @RequestParam String title,
                           @RequestParam String summary,
                           @RequestParam String content,
                           @RequestParam(required = false) String current_image,
                           @RequestParam(required = false) MultipartFile image) {
        News news;
        if (news_id != null && news_id > 0) {
            // Sửa bài viết cũ
            news = newsRepository.findById(news_id).orElse(new News());
        } else {
            // Viết bài mới
            news = new News();
        }

        news.setTitle(title);

        // Tạo đường dẫn thân thiện SEO (Ví dụ: "Khách sạn giảm giá" -> "khach-san-giam-gia")
        news.setSlug(slugService.createSlug(title));
        news.setSummary(summary);

        news.setContent(content);

        // Xu ly viec tai anh bia bai viet
        String imgName = current_image;
        // Neu nguoi dung co chon file anh moi
        if (image != null && !image.isEmpty()) {
            try {
                // FileUploadService xu ly va luu anh vao thu muc uploads ngoai classpath
                imgName = fileUploadService.uploadNews(image);
            } catch (Exception ignored) {}
        }
        news.setImage(imgName);

        newsRepository.save(news);
        return "redirect:/admin/news";
    }

    @PostMapping(params = "action=delete")
    public String deleteNews(@RequestParam Integer id) {
        newsRepository.deleteById(id);
        return "redirect:/admin/news";
    }
}
