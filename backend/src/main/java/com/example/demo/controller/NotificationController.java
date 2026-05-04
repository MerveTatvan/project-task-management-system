package com.example.demo.controller;

import com.example.demo.model.Notification;
import com.example.demo.repository.NotificationRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    // ✅ TÜM BİLDİRİMLERİ GETİR
    @GetMapping
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    // ✅ KULLANICIYA GÖRE BİLDİRİMLER
    @GetMapping("/{email}")
    public List<Notification> getNotificationsByUser(@PathVariable String email) {
        return notificationRepository.findByReceiverEmail(email);
    }

    // ✅ OKUNMAMIŞ BİLDİRİMLER
    @GetMapping("/unread/{email}")
    public List<Notification> getUnreadNotifications(@PathVariable String email) {
        return notificationRepository.findByReceiverEmail(email)
                .stream()
                .filter(n -> !n.isReadStatus())
                .toList();
    }

    // ✅ BİLDİRİM SAYISI (UNREAD COUNT)
    @GetMapping("/count/{email}")
    public int getUnreadCount(@PathVariable String email) {
        return (int) notificationRepository.findByReceiverEmail(email)
                .stream()
                .filter(n -> !n.isReadStatus())
                .count();
    }

    // ✅ TEK BİLDİRİM GETİR
    @GetMapping("/detail/{id}")
    public Notification getNotificationById(@PathVariable Long id) {
        Optional<Notification> notification = notificationRepository.findById(id);

        if (notification.isPresent()) {
            return notification.get();
        } else {
            throw new RuntimeException("Notification not found");
        }
    }

    // ✅ BİLDİRİM OLUŞTUR (GENEL)
    @PostMapping
    public Notification createNotification(@RequestBody Notification notification) {

        // 🔥 SADECE BURASI DÜZELTİLDİ (getReadStatus → isReadStatus)
        if (notification.isReadStatus() == false) {
            notification.setReadStatus(false);
        }

        if (notification.getCreatedAt() == null || notification.getCreatedAt().isEmpty()) {
            notification.setCreatedAt(java.time.LocalDateTime.now().toString());
        }

        return notificationRepository.save(notification);
    }

    // ✅ OKUNDU YAP (TEK)
    @PutMapping("/{id}/read")
    public Notification markAsRead(@PathVariable Long id) {

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setReadStatus(true);

        return notificationRepository.save(notification);
    }

    // ✅ OKUNMAMIŞ YAP (TEK)
    @PutMapping("/{id}/unread")
    public Notification markAsUnread(@PathVariable Long id) {

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setReadStatus(false);

        return notificationRepository.save(notification);
    }

    // ✅ TÜMÜNÜ OKUNDU YAP
    @PutMapping("/read-all/{email}")
    public List<Notification> markAllAsRead(@PathVariable String email) {

        List<Notification> notifications = notificationRepository.findByReceiverEmail(email);

        for (Notification n : notifications) {
            n.setReadStatus(true);
        }

        return notificationRepository.saveAll(notifications);
    }

    // ✅ TÜMÜNÜ OKUNMAMIŞ YAP
    @PutMapping("/unread-all/{email}")
    public List<Notification> markAllAsUnread(@PathVariable String email) {

        List<Notification> notifications = notificationRepository.findByReceiverEmail(email);

        for (Notification n : notifications) {
            n.setReadStatus(false);
        }

        return notificationRepository.saveAll(notifications);
    }

    // ✅ BİLDİRİM SİL
    @DeleteMapping("/{id}")
    public String deleteNotification(@PathVariable Long id) {

        if (!notificationRepository.existsById(id)) {
            throw new RuntimeException("Notification not found");
        }

        notificationRepository.deleteById(id);

        return "Notification deleted successfully";
    }

    // ✅ KULLANICIYA AİT TÜM BİLDİRİMLERİ SİL
    @DeleteMapping("/user/{email}")
    public String deleteAllUserNotifications(@PathVariable String email) {

        List<Notification> notifications = notificationRepository.findByReceiverEmail(email);

        notificationRepository.deleteAll(notifications);

        return "All notifications deleted for user";
    }
}