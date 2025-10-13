package com.backend.controller;

import com.backend.entity.SupportTicket;
import com.backend.entity.SupportTicketStatus;
import com.backend.entity.TicketType;
import com.backend.entity.User;
import com.backend.repository.SupportTicketRepository;
import com.backend.repository.UserRepository;
import com.backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class SupportController {

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Public endpoint to create a support ticket.
     * Prioritizes logged-in users over form email.
     */
    @PostMapping("/tickets")
    public ResponseEntity<?> createTicket(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            String formEmail = (String) body.getOrDefault("userEmail", "");
            String formUserName = (String) body.getOrDefault("userName", "");
            String description = (String) body.getOrDefault("description", "");
            String ticketTypeStr = (String) body.getOrDefault("ticketType", "GENERAL_INQUIRY");

            // Debug logging
            System.out.println("=== DEBUG: createTicket called ===");
            System.out.println("Form email: " + formEmail);
            System.out.println("Form userName: " + formUserName);
            System.out.println("Description: " + description);
            System.out.println("TicketType: " + ticketTypeStr);

            User submittingUser = null;
            String finalUserEmail = formEmail;
            String finalUserName = formUserName;

            // Check for JWT token in Authorization header
            String authHeader = request.getHeader("Authorization");
            String authenticatedEmail = null;
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                System.out.println("Found JWT token in request");
                
                try {
                    if (jwtUtil.validateToken(token)) {
                        authenticatedEmail = jwtUtil.extractUsername(token);
                        System.out.println("Extracted email from JWT: " + authenticatedEmail);
                    } else {
                        System.out.println("Invalid JWT token");
                    }
                } catch (Exception e) {
                    System.out.println("Error validating JWT token: " + e.getMessage());
                }
            } else {
                System.out.println("No Authorization header found");
            }

            // Check if we have an authenticated user
            if (authenticatedEmail != null) {
                Optional<User> authenticatedUserOptional = userRepository.findByEmail(authenticatedEmail);
                if (authenticatedUserOptional.isPresent()) {
                    submittingUser = authenticatedUserOptional.get();
                    finalUserEmail = submittingUser.getEmail(); // Use authenticated user's email
                    finalUserName = submittingUser.getFirstName() + " " + submittingUser.getLastName(); // Use authenticated user's name
                    System.out.println("Using authenticated user: " + submittingUser.getEmail() + " (ID: " + submittingUser.getId() + ")");
                } else {
                    System.out.println("Authenticated email not found in database: " + authenticatedEmail);
                }
            } else {
                System.out.println("No authenticated user found, using form email");
                // If not authenticated, try to find user by email provided in the form
                Optional<User> userByFormEmail = userRepository.findByEmail(formEmail);
                if (userByFormEmail.isPresent()) {
                    submittingUser = userByFormEmail.get();
                    System.out.println("Found user by form email: " + submittingUser.getEmail() + " (ID: " + submittingUser.getId() + ")");
                }
            }

            if (finalUserEmail == null || finalUserEmail.isBlank() || description == null || description.isBlank() || finalUserName == null || finalUserName.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "userName, userEmail and description are required"));
            }

            TicketType ticketType = TicketType.valueOf(ticketTypeStr);

            SupportTicket ticket = new SupportTicket();
            ticket.setUserEmail(finalUserEmail); // Use authenticated user's email or found user's email
            ticket.setFormEmail(formEmail); // Always store the email typed in the form
            ticket.setUserName(finalUserName); // Use authenticated user's name or form name
            ticket.setDescription(description);
            ticket.setTicketType(ticketType);
            ticket.setStatus(SupportTicketStatus.OPEN);

            if (submittingUser != null) {
                ticket.setUser(submittingUser);
            }

            System.out.println("Ticket before save:");
            System.out.println("  userEmail: " + ticket.getUserEmail());
            System.out.println("  formEmail: " + ticket.getFormEmail());
            System.out.println("  userName: " + ticket.getUserName());
            System.out.println("  userId: " + (submittingUser != null ? submittingUser.getId() : "null"));

            SupportTicket savedTicket = supportTicketRepository.save(ticket);
            System.out.println("Ticket saved with ID: " + savedTicket.getId());
            return ResponseEntity.ok(Map.of("message", "Ticket created", "ticketId", savedTicket.getId()));
        } catch (Exception e) {
            System.err.println("Error creating ticket: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Public endpoint to check if a user (by email) is suspended.
     */
    @GetMapping("/suspension-status")
    public ResponseEntity<?> checkSuspension(@RequestParam("email") String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("exists", false, "isActive", true));
        }
        User user = userOpt.get();
        boolean isActive = user.getIsActive() == null || user.getIsActive();
        return ResponseEntity.ok(Map.of("exists", true, "isActive", isActive, "userId", user.getId()));
    }
}


