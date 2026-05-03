package com.example.demo.controller;

import jakarta.transaction.Transactional;
import com.example.demo.model.Task;
import com.example.demo.model.Notification;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    // 🔔 TEK NOKTADAN BİLDİRİM + MAİL
    private void notifyUser(String email, String title, String message, String type, Long taskId) {
        if (email == null || email.trim().isEmpty()) return;

        Notification n = new Notification();
        n.setReceiverEmail(email.trim());
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setTaskId(taskId);
        n.setReadStatus(false);
        n.setCreatedAt(LocalDateTime.now().toString());

        notificationRepository.save(n);

        // 📩 mail
        emailService.sendEmail(email.trim(), title, message);
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        if (task.getStatus() == null || task.getStatus().isEmpty()) {
            task.setStatus("TODO");
        }

        if (task.getPriority() == null || task.getPriority().isEmpty()) {
            task.setPriority("MEDIUM");
        }

        if (task.getReviewNote() == null) {
            task.setReviewNote("");
        }

        Task savedTask = taskRepository.save(task);

        // 🔥 TASK ATANINCA BİLDİRİM
        if (savedTask.getAssignedTo() != null) {
            String[] emails = savedTask.getAssignedTo().split(",");

            for (String e : emails) {
                notifyUser(
                        e.trim(),
                        "New Task Assigned",
                        "A new task has been assigned to you: " + savedTask.getTitle(),
                        "TASK_ASSIGNED",
                        savedTask.getId()
                );
            }
        }

        return savedTask;
    }

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @GetMapping("/project/{projectId}")
    public List<Task> getTasksByProjectId(@PathVariable Long projectId) {
        return taskRepository.findByProjectId(projectId);
    }

    @GetMapping("/assigned/{email}")
    public List<Task> getTasksByAssignedUser(@PathVariable String email) {
        return taskRepository.findByAssignedToContaining(email);
    }

    @PutMapping("/{id}/status")
    public String updateTaskStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String userEmail
    ) {
        Optional<Task> optionalTask = taskRepository.findById(id);

        if (optionalTask.isEmpty()) {
            return "Task not found";
        }

        Task task = optionalTask.get();

        if ("DONE".equals(status)) {
            task.setStatus("WAITING_APPROVAL");
            task.setCompletedBy(userEmail);
            task.setApprovalRequestedAt(LocalDateTime.now().toString());
            task.setApprovedBy(null);
            task.setApprovedAt(null);

            taskRepository.save(task);

            // 🔥 CREATOR'A BİLDİRİM
            notifyUser(
                    task.getCreatedBy(),
                    "Task Submitted for Review",
                    "Task \"" + task.getTitle() + "\" has been submitted for your review.",
                    "TASK_REVIEW",
                    task.getId()
            );

            return "Task submitted for approval";
        }

        task.setStatus(status);
        taskRepository.save(task);

        return "Task status updated";
    }

    @PutMapping("/{id}/approve")
    public String approveTask(
            @PathVariable Long id,
            @RequestParam String reviewerEmail
    ) {
        Optional<Task> optionalTask = taskRepository.findById(id);

        if (optionalTask.isEmpty()) {
            return "Task not found";
        }

        Task task = optionalTask.get();

        if (task.getCreatedBy() == null || !task.getCreatedBy().equals(reviewerEmail)) {
            return "Only task creator can approve this task";
        }

        if (!"WAITING_APPROVAL".equals(task.getStatus())) {
            return "Task is not waiting for approval";
        }

        task.setStatus("DONE");
        task.setApprovedBy(reviewerEmail);
        task.setApprovedAt(LocalDateTime.now().toString());
        task.setReviewNote("");

        taskRepository.save(task);

        // 🔥 YAPAN KİŞİYE BİLDİRİM
        if (task.getAssignedTo() != null) {
            for (String e : task.getAssignedTo().split(",")) {
                notifyUser(
                        e.trim(),
                        "Task Approved",
                        "Your task \"" + task.getTitle() + "\" has been approved.",
                        "TASK_APPROVED",
                        task.getId()
                );
            }
        }

        return "Task approved";
    }

    @PutMapping("/{id}/reject")
    public String rejectTask(
            @PathVariable Long id,
            @RequestParam String reviewerEmail,
            @RequestBody String reviewNote
    ) {
        Optional<Task> optionalTask = taskRepository.findById(id);

        if (optionalTask.isEmpty()) {
            return "Task not found";
        }

        Task task = optionalTask.get();

        if (task.getCreatedBy() == null || !task.getCreatedBy().equals(reviewerEmail)) {
            return "Only task creator can request changes";
        }

        if (!"WAITING_APPROVAL".equals(task.getStatus())) {
            return "Task is not waiting for approval";
        }

        task.setStatus("IN_PROGRESS");
        task.setReviewNote(reviewNote.replace("\"", ""));
        task.setApprovedBy(null);
        task.setApprovedAt(null);

        taskRepository.save(task);

        // 🔥 REVİZE BİLDİRİMİ
        if (task.getAssignedTo() != null) {
            for (String e : task.getAssignedTo().split(",")) {
                notifyUser(
                        e.trim(),
                        "Revision Requested",
                        "Your task \"" + task.getTitle() + "\" needs revision: " + reviewNote,
                        "TASK_REJECTED",
                        task.getId()
                );
            }
        }

        return "Task sent back for revision";
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable Long id, @RequestBody Task updatedTask) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setTitle(updatedTask.getTitle());
        task.setDescription(updatedTask.getDescription());
        task.setStatus(updatedTask.getStatus());
        task.setPriority(updatedTask.getPriority());
        task.setDueDate(updatedTask.getDueDate());

        if (updatedTask.getReviewNote() != null) {
            task.setReviewNote(updatedTask.getReviewNote());
        }

        return taskRepository.save(task);
    }

    @Transactional
    @DeleteMapping("/{id}")
    public String deleteTask(@PathVariable Long id) {
        if (!taskRepository.existsById(id)) {
            return "Task not found";
        }

        commentRepository.deleteByTaskId(id);
        taskRepository.deleteById(id);

        return "Task and related comments deleted";
    }
}