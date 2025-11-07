package com.backend.controller;

import com.backend.entity.FAQKnowledgeBase;
import com.backend.repository.FAQKnowledgeBaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/faqs")
public class FAQController {

    private static final Logger logger = LoggerFactory.getLogger(FAQController.class);

    @Autowired
    private FAQKnowledgeBaseRepository faqKnowledgeBaseRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getFAQs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "faq") String sourceType,
            @RequestParam(required = false) String category) {
        
        try {
            logger.info("Fetching FAQs - page: {}, size: {}, sourceType: {}, category: {}", page, size, sourceType, category);
            
            // Get all FAQs with the specified source type and category (if provided)
            List<FAQKnowledgeBase> allFAQs;
            if (category != null && !category.trim().isEmpty()) {
                // Filter by both source type and category
                List<FAQKnowledgeBase> bySourceType = faqKnowledgeBaseRepository.findBySourceType(sourceType);
                allFAQs = bySourceType.stream()
                    .filter(faq -> category.equalsIgnoreCase(faq.getCategory()))
                    .collect(java.util.stream.Collectors.toList());
            } else {
                allFAQs = faqKnowledgeBaseRepository.findBySourceType(sourceType);
            }
            
            // Manual pagination
            int totalItems = allFAQs.size();
            int totalPages = (int) Math.ceil((double) totalItems / size);
            int start = page * size;
            int end = Math.min(start + size, totalItems);
            
            List<FAQKnowledgeBase> paginatedFAQs = start < totalItems 
                ? allFAQs.subList(start, end)
                : List.of();
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", paginatedFAQs);
            response.put("totalElements", totalItems);
            response.put("totalPages", totalPages);
            response.put("size", size);
            response.put("number", page);
            response.put("first", page == 0);
            response.put("last", page >= totalPages - 1);
            response.put("numberOfElements", paginatedFAQs.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching FAQs: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching FAQs");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> getCategories(@RequestParam(defaultValue = "faq") String sourceType) {
        try {
            logger.info("Fetching FAQ categories for sourceType: {}", sourceType);
            
            // Get all FAQs with the specified source type
            List<FAQKnowledgeBase> allFAQs = faqKnowledgeBaseRepository.findBySourceType(sourceType);
            
            // Extract unique categories
            List<String> categories = allFAQs.stream()
                .map(FAQKnowledgeBase::getCategory)
                .filter(cat -> cat != null && !cat.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(java.util.stream.Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("categories", categories);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching FAQ categories: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching categories");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}

