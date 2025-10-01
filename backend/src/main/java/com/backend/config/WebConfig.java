package com.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded files from uploads directory with absolute path
        String uploadPath = System.getProperty("user.dir") + "/uploads/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath)
                .setCachePeriod(3600);

        System.out.println("Serving uploads from: " + uploadPath);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/uploads/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET")
                .allowCredentials(false);
    }
}