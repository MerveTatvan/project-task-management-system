package com.example.demo.repository;

import com.example.demo.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByTaskIdOrderByIdDesc(Long taskId);

    List<Comment> findByTaskId(Long taskId);

    void deleteByTaskId(Long taskId);
}
