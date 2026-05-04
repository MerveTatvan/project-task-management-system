package com.example.demo.controller;

import com.example.demo.model.Project;
import com.example.demo.model.Notification;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

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

    @PostMapping
    public Project createProject(@RequestBody Project project) {

        if (project.getStatus() == null || project.getStatus().isEmpty()) {
            project.setStatus("Active");
        }

        Project savedProject = projectRepository.save(project);

        if (savedProject.getMemberEmails() != null) {
            for (String email : savedProject.getMemberEmails()) {
                String cleanEmail = email.trim();

                if (cleanEmail.isEmpty()) continue;

                Notification notification = new Notification();
                notification.setReceiverEmail(cleanEmail);
                notification.setTitle("New Project Assigned");
                notification.setMessage("You were added to project: " + savedProject.getName());
                notification.setType("PROJECT");
                notification.setReadStatus(false);
                notification.setCreatedAt(LocalDateTime.now().toString());

                notificationRepository.save(notification);

                emailService.sendEmail(
                        cleanEmail,
                        "You were added to a project",
                        "Hello,\n\nYou have been added to the project: "
                                + savedProject.getName()
                                + "\n\nDescription: " + savedProject.getDescription()
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
}