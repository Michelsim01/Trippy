package com.backend.repository;

import com.backend.entity.TripCohort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TripCohortRepository extends JpaRepository<TripCohort, Long> {
}
