package com.hotel.controller.api;

import com.hotel.entity.News;
import com.hotel.repository.NewsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news")

public class NewsApiController {

    @Autowired
    private NewsRepository newsRepository;

    // Lấy tất cả tin tức
    @GetMapping
    public List<News> getAllNews() {
        return newsRepository.findAll();
    }

    // Lấy top 4 tin mới nhất (dùng cho trang chủ)
    @GetMapping("/latest")
    public List<News> getLatestNews() {
        return newsRepository.findTop4ByOrderByIdDesc();
    }

    // Lấy chi tiết tin tức theo ID
    @GetMapping("/{id}")
    public News getNewsById(@PathVariable("id") int id) {
        return newsRepository.findById(id).orElse(null);
    }

    // ==========================================
    // API CỦA ADMIN (CRUD BẢNG TIN TỨC)
    // ==========================================
    @Autowired
    private com.hotel.service.SlugService slugService;

    @GetMapping("/admin")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> listNewsForAdmin(
            @RequestParam(value = "q", defaultValue = "") String q,
            @RequestParam(value = "page", defaultValue = "1") int page) {
        int pageSize = 5;
        org.springframework.data.domain.Page<News> newsPage = newsRepository.findWithSearch(
                q.isBlank() ? null : q,
                org.springframework.data.domain.PageRequest.of(page - 1, pageSize, org.springframework.data.domain.Sort.by("id").descending())
        );
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("newsList", newsPage.getContent());
        response.put("totalPages", newsPage.getTotalPages());
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @PostMapping("/admin")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> saveNews(@RequestBody News payload) {
        News news;
        if (payload.getId() != null && payload.getId() > 0) {
            news = newsRepository.findById(payload.getId().intValue()).orElse(new News());
        } else {
            news = new News();
        }
        news.setTitle(payload.getTitle());
        news.setSlug(slugService.createSlug(payload.getTitle()));
        news.setSummary(payload.getSummary());
        news.setContent(payload.getContent());
        news.setImage(payload.getImage());

        newsRepository.save(news);
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @DeleteMapping("/admin/{id}")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> deleteNews(@PathVariable("id") Integer id) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        try {
            newsRepository.deleteById(id);
            response.put("success", true);
        } catch (Exception e) {
            response.put("success", false);
        }
        return org.springframework.http.ResponseEntity.ok(response);
    }
}
