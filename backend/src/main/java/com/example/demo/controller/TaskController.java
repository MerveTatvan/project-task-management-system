package com.example.demo.controller;

import jakarta.transaction.Transactional;
import com.example.demo.model.Task;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.CommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


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

    @GetMapping("/assigned/{email}")
public List<Task> getTasksByAssignedUser(@PathVariable String email) {
    return taskRepository.findByAssignedToContaining(email);
}

    @PutMapping("/{id}/status")
    public String updateTaskStatus(@PathVariable Long id, @RequestParam String status) {
        Optional<Task> optionalTask = taskRepository.findById(id);

        if (optionalTask.isEmpty()) {
            return "Task not found";
        }

        Task task = optionalTask.get();
        task.setStatus(status);
        taskRepository.save(task);

        return "Task status updated";
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