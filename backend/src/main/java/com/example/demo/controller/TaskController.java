package com.example.demo.controller;

import jakarta.transaction.Transactional;
import com.example.demo.model.Task;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.model.ActivityLog;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.ActivityLogRepository;
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private void logTaskActivity(String action, Task task, String actorEmail, String message) {
        if (task == null) return;

        ActivityLog activityLog = new ActivityLog();
        activityLog.setType("TASK");
        activityLog.setTargetId(task.getId());
        activityLog.setAction(action);
        activityLog.setActorEmail(actorEmail == null ? "system" : actorEmail);
        activityLog.setMessage(message);
        activityLog.setCreatedAt(LocalDateTime.now().toString());

        activityLogRepository.save(activityLog);
    }

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

        // 📩 Mail sadece önemli durumlarda gönderilir.
        if (shouldSendTaskEmail(type)) {
            emailService.sendEmail(email.trim(), title, message);
        }
    }

    private boolean shouldSendTaskEmail(String type) {
        if (type == null) return false;

        return "TASK_ASSIGNED".equals(type)
                || "TASK_REVIEW".equals(type)
                || "TASK_APPROVED".equals(type)
                || "TASK_REJECTED".equals(type)
                || "DEADLINE".equals(type);
    }

    private User getUserByEmailOrThrow(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("User email is required");
        }

        return userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isAdmin(User user) {
        return user != null && "ADMIN".equals(user.getRole());
    }

    private boolean isTaskCreator(Task task, String email) {
        return task.getCreatedBy() != null &&
                email != null &&
                task.getCreatedBy().trim().equalsIgnoreCase(email.trim());
    }

    private boolean isTaskAssignedToUser(Task task, String email) {
        if (task.getAssignedTo() == null || email == null) {
            return false;
        }

        String cleanEmail = email.trim().toLowerCase();

        String[] assignedEmails = task.getAssignedTo().split(",");

        for (String assignedEmail : assignedEmails) {
            if (assignedEmail.trim().toLowerCase().equals(cleanEmail)) {
                return true;
            }
        }

        return false;
    }

    private void validateTaskUpdatePermission(Task task, String userEmail) {
        User user = getUserByEmailOrThrow(userEmail);

        boolean allowed =
                isAdmin(user) ||
                isTaskCreator(task, userEmail) ||
                isTaskAssignedToUser(task, userEmail);

        if (!allowed) {
            throw new RuntimeException("Only task creator, assigned user or admin can update this task");
        }
    }

    private void validateTaskDeletePermission(Task task, String userEmail) {
        User user = getUserByEmailOrThrow(userEmail);

        boolean allowed =
                isAdmin(user) ||
                isTaskCreator(task, userEmail);

        if (!allowed) {
            throw new RuntimeException("Only task creator or admin can delete this task");
        }
    }

    private void validateTaskStatusPermission(Task task, String userEmail) {
        User user = getUserByEmailOrThrow(userEmail);

        boolean allowed =
                isAdmin(user) ||
                isTaskCreator(task, userEmail) ||
                isTaskAssignedToUser(task, userEmail);

        if (!allowed) {
            throw new RuntimeException("Only task creator, assigned user or admin can update task status");
        }
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

        logTaskActivity(
                "TASK_CREATED",
                savedTask,
                savedTask.getCreatedBy(),
                "Task created: " + savedTask.getTitle()
        );

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

        validateTaskStatusPermission(task, userEmail);

        if ("DONE".equals(status)) {
            task.setStatus("WAITING_APPROVAL");
            task.setCompletedBy(userEmail);
            task.setApprovalRequestedAt(LocalDateTime.now().toString());
            task.setApprovedBy(null);
            task.setApprovedAt(null);

            taskRepository.save(task);

            logTaskActivity(
                    "TASK_SUBMITTED_FOR_REVIEW",
                    task,
                    userEmail,
                    "Task submitted for review: " + task.getTitle()
            );

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

        logTaskActivity(
                "TASK_STATUS_UPDATED",
                task,
                userEmail,
                "Task status updated to " + status + ": " + task.getTitle()
        );

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

        logTaskActivity(
                "TASK_APPROVED",
                task,
                reviewerEmail,
                "Task approved: " + task.getTitle()
        );

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

        logTaskActivity(
                "TASK_REVISION_REQUESTED",
                task,
                reviewerEmail,
                "Revision requested for task: " + task.getTitle()
        );

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
    public Task updateTask(
            @PathVariable Long id,
            @RequestBody Task updatedTask,
            @RequestParam(required = false) String userEmail
    ) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        validateTaskUpdatePermission(task, userEmail);

        task.setTitle(updatedTask.getTitle());
        task.setDescription(updatedTask.getDescription());
        task.setStatus(updatedTask.getStatus());
        task.setPriority(updatedTask.getPriority());
        task.setDueDate(updatedTask.getDueDate());

        if (updatedTask.getReviewNote() != null) {
            task.setReviewNote(updatedTask.getReviewNote());
        }

        Task savedTask = taskRepository.save(task);

        logTaskActivity(
                "TASK_UPDATED",
                savedTask,
                userEmail,
                "Task updated: " + savedTask.getTitle()
        );

        return savedTask;
    }

    @Transactional
    @DeleteMapping("/{id}")
    public String deleteTask(
            @PathVariable Long id,
            @RequestParam(required = false) String userEmail
    ) {
        if (!taskRepository.existsById(id)) {
            return "Task not found";
        }

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        validateTaskDeletePermission(task, userEmail);

        logTaskActivity(
                "TASK_DELETED",
                task,
                userEmail,
                "Task deleted: " + task.getTitle()
        );

        commentRepository.deleteByTaskId(id);
        taskRepository.deleteById(id);

        return "Task and related comments deleted";
    }
}
