package com.backend.repository;

import com.backend.entity.Transaction;
import com.backend.entity.TransactionStatus;
import com.backend.entity.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByBookingBookingId(Long bookingId);

    List<Transaction> findByBookingBookingIdOrderByCreatedAtDesc(Long bookingId);

    List<Transaction> findByBookingBookingIdAndType(Long bookingId, TransactionType type);

    List<Transaction> findByBookingBookingIdAndTypeOrderByCreatedAtDesc(Long bookingId, TransactionType type);

    List<Transaction> findByBookingContactEmailOrderByCreatedAtDesc(String contactEmail);

    @Query(value = "SELECT * FROM transaction t WHERE t.booking_id = :bookingId AND t.type = :type ORDER BY t.created_at DESC LIMIT 1", nativeQuery = true)
    Optional<Transaction> findLatestByBookingIdAndType(@Param("bookingId") Long bookingId, @Param("type") String type);

    List<Transaction> findByStatusOrderByCreatedAtDesc(TransactionStatus status);

    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.booking.bookingId = :bookingId AND t.type = :type AND t.status = :status")
    List<Transaction> findByBookingIdTypeAndStatus(@Param("bookingId") Long bookingId,
            @Param("type") TransactionType type,
            @Param("status") TransactionStatus status);

}
