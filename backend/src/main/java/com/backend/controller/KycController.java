package com.backend.controller;

import org.springframework.web.bind.annotation.RestController;

import com.backend.entity.KycDocument;
import com.backend.entity.KycStatus;
import com.backend.service.KycService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/kyc")
public class KycController {
    @Autowired
    private KycService kycService;

    // Submit KYC document
    @PostMapping("/submit")
    public ResponseEntity<?> submitKyc(@RequestBody KycDocument kycDoc, @RequestParam Long userId) {
        kycService.submitKyc(userId, kycDoc);
        return ResponseEntity.ok("KYC submitted");
    }

    // Get current KYC status
    @GetMapping("/status")
    public ResponseEntity<?> getKycStatus(@RequestParam Long userId) {
        KycStatus status = kycService.getKycStatus(userId);
        return ResponseEntity.ok(status);
    }

    // Approve KYC (manual)
    @PostMapping("/approve")
    public ResponseEntity<?> approveKyc(@RequestParam Long userId) {
        kycService.approveKyc(userId);
        return ResponseEntity.ok("KYC approved");
    }

    // Reject KYC (manual)
    @PostMapping("/reject")
    public ResponseEntity<?> rejectKyc(@RequestParam Long userId, @RequestParam String reason) {
        kycService.rejectKyc(userId, reason);
        return ResponseEntity.ok("KYC rejected: " + reason);
    }
}
