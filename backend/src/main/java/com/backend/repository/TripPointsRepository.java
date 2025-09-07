package com.backend.repository;

import com.backend.entity.TripPoints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TripPointsRepository extends JpaRepository<TripPoints, Long> {
}
