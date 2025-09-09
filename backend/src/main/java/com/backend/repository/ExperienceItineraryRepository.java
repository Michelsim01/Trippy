package com.backend.repository;

import com.backend.entity.ExperienceItinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExperienceItineraryRepository extends JpaRepository<ExperienceItinerary, Long> {
}
