package com.backend.controller;

import com.backend.dto.PaymentTransactionDTO;
import com.backend.entity.Transaction;
import com.backend.entity.TransactionType;
import com.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    /**
     * Get transaction details by transaction ID
     * Returns PaymentTransactionDTO for security (no sensitive internal data)
     * 
     * @param transactionId the ID of the transaction to retrieve
     * @return PaymentTransactionDTO with transaction details
     */
    @GetMapping("/{transactionId}")
    public ResponseEntity<PaymentTransactionDTO> getTransactionById(@PathVariable Long transactionId) {
        try {
            if (transactionId == null || transactionId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            Optional<Transaction> transaction = transactionRepository.findById(transactionId);
            if (transaction.isPresent()) {
                PaymentTransactionDTO dto = convertToPaymentTransactionDTO(transaction.get());
                return ResponseEntity.ok(dto);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving transaction with ID " + transactionId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all transactions for a specific booking
     * Useful for checkout process to show payment history
     * 
     * @param bookingId the ID of the booking
     * @return List of PaymentTransactionDTO for the booking
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<PaymentTransactionDTO>> getTransactionsByBooking(@PathVariable Long bookingId) {
        try {
            if (bookingId == null || bookingId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<Transaction> transactions = transactionRepository
                    .findByBookingBookingIdOrderByCreatedAtDesc(bookingId);
            List<PaymentTransactionDTO> transactionDTOs = transactions.stream()
                    .map(this::convertToPaymentTransactionDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(transactionDTOs);
        } catch (Exception e) {
            System.err.println("Error retrieving transactions for booking " + bookingId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all transactions for a user by their email
     * Useful for user transaction history in account section
     * 
     * @param email the email of the user
     * @return List of PaymentTransactionDTO for the user
     */
    @GetMapping("/user/{email}")
    public ResponseEntity<List<PaymentTransactionDTO>> getTransactionsByUserEmail(@PathVariable String email) {
        try {
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            List<Transaction> transactions = transactionRepository.findByBookingContactEmailOrderByCreatedAtDesc(email);
            List<PaymentTransactionDTO> transactionDTOs = transactions.stream()
                    .map(this::convertToPaymentTransactionDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(transactionDTOs);
        } catch (Exception e) {
            System.err.println("Error retrieving transactions for user " + email + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get payment transactions only (excludes refunds)
     * Useful for checkout completion pages
     * 
     * @param bookingId the ID of the booking
     * @return List of payment transactions only
     */
    @GetMapping("/booking/{bookingId}/payments")
    public ResponseEntity<List<PaymentTransactionDTO>> getPaymentTransactionsByBooking(@PathVariable Long bookingId) {
        try {
            if (bookingId == null || bookingId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<Transaction> transactions = transactionRepository.findByBookingBookingIdAndTypeOrderByCreatedAtDesc(
                    bookingId, TransactionType.PAYMENT);
            List<PaymentTransactionDTO> transactionDTOs = transactions.stream()
                    .map(this::convertToPaymentTransactionDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(transactionDTOs);
        } catch (Exception e) {
            System.err
                    .println("Error retrieving payment transactions for booking " + bookingId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get refund transactions only
     * Useful for customer service and refund tracking
     * 
     * @param bookingId the ID of the booking
     * @return List of refund transactions only
     */
    @GetMapping("/booking/{bookingId}/refunds")
    public ResponseEntity<List<PaymentTransactionDTO>> getRefundTransactionsByBooking(@PathVariable Long bookingId) {
        try {
            if (bookingId == null || bookingId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<Transaction> transactions = transactionRepository.findByBookingBookingIdAndTypeOrderByCreatedAtDesc(
                    bookingId, TransactionType.REFUND);
            List<PaymentTransactionDTO> transactionDTOs = transactions.stream()
                    .map(this::convertToPaymentTransactionDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(transactionDTOs);
        } catch (Exception e) {
            System.err.println("Error retrieving refund transactions for booking " + bookingId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Helper method to convert Transaction entity to PaymentTransactionDTO
     * Filters out sensitive internal data
     */
    private PaymentTransactionDTO convertToPaymentTransactionDTO(Transaction transaction) {
        return new PaymentTransactionDTO(
                transaction.getTransactionId(),
                transaction.getType(),
                transaction.getStatus(),
                transaction.getAmount(),
                transaction.getPaymentMethod(),
                transaction.getLastFourDigits(),
                transaction.getCardBrand(),
                transaction.getCreatedAt());
    }

    // NOTE: Dangerous operations (POST, PUT, DELETE) have been removed for security
    // Transactions should only be created/modified through PaymentService
}
