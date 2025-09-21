package com.backend.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.backend.entity.KycDocument;
import com.backend.entity.KycStatus;
import com.backend.entity.StatusType;
import com.backend.repository.KycDocumentRepository;
import com.backend.repository.UserRepository;
import com.backend.entity.User;
import java.util.Optional;

@Service
public class KycService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private KycDocumentRepository kycDocumentRepository;

    // Submit a new KYC document
    public User submitKyc(Long userId, KycDocument kycDoc) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        kycDoc.setUser(user);
        kycDoc.setStatus(com.backend.entity.StatusType.PENDING); // use your StatusType enum for document
        kycDoc.setSubmittedAt(LocalDateTime.now());
        kycDoc.setCreatedAt(LocalDateTime.now());
        kycDoc.setUpdatedAt(LocalDateTime.now());
        kycDocumentRepository.save(kycDoc);

        user.setKycStatus(KycStatus.PENDING); // set user's KYC status to PENDING
        userRepository.save(user);

        return user;
    }

    public KycStatus getKycStatus(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        return userOpt.map(User::getKycStatus).orElse(KycStatus.NOT_STARTED);
    }

    public Map<String, Object> getKycStatusDetails(Long userId) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            response.put("kycStatus", "NOT_STARTED");
            return response;
        }

        User user = userOpt.get();
        response.put("kycStatus", user.getKycStatus().name());

        // Get the latest KYC document for additional details
        KycDocument latestDoc = kycDocumentRepository.findTopByUserOrderBySubmittedAtDesc(user);
        if (latestDoc != null) {
            response.put("submittedAt", latestDoc.getSubmittedAt());
            response.put("reviewedAt", latestDoc.getReviewedAt());
            response.put("rejectionReason", latestDoc.getRejectionReason());
        }

        return response;
    }

    // Approve user's KYC
    public void approveKyc(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setKycStatus(KycStatus.APPROVED);
        userRepository.save(user);

        KycDocument latestDoc = kycDocumentRepository.findTopByUserOrderBySubmittedAtDesc(user);
        if (latestDoc != null) {
            latestDoc.setStatus(StatusType.APPROVED);
            latestDoc.setReviewedAt(LocalDateTime.now());
            latestDoc.setUpdatedAt(LocalDateTime.now());
            latestDoc.setPreviousStatus(StatusType.PENDING);
            kycDocumentRepository.save(latestDoc);
        }
    }

    // Reject user's KYC and set reason
    public void rejectKyc(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setKycStatus(KycStatus.REJECTED);
        userRepository.save(user);

        KycDocument latestDoc = kycDocumentRepository.findTopByUserOrderBySubmittedAtDesc(user);
        if (latestDoc != null) {
            latestDoc.setStatus(StatusType.REJECTED);
            latestDoc.setRejectionReason(reason);
            latestDoc.setReviewedAt(LocalDateTime.now());
            latestDoc.setUpdatedAt(LocalDateTime.now());
            latestDoc.setPreviousStatus(StatusType.PENDING);
            kycDocumentRepository.save(latestDoc);
        }
    }
}