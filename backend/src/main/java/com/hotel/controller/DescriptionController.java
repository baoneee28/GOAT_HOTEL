package com.hotel.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/description")
public class DescriptionController {

    @GetMapping
    public Map<String, String> getDescription() {
        Map<String, String> response = new HashMap<>();
        try {
            Path path = Paths.get("description.txt"); 
            if (Files.exists(path)) {
                String content = new String(Files.readAllBytes(path), "UTF-8");
                response.put("content", content);
            } else {
                response.put("content", "Welcome to GOAT HOTEL. A premier destination for luxury and relaxation.");
            }
        } catch (Exception e) {
            response.put("content", "Error loading description.");
            response.put("error", e.getMessage());
        }
        return response;
    }
}
