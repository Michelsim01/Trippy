package com.backend.repository;

import com.backend.entity.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

    @Query("SELECT rl FROM ReviewLike rl WHERE rl.review.reviewId = :reviewId AND rl.user.id = :userId")
    Optional<ReviewLike> findByReviewIdAndUserId(@Param("reviewId") Long reviewId, @Param("userId") Long userId);

    @Query("SELECT COUNT(rl) FROM ReviewLike rl WHERE rl.review.reviewId = :reviewId")
    Long countByReviewId(@Param("reviewId") Long reviewId);

    void deleteByReview_ReviewIdAndUser_Id(Long reviewId, Long userId);
}