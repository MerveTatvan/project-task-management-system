package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    private static final String AUTO_MAIL_FOOTER =
            "\n\n---\n"
                    + "This is an automated email from Project Task Management System.\n"
                    + "Please do not reply to this message.";

    // 🔹 GENEL MAIL GÖNDER
    public void sendEmail(String to, String subject, String body) {
        if (to == null || to.trim().isEmpty()) return;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText((body == null ? "" : body) + AUTO_MAIL_FOOTER);

            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("Email could not be sent: " + e.getMessage());
        }
    }

    // 🔔 MESSAGE
    public void sendMessageEmail(String to, String sender) {
        sendEmail(
                to,
                "New Message",
                "You received a new message from " + sender + "."
        );
    }

    // 🔄 REQUEST
    public void sendRequestEmail(String to, String type) {
        sendEmail(
                to,
                "New Request",
                "You have a new " + type + " request waiting for approval."
        );
    }

    // ✅ REQUEST APPROVED
    public void sendRequestApprovedEmail(String to) {
        sendEmail(
                to,
                "Request Approved",
                "Your request has been approved."
        );
    }

    // ❌ REQUEST REJECTED
    public void sendRequestRejectedEmail(String to) {
        sendEmail(
                to,
                "Request Rejected",
                "Your request has been rejected."
        );
    }

    // 📌 TASK ASSIGNED
    public void sendTaskAssignedEmail(String to, String taskTitle) {
        sendEmail(
                to,
                "New Task Assigned",
                "You have been assigned to task: " + taskTitle
        );
    }

    // ⏰ DEADLINE
    public void sendDeadlineEmail(String to, String taskTitle) {
        sendEmail(
                to,
                "Deadline Reminder",
                "Task \"" + taskTitle + "\" deadline is tomorrow!"
        );
    }

    // 🔁 ROLE CHANGE
    public void sendRoleChangeEmail(String to, String role) {
        sendEmail(
                to,
                "Role Updated",
                "Your role has been changed to: " + role
        );
    }

    // 🔐 PASSWORD RESET CODE
    public void sendPasswordResetCodeEmail(String to, String code) {
        sendEmail(
                to,
                "Password Reset Code",
                "Your password reset verification code is: " + code
                        + "\n\nThis code is valid for 10 minutes."
        );
    }

    // 🔐 PASSWORD CHANGED
    public void sendPasswordChangedEmail(String to) {
        sendEmail(
                to,
                "Password Changed",
                "Your password has been changed successfully."
        );
    }
}
