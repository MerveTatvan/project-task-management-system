package com.example.demo.controller;

import com.example.demo.model.ActivityLog;
import com.example.demo.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity")
@CrossOrigin(origins = "*")
public class ActivityLogController {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping
    public List<ActivityLog> getRecentActivities() {
        return activityLogRepository.findTop50ByOrderByIdDesc();
    }

    @GetMapping("/{email}")
    public List<ActivityLog> getUserActivitiesShortPath(@PathVariable String email) {
        return activityLogRepository.findByActorEmailOrderByIdDesc(email);
    }

    @GetMapping("/{type}/{targetId}")
    public List<ActivityLog> getActivitiesByTypeAndTarget(
            @PathVariable String type,
            @PathVariable Long targetId
    ) {
        return activityLogRepository.findByTypeAndTargetIdOrderByIdDesc(type, targetId);
    }

    @GetMapping("/project/{projectId}")
    public List<ActivityLog> getProjectActivities(@PathVariable Long projectId) {
        return activityLogRepository.findByTypeAndTargetIdOrderByIdDesc("PROJECT", projectId);
    }

    @GetMapping("/task/{taskId}")
    public List<ActivityLog> getTaskActivities(@PathVariable Long taskId) {
        return activityLogRepository.findByTypeAndTargetIdOrderByIdDesc("TASK", taskId);
    }

    @GetMapping("/user/{email}")
    public List<ActivityLog> getUserActivities(@PathVariable String email) {
        return activityLogRepository.findByActorEmailOrderByIdDesc(email);
    }
}
