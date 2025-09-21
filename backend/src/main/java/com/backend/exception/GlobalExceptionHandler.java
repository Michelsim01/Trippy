package com.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for the application.
 * Handles validation errors and other exceptions across all controllers.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle validation errors from @Valid annotations.
     * 
     * @param ex The MethodArgumentNotValidException
     * @return ResponseEntity with validation error details
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        // Return the first validation error message
        String firstError = errors.values().iterator().next();
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(firstError);
    }

    /**
     * Handle database constraint violations (e.g., unique email constraint).
     * 
     * @param ex The DataIntegrityViolationException
     * @return ResponseEntity with appropriate error message
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String message = "Data constraint violation";
        
        // Check if it's a unique constraint violation for email
        if (ex.getMessage().contains("email") || ex.getMessage().contains("users.UK")) {
            message = "Email address is already registered";
        }
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
    }

    /**
     * Handle invalid method argument types (e.g., invalid ID format).
     * 
     * @param ex The MethodArgumentTypeMismatchException
     * @return ResponseEntity with appropriate error message
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<?> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String message = "Invalid parameter format";
        
        if ("id".equals(ex.getName())) {
            message = "Invalid user ID format";
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
    }

    /**
     * Handle general exceptions as fallback.
     * 
     * @param ex The Exception
     * @return ResponseEntity with generic error message
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        // Log the full exception for debugging
        System.err.println("Unhandled exception: " + ex.getMessage());
        ex.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An unexpected error occurred");
    }
}
