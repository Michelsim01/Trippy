package com.backend.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;

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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/kyc")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class KycController {
    @Autowired
    private KycService kycService;
    
    private final String KYC_UPLOAD_DIR = "uploads/kyc-documents/";

    // Upload KYC document
    @PostMapping("/upload-document")
    public ResponseEntity<Map<String, Object>> uploadKycDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") Long userId,
            @RequestParam("docType") String docType,
            @RequestParam(value = "docSide", defaultValue = "front") String docSide) {
        try {
            if (file.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "No file selected");
                return ResponseEntity.badRequest().body(error);
            }

            String contentType = file.getContentType();
            if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Only image files (JPG, PNG) and PDF files are allowed");
                return ResponseEntity.badRequest().body(error);
            }

            if (file.getSize() > 10 * 1024 * 1024) { // 10MB limit for KYC documents
                Map<String, Object> error = new HashMap<>();
                error.put("error", "File size too large. Maximum 10MB allowed");
                return ResponseEntity.badRequest().body(error);
            }

            Path uploadPath = Paths.get(KYC_UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = "kyc_user_" + userId + "_" + docType + "_" + docSide + "_" + UUID.randomUUID().toString() + fileExtension;

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/kyc/documents/" + fileName;

            Map<String, Object> response = new HashMap<>();
            response.put("message", "KYC document uploaded successfully");
            response.put("fileUrl", fileUrl);
            response.put("fileName", fileName);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to upload file");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // Get KYC document
    @GetMapping("/documents/{filename}")
    public ResponseEntity<Resource> getKycDocument(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(KYC_UPLOAD_DIR).resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Submit KYC document
    @PostMapping("/submit")
    public ResponseEntity<?> submitKyc(@RequestBody KycDocument kycDoc, @RequestParam Long userId) {
        kycService.submitKyc(userId, kycDoc);
        return ResponseEntity.ok("KYC submitted");
    }

    // Submit KYC with file URL (alternative endpoint)
    @PostMapping("/submit-with-document")
    public ResponseEntity<Map<String, Object>> submitKycWithDocument(
            @RequestParam("userId") Long userId,
            @RequestParam("docType") String docType,
            @RequestParam("docSide") String docSide,
            @RequestParam("fileUrl") String fileUrl,
            @RequestParam(value = "notes", required = false) String notes) {
        try {
            KycDocument kycDoc = new KycDocument();
            kycDoc.setDocType(docType);
            kycDoc.setDocSide(docSide);
            kycDoc.setFileUrl(fileUrl);
            kycDoc.setNotes(notes);

            kycService.submitKyc(userId, kycDoc);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "KYC submitted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to submit KYC");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // Get current KYC status
    @GetMapping("/status")
    public ResponseEntity<?> getKycStatus(@RequestParam Long userId) {
        Map<String, Object> response = kycService.getKycStatusDetails(userId);
        return ResponseEntity.ok(response);
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
