package com.backend.controller;

import com.backend.entity.Transaction;
import com.backend.entity.TransactionType;
import com.backend.entity.TransactionStatus;
import com.backend.repository.TransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private TransactionController transactionController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(transactionController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void getTransactionById_Success() throws Exception {
        // Arrange
        Long transactionId = 1L;
        Transaction transaction = createTestTransaction(transactionId);
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(transaction));

        // Act & Assert
        mockMvc.perform(get("/api/transactions/{transactionId}", transactionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value(transactionId))
                .andExpect(jsonPath("$.type").value("PAYMENT"))
                .andExpect(jsonPath("$.amount").value(100.0));

        verify(transactionRepository).findById(transactionId);
    }

    @Test
    void getTransactionById_NotFound() throws Exception {
        // Arrange
        Long transactionId = 999L;
        when(transactionRepository.findById(transactionId)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/transactions/{transactionId}", transactionId))
                .andExpect(status().isNotFound());

        verify(transactionRepository).findById(transactionId);
    }

    @Test
    void getTransactionById_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/transactions/{transactionId}", -1L))
                .andExpect(status().isBadRequest());

        verify(transactionRepository, never()).findById(any());
    }

    @Test
    void getTransactionById_Exception() throws Exception {
        // Arrange
        Long transactionId = 1L;
        when(transactionRepository.findById(transactionId)).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(get("/api/transactions/{transactionId}", transactionId))
                .andExpect(status().isInternalServerError());

        verify(transactionRepository).findById(transactionId);
    }

    @Test
    void getTransactionsByBooking_Success() throws Exception {
        // Arrange
        Long bookingId = 1L;
        List<Transaction> transactions = Arrays.asList(
                createTestTransaction(1L),
                createTestTransaction(2L)
        );
        when(transactionRepository.findByBookingBookingIdOrderByCreatedAtDesc(bookingId)).thenReturn(transactions);

        // Act & Assert
        mockMvc.perform(get("/api/transactions/booking/{bookingId}", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(transactionRepository).findByBookingBookingIdOrderByCreatedAtDesc(bookingId);
    }

    @Test
    void getTransactionsByBooking_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/transactions/booking/{bookingId}", -1L))
                .andExpect(status().isBadRequest());

        verify(transactionRepository, never()).findByBookingBookingIdOrderByCreatedAtDesc(any());
    }

    @Test
    void getTransactionsByUserEmail_Success() throws Exception {
        // Arrange
        String email = "test@example.com";
        List<Transaction> transactions = Arrays.asList(createTestTransaction(1L));
        when(transactionRepository.findByBookingContactEmailOrderByCreatedAtDesc(email)).thenReturn(transactions);

        // Act & Assert
        mockMvc.perform(get("/api/transactions/user/{email}", email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));

        verify(transactionRepository).findByBookingContactEmailOrderByCreatedAtDesc(email);
    }

    @Test
    void getTransactionsByUserEmail_EmptyEmail() throws Exception {
        // Act & Assert - Empty string in path variable results in 404 (not found)
        // because Spring doesn't match the URL pattern /api/transactions/user/{email}
        // when email is empty, resulting in /api/transactions/user/
        mockMvc.perform(get("/api/transactions/user/{email}", ""))
                .andExpect(status().isNotFound());

        verify(transactionRepository, never()).findByBookingContactEmailOrderByCreatedAtDesc(any());
    }

    @Test
    void getTransactionsByUserEmail_WhitespaceEmail() throws Exception {
        // Act & Assert - Whitespace email reaches controller and gets validated
        mockMvc.perform(get("/api/transactions/user/{email}", "   "))
                .andExpect(status().isBadRequest());

        verify(transactionRepository, never()).findByBookingContactEmailOrderByCreatedAtDesc(any());
    }

    @Test
    void getPaymentTransactionsByBooking_Success() throws Exception {
        // Arrange
        Long bookingId = 1L;
        List<Transaction> transactions = Arrays.asList(createTestTransaction(1L));
        when(transactionRepository.findByBookingBookingIdAndTypeOrderByCreatedAtDesc(bookingId, TransactionType.PAYMENT))
                .thenReturn(transactions);

        // Act & Assert
        mockMvc.perform(get("/api/transactions/booking/{bookingId}/payments", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));

        verify(transactionRepository).findByBookingBookingIdAndTypeOrderByCreatedAtDesc(bookingId, TransactionType.PAYMENT);
    }

    @Test
    void getRefundTransactionsByBooking_Success() throws Exception {
        // Arrange
        Long bookingId = 1L;
        Transaction refundTransaction = createTestTransaction(1L);
        refundTransaction.setType(TransactionType.REFUND);
        List<Transaction> transactions = Arrays.asList(refundTransaction);
        when(transactionRepository.findByBookingBookingIdAndTypeOrderByCreatedAtDesc(bookingId, TransactionType.REFUND))
                .thenReturn(transactions);

        // Act & Assert
        mockMvc.perform(get("/api/transactions/booking/{bookingId}/refunds", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));

        verify(transactionRepository).findByBookingBookingIdAndTypeOrderByCreatedAtDesc(bookingId, TransactionType.REFUND);
    }

    @Test
    void getPaymentTransactionsByBooking_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/transactions/booking/{bookingId}/payments", -1L))
                .andExpect(status().isBadRequest());

        verify(transactionRepository, never()).findByBookingBookingIdAndTypeOrderByCreatedAtDesc(any(), any());
    }

    @Test
    void getRefundTransactionsByBooking_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/transactions/booking/{bookingId}/refunds", -1L))
                .andExpect(status().isBadRequest());

        verify(transactionRepository, never()).findByBookingBookingIdAndTypeOrderByCreatedAtDesc(any(), any());
    }

    @Test
    void getTransactionsByBooking_Exception() throws Exception {
        // Arrange
        Long bookingId = 1L;
        when(transactionRepository.findByBookingBookingIdOrderByCreatedAtDesc(bookingId))
                .thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(get("/api/transactions/booking/{bookingId}", bookingId))
                .andExpect(status().isInternalServerError());

        verify(transactionRepository).findByBookingBookingIdOrderByCreatedAtDesc(bookingId);
    }

    @Test
    void getTransactionsByUserEmail_Exception() throws Exception {
        // Arrange
        String email = "test@example.com";
        when(transactionRepository.findByBookingContactEmailOrderByCreatedAtDesc(email))
                .thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(get("/api/transactions/user/{email}", email))
                .andExpect(status().isInternalServerError());

        verify(transactionRepository).findByBookingContactEmailOrderByCreatedAtDesc(email);
    }

    @Test
    void getPaymentTransactionsByBooking_Exception() throws Exception {
        // Arrange
        Long bookingId = 1L;
        when(transactionRepository.findByBookingBookingIdAndTypeOrderByCreatedAtDesc(bookingId, TransactionType.PAYMENT))
                .thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(get("/api/transactions/booking/{bookingId}/payments", bookingId))
                .andExpect(status().isInternalServerError());

        verify(transactionRepository).findByBookingBookingIdAndTypeOrderByCreatedAtDesc(bookingId, TransactionType.PAYMENT);
    }

    // Helper methods
    private Transaction createTestTransaction(Long id) {
        Transaction transaction = new Transaction();
        transaction.setTransactionId(id);
        transaction.setType(TransactionType.PAYMENT);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setAmount(BigDecimal.valueOf(100.0));
        transaction.setPaymentMethod("CREDIT_CARD");
        transaction.setLastFourDigits("1234");
        transaction.setCardBrand("VISA");
        transaction.setCreatedAt(LocalDateTime.now());
        return transaction;
    }
}