package com.backend.repository;

import com.backend.entity.CohortMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CohortMemberRepository extends JpaRepository<CohortMember, Long> {
}
