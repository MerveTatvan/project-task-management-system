package com.example.demo.controller;

import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.model.ActivityLog;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private void logUserActivity(String action, String actorEmail, Long targetId, String message) {
        ActivityLog activityLog = new ActivityLog();
        activityLog.setType("PROFILE");
        activityLog.setTargetId(targetId);
        activityLog.setAction(action);
        activityLog.setActorEmail(actorEmail == null ? "system" : actorEmail);
        activityLog.setMessage(message);
        activityLog.setCreatedAt(LocalDateTime.now().toString());

        activityLogRepository.save(activityLog);
    }

    @GetMapping
    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();

        for (User user : users) {
            user.setPassword(null);
        }

        return users;
    }

    @GetMapping("/{email}")
    public User getUserByEmail(@PathVariable String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(null);
        return user;
    }

    @PutMapping("/{id}/role")
    public String updateUserRole(
            @PathVariable Long id,
            @RequestParam String adminEmail,
            @RequestBody String role
    ) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (!"ADMIN".equals(admin.getRole())) {
            return "You are not authorized";
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newRole = role.replace("\"", "");
        user.setRole(newRole);
        userRepository.save(user);

        Notification notification = new Notification();
        notification.setReceiverEmail(user.getEmail());
        notification.setTitle("Role Updated");
        notification.setMessage("Your role has been updated to: " + newRole);
        notification.setType("ROLE");
        notification.setTaskId(null);
        notification.setReadStatus(false);
        notification.setCreatedAt(LocalDateTime.now().toString());

        notificationRepository.save(notification);

        logUserActivity(
                "ROLE_UPDATED",
                adminEmail,
                user.getId(),
                "Role updated for " + user.getEmail() + " to " + newRole
        );

        ActivityLog userActivityLog = new ActivityLog();
        userActivityLog.setType("PROFILE");
        userActivityLog.setTargetId(user.getId());
        userActivityLog.setAction("MY_ROLE_UPDATED");
        userActivityLog.setActorEmail(user.getEmail());
        userActivityLog.setMessage("Your role was updated to " + newRole);
        userActivityLog.setCreatedAt(LocalDateTime.now().toString());
        activityLogRepository.save(userActivityLog);

        emailService.sendEmail(
                user.getEmail(),
                "Role Updated",
                "Hello,\n\nYour role has been updated to: " + newRole +
                        "\n\nPlease log in to see your updated permissions."
        );

        return "Role updated";
    }

    @PutMapping("/update/{email}")
    public User updateUser(@PathVariable String email, @RequestBody User updatedUser) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setExtraInfo(updatedUser.getExtraInfo());
        user.setLinkedin(updatedUser.getLinkedin());
        user.setGithub(updatedUser.getGithub());
        user.setProfileImage(updatedUser.getProfileImage());

        User savedUser = userRepository.save(user);
        savedUser.setPassword(null);

        logUserActivity(
                "PROFILE_UPDATED",
                savedUser.getEmail(),
                savedUser.getId(),
                "Profile updated"
        );

        return savedUser;
    }

    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRepository.deleteById(id);

        logUserActivity(
                "USER_DELETED",
                user.getEmail(),
                id,
                "User deleted: " + user.getEmail()
        );

        return "User deleted";
    }
}
