package com.example.demo.controller;

import com.example.demo.model.Comment;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.model.ActivityLog;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = "*")
public class CommentController {

    private static final int MAX_FILE_DATA_LENGTH = 700000;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private void logCommentActivity(String action, Comment comment, String actorEmail, String message) {
        if (comment == null) return;

        ActivityLog activityLog = new ActivityLog();
        activityLog.setType("COMMENT");
        activityLog.setTargetId(comment.getTaskId());
        activityLog.setAction(action);
        activityLog.setActorEmail(actorEmail == null ? "system" : actorEmail);
        activityLog.setMessage(message);
        activityLog.setCreatedAt(LocalDateTime.now().toString());

        activityLogRepository.save(activityLog);
    }

    @GetMapping("/task/{taskId}")
    public List<Comment> getCommentsByTask(@PathVariable Long taskId) {
        return commentRepository.findByTaskIdOrderByIdDesc(taskId);
    }

    @PostMapping
    public Comment addComment(@RequestBody Comment comment) {

        validateCommentAttachment(comment);

        Comment savedComment = commentRepository.save(comment);

        logCommentActivity(
                "COMMENT_ADDED",
                savedComment,
                savedComment.getAuthorEmail(),
                "Comment added to task #" + savedComment.getTaskId()
        );

        sendMentionNotifications(savedComment);

        return savedComment;
    }

    @PutMapping("/{id}")
    public Comment updateComment(@PathVariable Long id, @RequestBody Comment updatedComment) {

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        validateCommentAttachment(updatedComment);
        validateCommentOwnerOrAdmin(comment, updatedComment.getAuthorEmail());

        comment.setText(updatedComment.getText());
        comment.setFileUrl(updatedComment.getFileUrl());
        comment.setFileName(updatedComment.getFileName());
        comment.setFileType(updatedComment.getFileType());

        Comment savedComment = commentRepository.save(comment);

        logCommentActivity(
                "COMMENT_UPDATED",
                savedComment,
                savedComment.getAuthorEmail(),
                "Comment updated on task #" + savedComment.getTaskId()
        );

        sendMentionNotifications(savedComment);

        return savedComment;
    }

    @DeleteMapping("/{id}")
    public String deleteComment(
            @PathVariable Long id,
            @RequestParam(required = false) String userEmail
    ) {

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        validateCommentOwnerOrAdmin(comment, userEmail);

        commentRepository.deleteById(id);

        logCommentActivity(
                "COMMENT_DELETED",
                comment,
                userEmail,
                "Comment deleted from task #" + comment.getTaskId()
        );

        return "Comment deleted";
    }

    private void validateCommentAttachment(Comment comment) {

        if (comment == null) return;

        if (
                comment.getFileUrl() != null &&
                comment.getFileUrl().length() > MAX_FILE_DATA_LENGTH
        ) {
            throw new RuntimeException(
                    "File is too large. Maximum allowed size is 500 KB."
            );
        }
    }

    private void validateCommentOwnerOrAdmin(Comment comment, String userEmail) {

        if (comment == null) {
            throw new RuntimeException("Comment not found");
        }

        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new RuntimeException(
                    "User email is required for this action"
            );
        }

        String cleanEmail = userEmail.trim();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAdmin = "ADMIN".equals(user.getRole());

        boolean isOwner =
                comment.getAuthorEmail() != null &&
                comment.getAuthorEmail()
                        .trim()
                        .equalsIgnoreCase(cleanEmail);

        if (!isAdmin && !isOwner) {
            throw new RuntimeException(
                    "Only comment owner or admin can modify this comment"
            );
        }
    }

    private void sendMentionNotifications(Comment comment) {

        if (
                comment.getText() == null ||
                !comment.getText().contains("@")
        ) {
            return;
        }

        List<User> users = userRepository.findAll();

        String text = comment.getText().toLowerCase();

        for (User user : users) {

            String name =
                    user.getName() == null
                            ? ""
                            : user.getName().toLowerCase();

            String surname =
                    user.getSurname() == null
                            ? ""
                            : user.getSurname().toLowerCase();

            String fullName = (name + " " + surname).trim();

            boolean mentioned =
                    (!name.isEmpty() && text.contains("@" + name)) ||
                    (!surname.isEmpty() && text.contains("@" + surname)) ||
                    (!fullName.isEmpty() && text.contains("@" + fullName));

            if (
                    mentioned &&
                    user.getEmail() != null &&
                    !user.getEmail().equals(comment.getAuthorEmail())
            ) {

                Notification notification = new Notification();

                notification.setReceiverEmail(user.getEmail());

                notification.setTitle("You were mentioned");

                notification.setMessage(
                        comment.getAuthorEmail() +
                                " mentioned you in a comment."
                );

                notification.setType("COMMENT_MENTION");

                notification.setTaskId(comment.getTaskId());

                notification.setReadStatus(false);

                notification.setCreatedAt(LocalDateTime.now().toString());

                notificationRepository.save(notification);
            }
        }
    }
}