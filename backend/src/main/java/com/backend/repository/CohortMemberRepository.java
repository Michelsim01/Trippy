package com.backend.repository;

import com.backend.entity.Booking;
import com.backend.entity.CohortMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CohortMemberRepository extends JpaRepository<CohortMember, Long> {
    List<CohortMember> findByBooking(Booking booking);
}
