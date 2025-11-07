package com.backend.repository;

import com.backend.entity.UserReport;
import com.backend.entity.UserReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserReportRepository extends JpaRepository<UserReport, Long> {
    List<UserReport> findByUserId(Long userId);
    List<UserReport> findByReportedUserId(Long reportedUserId);
    List<UserReport> findByStatus(UserReportStatus status);
    Optional<UserReport> findByUserIdAndReportedUserId(Long userId, Long reportedUserId);
}


