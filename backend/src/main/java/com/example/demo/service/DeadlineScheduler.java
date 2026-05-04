package com.example.demo.service;

import com.example.demo.model.Notification;
import com.example.demo.model.Task;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DeadlineScheduler {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    @Scheduled(cron = "0 0 9 * * ?")
    public void checkDeadlines() {
        String tomorrow = LocalDate.now().plusDays(1).toString();

        List<Task> tasks = taskRepository.findByStatusNotAndDueDate("DONE", tomorrow);

        for (Task task : tasks) {
            if (task.getAssignedTo() == null) continue;

            String[] users = task.getAssignedTo().split(",");

            for (String email : users) {
                String cleanEmail = email.trim();
                if (cleanEmail.isEmpty()) continue;

                boolean alreadySent = notificationRepository
                        .findByReceiverEmailOrderByIdDesc(cleanEmail)
                        .stream()
                        .anyMatch(n ->
                                n.getTaskId() != null &&
                                n.getTaskId().equals(task.getId()) &&
                                "DEADLINE".equals(n.getType())
                        );

                if (alreadySent) continue;

                Notification notification = new Notification();
                notification.setReceiverEmail(cleanEmail);
                notification.setTitle("Deadline Approaching");
                notification.setMessage("Task \"" + task.getTitle() + "\" is due tomorrow!");
                notification.setType("DEADLINE");
                notification.setTaskId(task.getId());
                notification.setReadStatus(false);
                notification.setCreatedAt(LocalDateTime.now().toString());

                notificationRepository.save(notification);

                emailService.sendDeadlineEmail(cleanEmail, task.getTitle());
            }
        }
    }
}