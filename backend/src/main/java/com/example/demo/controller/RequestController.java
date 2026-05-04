package com.example.demo.controller;

import com.example.demo.model.Notification;
import com.example.demo.model.Project;
import com.example.demo.model.Request;
import com.example.demo.model.Task;
import com.example.demo.model.User;
import com.example.demo.model.ActivityLog;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.RequestRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

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

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private void logRequestActivity(String action, Request request, String actorEmail, String message) {
        if (request == null) return;

        ActivityLog activityLog = new ActivityLog();
        activityLog.setType("REQUEST");
        activityLog.setTargetId(request.getId());
        activityLog.setAction(action);
        activityLog.setActorEmail(actorEmail == null ? "system" : actorEmail);
        activityLog.setMessage(message);
        activityLog.setCreatedAt(LocalDateTime.now().toString());

        activityLogRepository.save(activityLog);
    }

    @PostMapping
    public Request createRequest(@RequestBody Request request) {
        request.setStatus("PENDING");

        User requester = userRepository.findByEmail(request.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        if (request.getReceiverEmail() == null || request.getReceiverEmail().trim().isEmpty()) {
            String receiverEmail = findReceiverEmailForRequest(request, requester);

            if (receiverEmail == null || receiverEmail.trim().isEmpty()) {
                throw new RuntimeException("No suitable receiver found for this request");
            }

            request.setReceiverEmail(receiverEmail);
        }

        Request savedRequest = requestRepository.save(request);

        logRequestActivity(
                "REQUEST_CREATED",
                savedRequest,
                savedRequest.getCreatedBy(),
                "Request created: " + savedRequest.getType()
        );

        notifyUser(
                savedRequest.getReceiverEmail(),
                "New Request Submitted",
                "A new request has been submitted by " + savedRequest.getCreatedBy(),
                getRequestNotificationType(savedRequest),
                savedRequest.getTaskId()
        );

        return savedRequest;
    }

    @GetMapping
    public List<Request> getAllRequests() {
        return requestRepository.findAll();
    }

    @GetMapping("/created/{email}")
    public List<Request> getRequestsCreatedByUser(@PathVariable String email) {
        return requestRepository.findByCreatedByOrderByIdDesc(email);
    }

    @GetMapping("/received/{email}")
    public List<Request> getRequestsReceivedByUser(@PathVariable String email) {
        return requestRepository.findByReceiverEmailOrderByIdDesc(email);
    }

    @GetMapping("/pending")
    public List<Request> getPendingRequests() {
        return requestRepository.findByStatusOrderByIdDesc("PENDING");
    }

    @PutMapping("/{id}")
    public Request updateStatus(@PathVariable Long id, @RequestBody Request updated) {
        Request req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        req.setStatus(updated.getStatus());

        if (updated.getReviewedBy() != null && !updated.getReviewedBy().trim().isEmpty()) {
            req.setReviewedBy(updated.getReviewedBy());
        }

        req.setReviewedAt(LocalDateTime.now().toString());

        if ("APPROVED".equals(updated.getStatus()) && "ROLE_CHANGE".equals(req.getType())) {
            applyRoleChange(req);
        }

        if ("APPROVED".equals(updated.getStatus()) && "TEAM_CHANGE".equals(req.getType())) {
            applyTeamChange(req);
        }

        if ("APPROVED".equals(updated.getStatus()) && "DEADLINE_EXTENSION".equals(req.getType())) {
            applyDeadlineExtension(req);
        }

        if ("APPROVED".equals(updated.getStatus()) && "PROJECT_JOIN".equals(req.getType())) {
            applyProjectJoin(req);
        }

        if ("APPROVED".equals(updated.getStatus()) && "PROJECT_LEAVE".equals(req.getType())) {
            applyProjectLeave(req);
        }

        if ("APPROVED".equals(updated.getStatus()) && "PROJECT_UPDATE".equals(req.getType())) {
            applyProjectUpdate(req);
        }

        if ("APPROVED".equals(updated.getStatus()) && "PROJECT_DEADLINE".equals(req.getType())) {
            applyProjectDeadline(req);
        }

        if ("APPROVED".equals(updated.getStatus()) && "KANBAN_APPROVAL".equals(req.getType())) {
            applyKanbanApproval(req);
        }

        Request savedRequest = requestRepository.save(req);

        logRequestActivity(
                "REQUEST_" + updated.getStatus(),
                savedRequest,
                savedRequest.getReviewedBy(),
                "Request " + updated.getStatus().toLowerCase() + ": " + savedRequest.getType()
        );

        if ("APPROVED".equals(updated.getStatus())) {
            notifyUser(
                    req.getCreatedBy(),
                    "Request Approved",
                    "Your request has been approved.",
                    "REQUEST_APPROVED",
                    req.getTaskId()
            );
        }

        if ("REJECTED".equals(updated.getStatus())) {
            notifyUser(
                    req.getCreatedBy(),
                    "Request Rejected",
                    "Your request has been rejected.",
                    "REQUEST_REJECTED",
                    req.getTaskId()
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
        req.setProjectId(updated.getProjectId());
        req.setTaskId(updated.getTaskId());
        req.setRequestedValue(updated.getRequestedValue());

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

    private String findReceiverEmailForRequest(Request request, User requester) {
        String type = request.getType() == null ? "GENERAL" : request.getType();

        if ("ROLE_CHANGE".equals(type) || "BUG_REPORT".equals(type) || "GENERAL".equals(type)) {
            User admin = findAnyAdmin();
            return admin == null ? null : admin.getEmail();
        }

        if ("TEAM_CHANGE".equals(type)) {
            User manager = findManagerByDepartment(requester.getDepartment());
            if (manager != null) return manager.getEmail();

            User admin = findAnyAdmin();
            return admin == null ? null : admin.getEmail();
        }

        if ("TASK_HELP".equals(type) || "DEADLINE_EXTENSION".equals(type) || "KANBAN_APPROVAL".equals(type)) {
            Task task = findTaskFromRequestSafely(request);

            if (task != null && task.getCreatedBy() != null && !task.getCreatedBy().trim().isEmpty()) {
                return task.getCreatedBy().trim();
            }

            User manager = findManagerByDepartment(requester.getDepartment());
            if (manager != null) return manager.getEmail();

            User admin = findAnyAdmin();
            return admin == null ? null : admin.getEmail();
        }

        if (type.startsWith("PROJECT")) {
            Project project = findProjectFromRequestSafely(request);

            if (project != null && project.getCreatedBy() != null && !project.getCreatedBy().trim().isEmpty()) {
                return project.getCreatedBy().trim();
            }

            User manager = findManagerByDepartment(requester.getDepartment());
            if (manager != null) return manager.getEmail();

            User admin = findAnyAdmin();
            return admin == null ? null : admin.getEmail();
        }

        User admin = findAnyAdmin();
        return admin == null ? null : admin.getEmail();
    }

    private User findManagerByDepartment(String department) {
        if (department == null || department.trim().isEmpty()) {
            return null;
        }

        return userRepository
                .findFirstByRoleAndDepartment("MANAGER", department)
                .orElse(null);
    }

    private User findAnyAdmin() {
        return userRepository
                .findAll()
                .stream()
                .filter(user -> "ADMIN".equals(user.getRole()))
                .findFirst()
                .orElse(null);
    }

    private Task findTaskFromRequestSafely(Request request) {
        Long taskId = request.getTaskId();

        if (taskId == null) {
            taskId = extractLongValueFromDescription(request.getDescription(), "Task Info:");
        }

        if (taskId == null) {
            taskId = extractLongValueFromDescription(request.getDescription(), "Task:");
        }

        if (taskId == null) {
            return null;
        }

        return taskRepository.findById(taskId).orElse(null);
    }

    private Project findProjectFromRequestSafely(Request request) {
        Long projectId = request.getProjectId();

        if (projectId == null) {
            projectId = extractLongValueFromDescription(request.getDescription(), "Project:");
        }

        if (projectId == null) {
            return null;
        }

        return projectRepository.findById(projectId).orElse(null);
    }

    private Long extractLongValueFromDescription(String description, String label) {
        if (description == null || label == null || !description.contains(label)) {
            return null;
        }

        try {
            String rawValue = description
                    .split(label)[1]
                    .split("\n")[0]
                    .trim();

            return Long.parseLong(rawValue);
        } catch (Exception e) {
            return null;
        }
    }

    private boolean shouldSendRequestEmail(String type) {
        if (type == null) return false;

        return "REQUEST_APPROVED".equals(type)
                || "REQUEST_REJECTED".equals(type)
                || "ROLE_CHANGE".equals(type)
                || "TEAM_CHANGE".equals(type);
    }

    private void applyRoleChange(Request req) {
        String requestedRole = req.getRequestedValue();

        if (requestedRole == null || requestedRole.trim().isEmpty()) {
            String description = req.getDescription();

            if (description == null || !description.contains("Requested Role:")) {
                throw new RuntimeException("Requested role not found in request");
            }

            requestedRole = description
                    .split("Requested Role:")[1]
                    .split("\\n")[0]
                    .trim();
        }

        User user = userRepository.findByEmail(req.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(requestedRole);
        userRepository.save(user);

        notifyUser(
                user.getEmail(),
                "Role Updated",
                "Your role has been changed to: " + requestedRole,
                "ROLE_CHANGE",
                null
        );
    }

    private void applyTeamChange(Request req) {
        String requestedTeam = req.getRequestedValue();

        if (requestedTeam == null || requestedTeam.trim().isEmpty()) {
            String description = req.getDescription();

            if (description == null || !description.contains("Requested Team:")) {
                throw new RuntimeException("Requested team not found in request");
            }

            requestedTeam = description
                    .split("Requested Team:")[1]
                    .split("\\n")[0]
                    .trim();
        }

        User user = userRepository.findByEmail(req.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setDepartment(requestedTeam);
        userRepository.save(user);

        notifyUser(
                user.getEmail(),
                "Team Updated",
                "Your department/team has been changed to: " + requestedTeam,
                "TEAM_CHANGE",
                null
        );
    }

    private void applyDeadlineExtension(Request req) {
        Long taskId = req.getTaskId();
        String newDeadline = req.getRequestedValue();

        if (taskId == null || newDeadline == null || newDeadline.trim().isEmpty()) {
            String description = req.getDescription();

            if (description == null ||
                    !description.contains("Task Info:") ||
                    !description.contains("Requested Deadline:")) {
                throw new RuntimeException("Invalid deadline extension request format");
            }

            taskId = Long.parseLong(
                    description
                            .split("Task Info:")[1]
                            .split("\\n")[0]
                            .trim()
            );

            newDeadline = description
                    .split("Requested Deadline:")[1]
                    .split("\\n")[0]
                    .trim();
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setDueDate(newDeadline);
        taskRepository.save(task);

        notifyAssignedTaskUsers(
                task,
                "Task Deadline Updated",
                "Deadline for task \"" + task.getTitle() + "\" has been changed to: " + newDeadline,
                "TASK_UPDATED"
        );
    }

    private void applyProjectJoin(Request req) {
        Long projectId = getProjectIdFromRequest(req);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<String> members = cleanMemberEmails(project.getMemberEmails());

        if (!members.contains(req.getCreatedBy())) {
            members.add(req.getCreatedBy());
        }

        project.setMemberEmails(members);
        projectRepository.save(project);

        notifyUser(
                req.getCreatedBy(),
                "Joined Project",
                "You have been added to project: " + project.getName(),
                "PROJECT_ASSIGNED",
                null
        );
    }

    private void applyProjectLeave(Request req) {
        Long projectId = getProjectIdFromRequest(req);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<String> members = cleanMemberEmails(project.getMemberEmails());

        members.remove(req.getCreatedBy());

        project.setMemberEmails(members);
        projectRepository.save(project);

        notifyUser(
                req.getCreatedBy(),
                "Left Project",
                "You have been removed from project: " + project.getName(),
                "PROJECT_UPDATED",
                null
        );
    }

    private void applyProjectUpdate(Request req) {
        Long projectId = getProjectIdFromRequest(req);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        String requestedValue = req.getRequestedValue();

        if (requestedValue != null && requestedValue.contains("Status:")) {
            String status = requestedValue
                    .split("Status:")[1]
                    .split("\\n")[0]
                    .trim();

            project.setStatus(status);
        }

        if (requestedValue != null && requestedValue.contains("Description:")) {
            String description = requestedValue
                    .split("Description:")[1]
                    .split("\\n")[0]
                    .trim();

            project.setDescription(description);
        }

        projectRepository.save(project);

        notifyProjectMembers(
                project,
                "Project Updated",
                "Project was updated: " + project.getName(),
                "PROJECT_UPDATED"
        );
    }

    private void applyProjectDeadline(Request req) {
        Long projectId = getProjectIdFromRequest(req);
        String newDeadline = req.getRequestedValue();

        if (newDeadline == null || newDeadline.trim().isEmpty()) {
            String description = req.getDescription();

            if (description == null || !description.contains("New Deadline:")) {
                throw new RuntimeException("New deadline not found in request");
            }

            newDeadline = description
                    .split("New Deadline:")[1]
                    .split("\\n")[0]
                    .trim();
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setEndDate(LocalDate.parse(newDeadline));
        projectRepository.save(project);

        notifyProjectMembers(
                project,
                "Project Deadline Updated",
                "Deadline for project \"" + project.getName() + "\" has been changed to: " + newDeadline,
                "PROJECT_UPDATED"
        );
    }

    private void applyKanbanApproval(Request req) {
        Long taskId = req.getTaskId();

        if (taskId == null) {
            String description = req.getDescription();

            if (description == null || !description.contains("Task:")) {
                throw new RuntimeException("Task id not found in request");
            }

            taskId = Long.parseLong(
                    description
                            .split("Task:")[1]
                            .split("\\n")[0]
                            .trim()
            );
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setStatus("DONE");
        task.setApprovedBy(req.getReviewedBy());
        task.setApprovedAt(LocalDateTime.now().toString());
        task.setReviewNote("");

        taskRepository.save(task);

        notifyAssignedTaskUsers(
                task,
                "Task Approved",
                "Your task \"" + task.getTitle() + "\" has been approved.",
                "TASK_APPROVED"
        );
    }

    private Long getProjectIdFromRequest(Request req) {
        if (req.getProjectId() != null) {
            return req.getProjectId();
        }

        String description = req.getDescription();

        if (description == null || !description.contains("Project:")) {
            throw new RuntimeException("Project id not found in request");
        }

        return Long.parseLong(
                description
                        .split("Project:")[1]
                        .split("\\n")[0]
                        .trim()
        );
    }

    private List<String> cleanMemberEmails(List<String> emails) {
        Set<String> cleanEmails = new LinkedHashSet<>();

        if (emails == null) {
            return new ArrayList<>();
        }

        for (String email : emails) {
            if (email == null) continue;

            String cleanEmail = email.trim();

            if (!cleanEmail.isEmpty()) {
                cleanEmails.add(cleanEmail);
            }
        }

        return new ArrayList<>(cleanEmails);
    }

    private void notifyProjectMembers(Project project, String title, String message, String type) {
        if (project.getMemberEmails() == null) return;

        for (String email : project.getMemberEmails()) {
            notifyUser(email, title, message, type, null);
        }
    }

    private void notifyAssignedTaskUsers(Task task, String title, String message, String type) {
        if (task.getAssignedTo() == null || task.getAssignedTo().trim().isEmpty()) {
            return;
        }

        String[] emails = task.getAssignedTo().split(",");

        for (String email : emails) {
            notifyUser(email, title, message, type, task.getId());
        }
    }

    private String getRequestNotificationType(Request request) {
        if (request.getType() == null) {
            return "REQUEST_CREATED";
        }

        if (request.getType().startsWith("PROJECT")) {
            return "PROJECT_REQUEST";
        }

        if (request.getType().startsWith("KANBAN")) {
            return "KANBAN_REQUEST";
        }

        return "REQUEST_CREATED";
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

        if (shouldSendRequestEmail(type)) {
            emailService.sendEmail(email.trim(), title, message);
        }
    }
}
