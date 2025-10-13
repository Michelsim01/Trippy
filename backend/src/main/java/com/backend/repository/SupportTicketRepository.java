package com.backend.repository;

import com.backend.entity.SupportTicket;
import com.backend.entity.SupportTicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    
    /**
     * Count tickets by status
     */
    long countByStatus(SupportTicketStatus status);
    
    /**
     * Find tickets assigned to a specific admin
     */
    @Query("SELECT t FROM SupportTicket t WHERE t.assignedTo = :adminUserId ORDER BY t.createdAt DESC")
    List<SupportTicket> findByAssignedToOrderByCreatedAtDesc(Long adminUserId);
    
    /**
     * Find unassigned tickets (OPEN status with no assigned admin)
     */
    @Query("SELECT t FROM SupportTicket t WHERE t.status = 'OPEN' AND t.assignedTo IS NULL ORDER BY t.createdAt ASC")
    List<SupportTicket> findUnassignedOpenTicketsOrderByCreatedAtAsc();
}


