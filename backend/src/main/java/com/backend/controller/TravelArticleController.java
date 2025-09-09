package com.backend.controller;

import com.backend.entity.TravelArticle;
import com.backend.repository.TravelArticleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/travel-articles")
public class TravelArticleController {
    @Autowired
    private TravelArticleRepository travelArticleRepository;

    @GetMapping
    public List<TravelArticle> getAllTravelArticles() {
        return travelArticleRepository.findAll();
    }

    @GetMapping("/{id}")
    public TravelArticle getTravelArticleById(@PathVariable Long id) {
        return travelArticleRepository.findById(id).orElse(null);
    }

    @PostMapping
    public TravelArticle createTravelArticle(@RequestBody TravelArticle travelArticle) {
        return travelArticleRepository.save(travelArticle);
    }

    @PutMapping("/{id}")
    public TravelArticle updateTravelArticle(@PathVariable Long id, @RequestBody TravelArticle travelArticle) {
        travelArticle.setArticleId(id);
        return travelArticleRepository.save(travelArticle);
    }

    @DeleteMapping("/{id}")
    public void deleteTravelArticle(@PathVariable Long id) {
        travelArticleRepository.deleteById(id);
    }
}
