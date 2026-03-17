package com.hotel.controller;

import com.hotel.entity.News;
import com.hotel.repository.NewsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;


// Controller xem chi tiết 1 bài báo/tin tức
@Controller
@SuppressWarnings("null")
public class NewsController {

    @Autowired
    private NewsRepository newsRepository;

    // Link khi người dùhg click vào 1 bài tin tức, VD: /news/10
    @GetMapping("/news/{id}")
    public String newsDetail(@PathVariable Integer id, Model model) {
        // Tìm bài viết theo mã ID
        Optional<News> newsOpt = newsRepository.findById(id);
        if (newsOpt.isEmpty()) {
            return "redirect:/"; // Bài báo bị xóa -> đá về trang chủ
        }

        News news = newsOpt.get();

        // Tìm thêm 5 bài báo MỚI NHẤT (của người khác) để làm mục "Tin tức liên quan" ở bên rìa phải
        List<News> relatedNews = newsRepository.findOtherNews(id, PageRequest.of(0, 5));

        model.addAttribute("news", news);
        model.addAttribute("related_news", relatedNews);

        return "news-detail";
    }
}
