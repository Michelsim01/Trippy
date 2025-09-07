package com.backend.repository;

import com.backend.entity.TravelArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TravelArticleRepository extends JpaRepository<TravelArticle, Long> {
}
