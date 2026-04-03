package com.hotel.controller.api;

import com.hotel.entity.FeaturedNews;
import com.hotel.entity.News;
import com.hotel.repository.FeaturedNewsRepository;
import com.hotel.repository.NewsRepository;
import com.hotel.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/news")

public class NewsApiController {

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private FeaturedNewsRepository featuredNewsRepository;

    @Autowired
    private FileUploadService fileUploadService;

    // Lấy tất cả tin tức
    @GetMapping
    public List<News> getAllNews() {
        return newsRepository.findAllLatestFirst();
    }

    // Lấy top 4 tin mới nhất (dùng cho trang chủ)
    @GetMapping("/latest")
    public List<News> getLatestNews() {
        return newsRepository.findTop4ByOrderByIdDesc();
    }

    // Lấy chi tiết tin tức theo ID
    @GetMapping("/{idOrSlug}")
    public ResponseEntity<News> getNewsByIdOrSlug(@PathVariable("idOrSlug") String idOrSlug) {
        try {
            Integer id = Integer.parseInt(idOrSlug);
            return newsRepository.findById(id)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (NumberFormatException ignored) {
            return newsRepository.findBySlug(idOrSlug)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        }
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
        response.put("currentPage", page);
        response.put("featuredNews", featuredNewsRepository.findAllByOrderByDisplayOrderAsc());
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

    @PostMapping("/admin/featured/{newsId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> addFeaturedNews(@PathVariable("newsId") Integer newsId) {
        Map<String, Object> response = new HashMap<>();

        News news = newsRepository.findById(newsId).orElse(null);
        if (news == null) {
            response.put("success", false);
            response.put("message", "Không tìm thấy bài viết để đưa lên bản tin nổi bật.");
            return ResponseEntity.status(404).body(response);
        }

        if (featuredNewsRepository.findByNews_Id(newsId).isPresent()) {
            response.put("success", true);
            response.put("message", "Bài viết này đã có trong danh sách nổi bật.");
            response.put("featuredNews", featuredNewsRepository.findAllByOrderByDisplayOrderAsc());
            return ResponseEntity.ok(response);
        }

        FeaturedNews featuredNews = new FeaturedNews();
        featuredNews.setNews(news);
        featuredNews.setDisplayOrder(featuredNewsRepository.findAllByOrderByDisplayOrderAsc().size());
        featuredNewsRepository.save(featuredNews);

        response.put("success", true);
        response.put("message", "Đã thêm bài viết vào bản tin nổi bật.");
        response.put("featuredNews", featuredNewsRepository.findAllByOrderByDisplayOrderAsc());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/admin/featured/{featuredId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> removeFeaturedNews(@PathVariable("featuredId") Integer featuredId) {
        Map<String, Object> response = new HashMap<>();
        Optional<FeaturedNews> featuredNewsOpt = featuredNewsRepository.findById(featuredId);

        if (featuredNewsOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Không tìm thấy mục nổi bật cần gỡ.");
            return ResponseEntity.status(404).body(response);
        }

        featuredNewsRepository.delete(featuredNewsOpt.get());
        normalizeFeaturedDisplayOrder();

        response.put("success", true);
        response.put("message", "Đã gỡ bài viết khỏi bản tin nổi bật.");
        response.put("featuredNews", featuredNewsRepository.findAllByOrderByDisplayOrderAsc());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/admin/featured/reorder")
    @Transactional
    public ResponseEntity<Map<String, Object>> reorderFeaturedNews(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        Object featuredIdsRaw = payload.get("featuredIds");

        if (!(featuredIdsRaw instanceof List<?> featuredIdsList)) {
            response.put("success", false);
            response.put("message", "Danh sách thứ tự nổi bật không hợp lệ.");
            return ResponseEntity.badRequest().body(response);
        }

        List<FeaturedNews> currentFeatured = featuredNewsRepository.findAllByOrderByDisplayOrderAsc();
        if (featuredIdsList.size() != currentFeatured.size()) {
            response.put("success", false);
            response.put("message", "Danh sách thứ tự không đầy đủ.");
            return ResponseEntity.badRequest().body(response);
        }

        Map<Integer, FeaturedNews> featuredById = new HashMap<>();
        currentFeatured.forEach(entry -> featuredById.put(entry.getId(), entry));

        List<FeaturedNews> reordered = new ArrayList<>();
        Set<Integer> seenFeaturedIds = new HashSet<>();
        for (Object featuredIdValue : featuredIdsList) {
            Integer featuredId = parseInteger(featuredIdValue);
            if (featuredId == null || !featuredById.containsKey(featuredId) || !seenFeaturedIds.add(featuredId)) {
                response.put("success", false);
                response.put("message", "Danh sách thứ tự có chứa mục không tồn tại.");
                return ResponseEntity.badRequest().body(response);
            }
            reordered.add(featuredById.get(featuredId));
        }

        for (int index = 0; index < reordered.size(); index++) {
            reordered.get(index).setDisplayOrder(index);
        }
        featuredNewsRepository.saveAll(reordered);

        response.put("success", true);
        response.put("message", "Đã cập nhật thứ tự bản tin nổi bật.");
        response.put("featuredNews", featuredNewsRepository.findAllByOrderByDisplayOrderAsc());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/admin/{id}")
    @Transactional
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> deleteNews(@PathVariable("id") Integer id) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        News news = newsRepository.findById(id).orElse(null);
        if (news == null) {
            response.put("success", false);
            response.put("message", "Bài viết không tồn tại.");
            return ResponseEntity.status(404).body(response);
        }

        String image = news.getImage();
        boolean shouldDeleteImage = image != null && !image.isBlank() && newsRepository.countByImage(image) <= 1;

        try {
            featuredNewsRepository.findByNews_Id(id).ifPresent(featuredNewsRepository::delete);
            newsRepository.delete(news);
            newsRepository.flush();
            normalizeFeaturedDisplayOrder();

            if (shouldDeleteImage) {
                fileUploadService.deleteUploadedFile(image);
            }

            response.put("success", true);
            response.put("message", "Đã xóa bài viết và dọn dữ liệu liên quan.");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Không thể xóa bài viết này lúc này.");
        }
        return org.springframework.http.ResponseEntity.ok(response);
    }

    private void normalizeFeaturedDisplayOrder() {
        List<FeaturedNews> featuredNewsList = featuredNewsRepository.findAllByOrderByDisplayOrderAsc();
        for (int index = 0; index < featuredNewsList.size(); index++) {
            featuredNewsList.get(index).setDisplayOrder(index);
        }
        if (!featuredNewsList.isEmpty()) {
            featuredNewsRepository.saveAll(featuredNewsList);
        }
    }

    private Integer parseInteger(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
