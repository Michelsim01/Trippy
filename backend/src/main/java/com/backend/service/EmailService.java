package com.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender; 

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Send password reset email with HTML template
     * @param toEmail - recipient email address
     * @param resetToken - password reset token
     * @param firstName - user's first name
     */
    public void sendPasswordResetEmail(String toEmail, String resetToken, String firstName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Set email details
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Reset Your Password - Trippy");

            // Create HTML content
            String htmlContent = createPasswordResetHtmlContent(firstName, resetToken);
            helper.setText(htmlContent, true);

            // Send email
            mailSender.send(message);
            System.out.println("Password reset email sent successfully to: " + toEmail);

        } catch (MessagingException e) {
            System.err.println("Failed to send password reset email: " + e.getMessage());
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    /**
     * Send email verification email with HTML template
     * @param toEmail - recipient email address
     * @param verificationToken - email verification token
     * @param firstName - user's first name
     */
    public void sendEmailVerificationEmail(String toEmail, String verificationToken, String firstName) throws MessagingException {
        try {
            System.out.println("=== EMAIL VERIFICATION DEBUG ===");
            System.out.println("From email: " + fromEmail);
            System.out.println("To email: " + toEmail);
            System.out.println("Frontend URL: " + frontendUrl);
            System.out.println("Verification token: " + verificationToken);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Set email details
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Verify Your Email - Trippy");

            // Create HTML content
            String htmlContent = createEmailVerificationHtmlContent(firstName, verificationToken);
            helper.setText(htmlContent, true);

            System.out.println("Attempting to send email...");
            // Send email
            mailSender.send(message);
            System.out.println("✅ Email verification sent successfully to: " + toEmail);
            System.out.println("=== EMAIL VERIFICATION SUCCESS ===");

        } catch (MessagingException e) {
            System.err.println("❌ MessagingException while sending email verification to " + toEmail);
            System.err.println("Error message: " + e.getMessage());
            System.err.println("Error cause: " + (e.getCause() != null ? e.getCause().getMessage() : "No cause"));
            e.printStackTrace();
            throw new MessagingException("Failed to send email verification email: " + e.getMessage(), e);
        } catch (Exception e) {
            System.err.println("❌ Unexpected error while sending email verification to " + toEmail);
            System.err.println("Error message: " + e.getMessage());
            System.err.println("Error cause: " + (e.getCause() != null ? e.getCause().getMessage() : "No cause"));
            e.printStackTrace();
            throw new MessagingException("Unexpected error while sending email verification email: " + e.getMessage(), e);
        }
    }

    /**
     * Send password changed confirmation email
     * @param toEmail - recipient email address
     * @param firstName - user's first name
     */
    public void sendPasswordChangedConfirmation(String toEmail, String firstName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Set email details
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Password Changed Successfully - Trippy");

            // Create HTML content
            String htmlContent = createPasswordChangedHtmlContent(firstName);
            helper.setText(htmlContent, true);

            // Send email
            mailSender.send(message);
            System.out.println("Password changed confirmation email sent successfully to: " + toEmail);

        } catch (MessagingException e) {
            System.err.println("Failed to send password changed confirmation email: " + e.getMessage());
            throw new RuntimeException("Failed to send password changed confirmation email", e);
        }
    }

    /**
     * Create HTML content for password reset email
     */
    private String createPasswordResetHtmlContent(String firstName, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #4AC63F 0%%, #3ea832 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #4AC63F; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .button:hover { background: #3ea832; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Reset Your Password</h1>
                        <p>Trippy - Local Experience Marketplace</p>
                    </div>
                    <div class="content">
                        <h2>Hello %s!</h2>
                        <p>We received a request to reset your password for your Trippy account.</p>
                        <p>Click the button below to reset your password:</p>
                        <a href="%s" class="button">Reset Password</a>
                        <div class="warning">
                            <strong>⚠️ Important:</strong>
                            <ul>
                                <li>This link will expire in 1 hour</li>
                                <li>If you didn't request this, please ignore this email</li>
                                <li>For security, don't share this link with anyone</li>
                            </ul>
                        </div>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">%s</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent from Trippy. If you have any questions, please contact our support team.</p>
                        <p>© 2024 Trippy. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """, firstName, resetLink, resetLink);
    }

    /**
     * Create HTML content for password changed confirmation email
     */
    private String createPasswordChangedHtmlContent(String firstName) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Changed Successfully</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #4AC63F 0%%, #3ea832 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Password Changed Successfully</h1>
                        <p>Trippy - Local Experience Marketplace</p>
                    </div>
                    <div class="content">
                        <h2>Hello %s!</h2>
                        <div class="success">
                            <strong>🎉 Great news!</strong> Your password has been successfully changed.
                        </div>
                        <p>Your account is now secure with your new password. You can now sign in to Trippy using your new credentials.</p>
                        <p>If you didn't make this change, please contact our support team immediately.</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent from Trippy. If you have any questions, please contact our support team.</p>
                        <p>© 2024 Trippy. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """, firstName);
    }

    /**
     * Create HTML content for email verification
     */
    private String createEmailVerificationHtmlContent(String firstName, String verificationToken) {
        String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #4AC63F 0%%, #3ea832 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #4AC63F; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .button:hover { background: #3ea832; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    .info { background: #e8f5e8; border: 1px solid #4AC63F; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✉️ Verify Your Email</h1>
                        <p>Trippy - Local Experience Marketplace</p>
                    </div>
                    <div class="content">
                        <h2>Hello %s!</h2>
                        <p>Welcome to Trippy! Please verify your email address to complete your registration and start exploring amazing local experiences.</p>
                        <p>Click the button below to verify your email:</p>
                        <a href="%s" class="button">Verify Email Address</a>
                        <div class="info">
                            <strong>📌 Important:</strong>
                            <ul>
                                <li>This verification link will expire in 24 hours</li>
                                <li>Once verified, you'll have access to all Trippy features</li>
                                <li>If you didn't create this account, please ignore this email</li>
                            </ul>
                        </div>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">%s</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent from Trippy. If you have any questions, please contact our support team.</p>
                        <p>© 2024 Trippy. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """, firstName, verificationLink, verificationLink);
    }

    /**
     * Send simple text email (fallback method)
     */
    public void sendSimpleEmail(String toEmail, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(text);
            
            mailSender.send(message);
            System.out.println("Simple email sent successfully to: " + toEmail);
            
        } catch (Exception e) {
            System.err.println("Failed to send simple email: " + e.getMessage());
            throw new RuntimeException("Failed to send simple email", e);
        }
    }
}