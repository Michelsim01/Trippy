package com.backend.controller;

import com.backend.entity.SupportTicket;
import com.backend.entity.SupportTicketStatus;
import com.backend.entity.User;
import com.backend.repository.SupportTicketRepository;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/tickets")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AdminSupportController {

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Helper method to populate admin information for tickets
     *
     * @param tickets List of tickets to populate admin info for
     */
    private void populateAdminInfo(List<SupportTicket> tickets) {
        for (SupportTicket ticket : tickets) {
            if (ticket.getAssignedTo() != null) {
                Optional<User> adminUser = userRepository.findById(ticket.getAssignedTo());
                if (adminUser.isPresent()) {
                    User admin = adminUser.get();
                    ticket.setAssignedAdminEmail(admin.getEmail());
                    ticket.setAssignedAdminName(admin.getFirstName() + " " + admin.getLastName());
                }
            }
        }
    }

    /**
     * Helper method to get the currently authenticated admin user ID
     *
     * @return Admin user ID if authenticated, null otherwise
     */
    private Long getCurrentAdminUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("=== DEBUG: getCurrentAdminUserId ===");
            System.out.println("Authentication: " + authentication);
            System.out.println("Is authenticated: " + (authentication != null && authentication.isAuthenticated()));
            
            if (authentication != null && authentication.isAuthenticated()) {
                System.out.println("Principal type: " + authentication.getPrincipal().getClass().getName());
                System.out.println("Principal: " + authentication.getPrincipal());
                
                if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                    org.springframework.security.core.userdetails.UserDetails userDetails = (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
                    String email = userDetails.getUsername();
                    System.out.println("Email from UserDetails: " + email);

                    Optional<User> userOpt = userRepository.findByEmailAndIsActive(email, true);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        System.out.println("Found user: " + user.getEmail() + ", isAdmin: " + user.getIsAdmin() + ", ID: " + user.getId());
                        if (user.getIsAdmin()) {
                            System.out.println("Returning admin user ID: " + user.getId());
                            return user.getId();
                        } else {
                            System.out.println("User is not an admin!");
                        }
                    } else {
                        System.out.println("No user found for email: " + email);
                        // Let's also try without the isActive filter
                        Optional<User> userOpt2 = userRepository.findByEmail(email);
                        if (userOpt2.isPresent()) {
                            User user2 = userOpt2.get();
                            System.out.println("Found user (inactive): " + user2.getEmail() + ", isAdmin: " + user2.getIsAdmin() + ", isActive: " + user2.getIsActive());
                        }
                    }
                }
            }
            System.out.println("=== END DEBUG ===");
        } catch (Exception e) {
            System.err.println("Error getting authenticated admin user: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Get ticket management metrics for admin dashboard
     */
    @GetMapping("/metrics")
    public ResponseEntity<?> getTicketMetrics() {
        try {
            long totalTickets = supportTicketRepository.count();
            long openTickets = supportTicketRepository.countByStatus(SupportTicketStatus.OPEN);
            long inProgressTickets = supportTicketRepository.countByStatus(SupportTicketStatus.IN_PROGRESS);
            long resolvedTickets = supportTicketRepository.countByStatus(SupportTicketStatus.RESOLVED);
            long closedTickets = supportTicketRepository.countByStatus(SupportTicketStatus.CLOSED);

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalTickets", totalTickets);
            metrics.put("openTickets", openTickets);
            metrics.put("inProgressTickets", inProgressTickets);
            metrics.put("resolvedTickets", resolvedTickets);
            metrics.put("closedTickets", closedTickets);

            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Test endpoint to verify controller is working
     */
    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        return ResponseEntity.ok(Map.of("message", "AdminSupportController is working"));
    }

    /**
     * Get all support tickets for admin management
     */
    @GetMapping
    public ResponseEntity<?> getAllTickets() {
        try {
            System.out.println("=== DEBUG: AdminSupportController.getAllTickets called ===");
            System.out.println("Repository: " + supportTicketRepository);
            
            List<SupportTicket> tickets = supportTicketRepository.findAll();
            tickets.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            System.out.println("Found " + tickets.size() + " tickets");
            
            // Populate admin information for assigned tickets
            populateAdminInfo(tickets);
            
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            System.err.println("Error in getAllTickets: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get tickets assigned to the current admin
     */
    @GetMapping("/my-tickets")
    public ResponseEntity<?> getMyTickets() {
        try {
            Long adminUserId = getCurrentAdminUserId();
            if (adminUserId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Admin not authenticated"));
            }
            
            System.out.println("=== DEBUG: getMyTickets called ===");
            System.out.println("Admin user ID: " + adminUserId);
            
            // Debug: Check all tickets and their assignedTo values
            List<SupportTicket> allTickets = supportTicketRepository.findAll();
            System.out.println("All tickets in database:");
            for (SupportTicket ticket : allTickets) {
                System.out.println("  Ticket " + ticket.getId() + ": assignedTo=" + ticket.getAssignedTo() + ", status=" + ticket.getStatus());
            }
            
            List<SupportTicket> tickets = supportTicketRepository.findByAssignedToOrderByCreatedAtDesc(adminUserId);
            System.out.println("Found " + tickets.size() + " tickets for admin user ID: " + adminUserId);
            
            // Populate admin information for assigned tickets
            populateAdminInfo(tickets);
            
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            System.err.println("Error in getMyTickets: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Take a ticket (assign to current admin and set status to IN_PROGRESS)
     */
    @PutMapping("/{ticketId}/take")
    public ResponseEntity<?> takeTicket(@PathVariable Long ticketId) {
        try {
            Long adminUserId = getCurrentAdminUserId();
            if (adminUserId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Admin not authenticated"));
            }

            System.out.println("=== DEBUG: takeTicket called ===");
            System.out.println("Ticket ID: " + ticketId);
            System.out.println("Admin user ID: " + adminUserId);

            Optional<SupportTicket> ticketOpt = supportTicketRepository.findById(ticketId);
            if (ticketOpt.isEmpty()) {
                System.out.println("Ticket not found: " + ticketId);
                return ResponseEntity.notFound().build();
            }

            SupportTicket ticket = ticketOpt.get();
            System.out.println("Found ticket: " + ticket.getId() + ", Status: " + ticket.getStatus() + ", AssignedTo: " + ticket.getAssignedTo());
            
            // Check if ticket is already assigned
            if (ticket.getAssignedTo() != null) {
                System.out.println("Ticket already assigned to user ID: " + ticket.getAssignedTo());
                return ResponseEntity.badRequest().body(Map.of("error", "Ticket is already assigned to another admin"));
            }
            
            // Check if ticket is OPEN
            if (ticket.getStatus() != SupportTicketStatus.OPEN) {
                System.out.println("Ticket not OPEN, current status: " + ticket.getStatus());
                return ResponseEntity.badRequest().body(Map.of("error", "Only OPEN tickets can be taken"));
            }

            ticket.setAssignedTo(adminUserId);
            ticket.setStatus(SupportTicketStatus.IN_PROGRESS);
            SupportTicket updatedTicket = supportTicketRepository.save(ticket);

            System.out.println("Ticket assigned successfully to user ID: " + adminUserId);
            return ResponseEntity.ok(updatedTicket);
        } catch (Exception e) {
            System.err.println("Error in takeTicket: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update ticket status
     */
    @PutMapping("/{ticketId}/status")
    public ResponseEntity<?> updateTicketStatus(@PathVariable Long ticketId, @RequestBody Map<String, String> request) {
        try {
            String statusStr = request.get("status");
            if (statusStr == null || statusStr.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }

            SupportTicketStatus status;
            try {
                status = SupportTicketStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + statusStr));
            }

            Optional<SupportTicket> ticketOpt = supportTicketRepository.findById(ticketId);
            if (ticketOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            SupportTicket ticket = ticketOpt.get();
            ticket.setStatus(status);
            SupportTicket updatedTicket = supportTicketRepository.save(ticket);

            return ResponseEntity.ok(updatedTicket);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a support ticket
     */
    @DeleteMapping("/{ticketId}")
    public ResponseEntity<?> deleteTicket(@PathVariable Long ticketId) {
        try {
            Optional<SupportTicket> ticketOpt = supportTicketRepository.findById(ticketId);
            if (ticketOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            supportTicketRepository.deleteById(ticketId);
            return ResponseEntity.ok(Map.of("message", "Ticket deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
