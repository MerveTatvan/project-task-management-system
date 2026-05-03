package com.example.demo.repository;

import com.example.demo.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findByAssignedToContaining(String email);

    List<Task> findByCreatedBy(String email);

    List<Task> findByStatusNotAndDueDate(String status, String dueDate);

    List<Task> findByIdIn(List<Long> ids); // 🔥 yeni ekledik
}