package com.example.demo.controller;

import com.example.demo.model.Notification;
import com.example.demo.model.Request;
import com.example.demo.model.Task;
import com.example.demo.model.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.RequestRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "*")
public class RequestController {

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TaskRepository taskRepository;

    // ✅ SADECE BURASI DEĞİŞTİ
    @PostMapping
    public Request createRequest(@RequestBody Request request) {
        request.setStatus("PENDING");

        // 🔥 GÖNDERENİ BUL
        User requester = userRepository.findByEmail(request.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        String department = requester.getDepartment();

        // 🔥 AYNI DEPARTMAN MANAGER
        User manager = userRepository
                .findFirstByRoleAndDepartment("MANAGER", department)
                .orElseThrow(() -> new RuntimeException("No manager found for department"));

        request.setReceiverEmail(manager.getEmail());

        Request savedRequest = requestRepository.save(request);

        notifyUser(
                savedRequest.getReceiverEmail(),
                "New Request Submitted",
                "A new request has been submitted by " + savedRequest.getCreatedBy(),
                "REQUEST_CREATED",
                null
        );

        return savedRequest;
    }

    @GetMapping
    public List<Request> getAllRequests() {
        return requestRepository.findAll();
    }

    @PutMapping("/{id}")
    public Request updateStatus(@PathVariable Long id, @RequestBody Request updated) {
        Request req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        req.setStatus(updated.getStatus());

        if ("APPROVED".equals(updated.getStatus()) && "ROLE_CHANGE".equals(req.getType())) {
            applyRoleChange(req);
        }

        if ("APPROVED".equals(updated.getStatus()) && "TEAM_CHANGE".equals(req.getType())) {
            applyTeamChange(req);
        }

        if ("APPROVED".equals(updated.getStatus()) && "DEADLINE_EXTENSION".equals(req.getType())) {
            applyDeadlineExtension(req);
        }

        Request savedRequest = requestRepository.save(req);

        if ("APPROVED".equals(updated.getStatus())) {
            notifyUser(
                    req.getCreatedBy(),
                    "Request Approved",
                    "Your request has been approved.",
                    "REQUEST_APPROVED",
                    null
            );
        }

        if ("REJECTED".equals(updated.getStatus())) {
            notifyUser(
                    req.getCreatedBy(),
                    "Request Rejected",
                    "Your request has been rejected.",
                    "REQUEST_REJECTED",
                    null
            );
        }

        return savedRequest;
    }

    @PutMapping("/{id}/edit")
    public Request editRequest(@PathVariable Long id, @RequestBody Request updated) {
        Request req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!"PENDING".equals(req.getStatus())) {
            throw new RuntimeException("Only pending requests can be edited");
        }

        req.setType(updated.getType());
        req.setDescription(updated.getDescription());

        return requestRepository.save(req);
    }

    @DeleteMapping("/{id}")
    public String deleteRequest(@PathVariable Long id) {
        Request req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!"PENDING".equals(req.getStatus())) {
            return "Only pending requests can be deleted";
        }

        requestRepository.delete(req);
        return "Request deleted";
    }

    private void applyRoleChange(Request req) {
        String description = req.getDescription();

        if (description == null || !description.contains("Requested Role:")) {
            throw new RuntimeException("Requested role not found in description");
        }

        String requestedRole = description
                .split("Requested Role:")[1]
                .split("\\n")[0]
                .trim();

        User user = userRepository.findByEmail(req.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(requestedRole);
        userRepository.save(user);
    }

    private void applyTeamChange(Request req) {
        String description = req.getDescription();

        if (description == null || !description.contains("Requested Team:")) {
            throw new RuntimeException("Requested team not found in description");
        }

        String requestedTeam = description
                .split("Requested Team:")[1]
                .split("\\n")[0]
                .trim();

        User user = userRepository.findByEmail(req.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setDepartment(requestedTeam);
        userRepository.save(user);
    }

    private void applyDeadlineExtension(Request req) {
        String description = req.getDescription();

        if (description == null ||
                !description.contains("Task Info:") ||
                !description.contains("Requested Deadline:")) {
            throw new RuntimeException("Invalid deadline extension request format");
        }

        Long taskId = Long.parseLong(
                description
                        .split("Task Info:")[1]
                        .split("\\n")[0]
                        .trim()
        );

        String newDeadline = description
                .split("Requested Deadline:")[1]
                .split("\\n")[0]
                .trim();

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setDueDate(newDeadline);
        taskRepository.save(task);
    }

    private void notifyUser(String email, String title, String message, String type, Long taskId) {
        if (email == null || email.trim().isEmpty()) return;

        Notification notification = new Notification();
        notification.setReceiverEmail(email.trim());
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setTaskId(taskId);
        notification.setReadStatus(false);
        notification.setCreatedAt(LocalDateTime.now().toString());

        notificationRepository.save(notification);
    }
}