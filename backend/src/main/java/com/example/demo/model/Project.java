package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    private String status = "Active";

    private LocalDate startDate;
    private LocalDate endDate;

    @ElementCollection
    @CollectionTable(
            name = "project_members",
            joinColumns = @JoinColumn(name = "project_id")
    )
    @Column(name = "member_email")
    private List<String> memberEmails = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }    

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            this.status = "Active";
        } else {
            this.status = status;
        }
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public List<String> getMemberEmails() {
        return memberEmails;
    }

    public void setMemberEmails(List<String> memberEmails) {
        this.memberEmails = memberEmails;
    }
}