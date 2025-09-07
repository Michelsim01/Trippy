package com.backend.repository;

import com.backend.entity.ExperienceMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExperienceMediaRepository extends JpaRepository<ExperienceMedia, Long> {
}
