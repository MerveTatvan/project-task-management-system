package com.example.demo.controller;

import com.example.demo.model.Notification;
import com.example.demo.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/{email}")
    public List<Notification> getNotifications(@PathVariable String email) {
        return notificationRepository.findByReceiverEmailOrderByIdDesc(email);
    }

    @GetMapping("/{email}/unread")
    public List<Notification> getUnreadNotifications(@PathVariable String email) {
        return notificationRepository.findByReceiverEmailAndReadStatusFalseOrderByIdDesc(email);
    }

    @PutMapping("/{id}/read")
    public String markAsRead(@PathVariable Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setReadStatus(true);
        notificationRepository.save(notification);

        return "Notification marked as read";
    }

    @PutMapping("/{email}/read-all")
    public String markAllAsRead(@PathVariable String email) {
        List<Notification> notifications =
                notificationRepository.findByReceiverEmailAndReadStatusFalseOrderByIdDesc(email);

        for (Notification notification : notifications) {
            notification.setReadStatus(true);
        }

        notificationRepository.saveAll(notifications);

        return "All notifications marked as read";
    }
}
