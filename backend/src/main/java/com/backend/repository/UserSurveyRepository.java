package com.backend.repository;

import com.backend.entity.UserSurvey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserSurveyRepository extends JpaRepository<UserSurvey, Long> {
    Optional<UserSurvey> findByUser_Id(Long userId);
    boolean existsByUser_Id(Long userId);
}
