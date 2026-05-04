package com.example.demo.repository;

import com.example.demo.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByTypeAndTargetIdOrderByIdDesc(String type, Long targetId);

    List<ActivityLog> findByActorEmailOrderByIdDesc(String actorEmail);

    List<ActivityLog> findTop50ByOrderByIdDesc();
}
