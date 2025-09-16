package com.backend.controller;

import com.backend.entity.ExperienceMedia;
import com.backend.entity.Experience;
import com.backend.entity.MediaType;
import com.backend.repository.ExperienceMediaRepository;
import com.backend.repository.ExperienceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/experience-media")
@CrossOrigin(origins = "http://localhost:5173")
public class ExperienceMediaController {
    @Autowired
    private ExperienceMediaRepository experienceMediaRepository;
    
    @Autowired
    private ExperienceRepository experienceRepository;
    
    private final String UPLOAD_DIR = "uploads/experience-media/";

    @GetMapping
    public List<ExperienceMedia> getAllExperienceMedia() {
        return experienceMediaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ExperienceMedia getExperienceMediaById(@PathVariable Long id) {
        return experienceMediaRepository.findById(id).orElse(null);
    }

    @PostMapping
    public ExperienceMedia createExperienceMedia(@RequestBody ExperienceMedia experienceMedia) {
        return experienceMediaRepository.save(experienceMedia);
    }

    @PutMapping("/{id}")
    public ExperienceMedia updateExperienceMedia(@PathVariable Long id, @RequestBody ExperienceMedia experienceMedia) {
        experienceMedia.setMediaId(id);
        return experienceMediaRepository.save(experienceMedia);
    }

    @DeleteMapping("/{id}")
    public void deleteExperienceMedia(@PathVariable Long id) {
        experienceMediaRepository.deleteById(id);
    }
    
    @PostMapping("/upload")
    public ResponseEntity<?> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam("experienceId") Long experienceId,
            @RequestParam("mediaType") String mediaType,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "displayOrder", defaultValue = "0") Integer displayOrder) {
        try {
            if (file.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "No file selected");
                return ResponseEntity.badRequest().body(error);
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Only image files are allowed");
                return ResponseEntity.badRequest().body(error);
            }

            if (file.getSize() > 10 * 1024 * 1024) { // 10MB limit
                Map<String, Object> error = new HashMap<>();
                error.put("error", "File size too large. Maximum 10MB allowed");
                return ResponseEntity.badRequest().body(error);
            }

            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = "exp_" + experienceId + "_" + UUID.randomUUID().toString() + fileExtension;

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String mediaUrl = "/api/experience-media/files/" + fileName;
            
            // Find the experience
            Experience experience = experienceRepository.findById(experienceId).orElse(null);
            if (experience == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Experience not found");
                return ResponseEntity.badRequest().body(error);
            }
            
            ExperienceMedia media = new ExperienceMedia();
            media.setExperience(experience);
            media.setMediaUrl(mediaUrl);
            media.setMediaType(MediaType.valueOf(mediaType.toUpperCase()));
            media.setCaption(caption);
            media.setDisplayOrder(displayOrder);
            
            ExperienceMedia savedMedia = experienceMediaRepository.save(media);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Media uploaded successfully");
            response.put("mediaId", savedMedia.getMediaId());
            response.put("mediaUrl", mediaUrl);
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
    
    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> getMediaFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
