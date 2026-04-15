package com.example.demo.controller;

import com.example.demo.model.Task;
import com.example.demo.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        if (task.getStatus() == null || task.getStatus().isEmpty()) {
            task.setStatus("TODO");
        }
        return taskRepository.save(task);
    }

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @GetMapping("/project/{projectId}")
    public List<Task> getTasksByProjectId(@PathVariable Long projectId) {
        return taskRepository.findByProjectId(projectId);
    }

    @PutMapping("/{id}/status")
    public String updateTaskStatus(@PathVariable Long id, @RequestParam String status) {
        Optional<Task> optionalTask = taskRepository.findById(id);

        if (optionalTask.isEmpty()) {
            return "Görev bulunamadı";
        }

        Task task = optionalTask.get();
        task.setStatus(status);
        taskRepository.save(task);

        return "Görev durumu güncellendi";
    }
}