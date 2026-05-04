package com.example.demo.controller;

import com.example.demo.model.Project;
import com.example.demo.model.Notification;
import com.example.demo.model.ActivityLog;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private void logActivity(String action, Project project, String actorEmail, String message) {
        if (project == null) return;

        ActivityLog activityLog = new ActivityLog();
        activityLog.setType("PROJECT");
        activityLog.setTargetId(project.getId());
        activityLog.setAction(action);
        activityLog.setActorEmail(actorEmail == null ? "system" : actorEmail);
        activityLog.setMessage(message);
        activityLog.setCreatedAt(LocalDateTime.now().toString());

        activityLogRepository.save(activityLog);
    }

    private void sendProjectNotification(
            String receiverEmail,
            String title,
            String message,
            String type,
            String emailSubject,
            String emailBody
    ) {
        if (receiverEmail == null || receiverEmail.trim().isEmpty()) {
            return;
        }

        String cleanEmail = receiverEmail.trim();

        Notification notification = new Notification();
        notification.setReceiverEmail(cleanEmail);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReadStatus(false);
        notification.setCreatedAt(LocalDateTime.now().toString());

        notificationRepository.save(notification);

        if (shouldSendProjectEmail(type)) {
            emailService.sendEmail(cleanEmail, emailSubject, emailBody);
        }
    }

    private boolean shouldSendProjectEmail(String type) {
        if (type == null) return false;

        return "PROJECT_ASSIGNED".equals(type);
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

    @PostMapping
    public Project createProject(@RequestBody Project project) {

        if (project.getStatus() == null || project.getStatus().isEmpty()) {
            project.setStatus("Active");
        }

        project.setMemberEmails(cleanMemberEmails(project.getMemberEmails()));

        Project savedProject = projectRepository.save(project);

        logActivity(
                "PROJECT_CREATED",
                savedProject,
                savedProject.getCreatedBy(),
                "Project created: " + savedProject.getName()
        );

        if (savedProject.getMemberEmails() != null) {
            for (String email : savedProject.getMemberEmails()) {
                sendProjectNotification(
                        email,
                        "New Project Assigned",
                        "You were added to project: " + savedProject.getName(),
                        "PROJECT_ASSIGNED",
                        "You were added to a project",
                        "Hello,\n\nYou have been added to the project: "
                                + savedProject.getName()
                                + "\n\nDescription: " + savedProject.getDescription()
                                + "\n\nGitHub Repository: " + (savedProject.getGithubUrl() == null ? "-" : savedProject.getGithubUrl())
                                + "\n\nStatus: " + savedProject.getStatus()
                );
            }
        }

        return savedProject;
    }

    @GetMapping
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @GetMapping("/{id}")
    public Project getProjectById(@PathVariable Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    @PutMapping("/{id}")
    public Project updateProject(@PathVariable Long id, @RequestBody Project updatedProject) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<String> oldMembers = cleanMemberEmails(project.getMemberEmails());
        List<String> newMembers = cleanMemberEmails(updatedProject.getMemberEmails());

        project.setName(updatedProject.getName());
        project.setDescription(updatedProject.getDescription());
        project.setGithubUrl(updatedProject.getGithubUrl());
        project.setStatus(updatedProject.getStatus());
        project.setStartDate(updatedProject.getStartDate());
        project.setEndDate(updatedProject.getEndDate());
        project.setMemberEmails(newMembers);
        project.setCreatedBy(updatedProject.getCreatedBy());

        Project savedProject = projectRepository.save(project);

        logActivity(
                "PROJECT_UPDATED",
                savedProject,
                savedProject.getCreatedBy(),
                "Project updated: " + savedProject.getName()
        );

        Set<String> usersToNotify = new LinkedHashSet<>();
        usersToNotify.addAll(oldMembers);
        usersToNotify.addAll(newMembers);

        for (String email : usersToNotify) {
            String title = oldMembers.contains(email)
                    ? "Project Updated"
                    : "New Project Assigned";

            String message = oldMembers.contains(email)
                    ? "Project was updated: " + savedProject.getName()
                    : "You were added to project: " + savedProject.getName();

            String type = oldMembers.contains(email)
                    ? "PROJECT_UPDATED"
                    : "PROJECT_ASSIGNED";

            sendProjectNotification(
                    email,
                    title,
                    message,
                    type,
                    title,
                    "Hello,\n\nProject information has been updated."
                            + "\n\nProject: " + savedProject.getName()
                            + "\n\nDescription: " + savedProject.getDescription()
                            + "\n\nGitHub Repository: " + (savedProject.getGithubUrl() == null ? "-" : savedProject.getGithubUrl())
                            + "\n\nStatus: " + savedProject.getStatus()
            );
        }

        return savedProject;
    }

    @DeleteMapping("/{id}")
    public String deleteProject(@PathVariable Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<String> members = cleanMemberEmails(project.getMemberEmails());

        for (String email : members) {
            sendProjectNotification(
                    email,
                    "Project Deleted",
                    "Project was deleted: " + project.getName(),
                    "PROJECT_DELETED",
                    "Project Deleted",
                    "Hello,\n\nThe following project has been deleted:"
                            + "\n\nProject: " + project.getName()
                            + "\n\nDescription: " + project.getDescription()
            );
        }

        logActivity(
                "PROJECT_DELETED",
                project,
                project.getCreatedBy(),
                "Project deleted: " + project.getName()
        );

        projectRepository.deleteById(id);
        return "Project deleted";
    }
}
