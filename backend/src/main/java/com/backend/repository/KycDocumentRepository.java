package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.backend.entity.KycDocument;
import com.backend.entity.User;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {
    List<KycDocument> findByUser(User user);
    KycDocument findTopByUserOrderBySubmittedAtDesc(User user);
}
