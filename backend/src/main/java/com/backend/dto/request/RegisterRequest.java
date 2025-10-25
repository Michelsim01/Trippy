package com.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for user registration requests.
 * Contains the data sent from the frontend when a user registers for a new account.
 */
public class RegisterRequest { 
    
    
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$", 
             message = "Password must contain at least one lowercase letter, one uppercase letter, and one number")
    private String password;
    
    // Admin code for admin registration
    private String adminCode;
    
    // Referral token for admin registration via referral
    private String referralToken;
    
    
    // Default constructor
    public RegisterRequest() {}
    
    // Constructor with parameters
    public RegisterRequest(String firstName, String lastName, String email, String password) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
    }
    
    // Constructor with admin code
    public RegisterRequest(String firstName, String lastName, String email, String password, String adminCode) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.adminCode = adminCode;
    }
    
    // Getters and setters
    
    public String getFirstName() {
        return firstName;
    }
    
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
    
    public String getLastName() {
        return lastName;
    }
    
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getAdminCode() {
        return adminCode;
    }
    
    public void setAdminCode(String adminCode) {
        this.adminCode = adminCode;
    }
    
    public String getReferralToken() {
        return referralToken;
    }
    
    public void setReferralToken(String referralToken) {
        this.referralToken = referralToken;
    }
    
    
    @Override
    public String toString() {
        return "RegisterRequest{" +
                "firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", password='[PROTECTED]'" +
                '}';
    }
}
