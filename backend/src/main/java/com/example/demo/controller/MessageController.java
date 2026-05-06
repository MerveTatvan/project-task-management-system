package com.example.demo.controller;

import com.example.demo.model.Message;
import com.example.demo.model.Notification;
import com.example.demo.model.ActivityLog;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private void logMessageActivity(String action, Message message, String actorEmail, String activityMessage) {
        if (message == null) return;

        ActivityLog activityLog = new ActivityLog();
        activityLog.setType("MESSAGE");
        activityLog.setTargetId(message.getId());
        activityLog.setAction(action);
        activityLog.setActorEmail(actorEmail == null ? "system" : actorEmail);
        activityLog.setMessage(activityMessage);
        activityLog.setCreatedAt(LocalDateTime.now().toString());

        activityLogRepository.save(activityLog);
    }

    @PostMapping
    public Message sendMessage(@RequestBody Message message) {
        message.setTimestamp(LocalDateTime.now().toString());

        Message savedMessage = messageRepository.save(message);

        logMessageActivity(
                "MESSAGE_SENT",
                savedMessage,
                savedMessage.getSender(),
                "Message sent to " + savedMessage.getReceiver()
        );

        Notification notification = new Notification();
        notification.setReceiverEmail(message.getReceiver());
        notification.setTitle("New Message");
        notification.setMessage("You received a new message from " + message.getSender());
        notification.setType("MESSAGE");
        notification.setTaskId(null);
        notification.setReadStatus(false);
        notification.setCreatedAt(LocalDateTime.now().toString());

        notificationRepository.save(notification);

        emailService.sendMessageEmail(message.getReceiver(), message.getSender());

        return savedMessage;
    }

    @GetMapping("/chat")
    public List<Message> getChat(
            @RequestParam String user1,
            @RequestParam String user2
    ) {
        return messageRepository.findBySenderAndReceiverOrReceiverAndSender(
                user1,
                user2,
                user2,
                user1
        );
    }

    @DeleteMapping("/chat")
    public String deleteChat(
            @RequestParam String user1,
            @RequestParam String user2
    ) {
        List<Message> messages = messageRepository.findBySenderAndReceiverOrReceiverAndSender(
                user1,
                user2,
                user2,
                user1
        );

        messageRepository.deleteAll(messages);

        ActivityLog activityLog = new ActivityLog();
        activityLog.setType("MESSAGE");
        activityLog.setTargetId(null);
        activityLog.setAction("CHAT_DELETED");
        activityLog.setActorEmail(user1);
        activityLog.setMessage("Conversation deleted with " + user2);
        activityLog.setCreatedAt(LocalDateTime.now().toString());
        activityLogRepository.save(activityLog);

        return "Conversation deleted";
    }

    @GetMapping("/{email}")
    public List<Message> getMessages(@PathVariable String email) {
        return messageRepository.findBySenderOrReceiver(email, email);
    }

    @PutMapping("/{id}")
    public Message updateMessage(@PathVariable Long id, @RequestBody Message updatedMessage) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        message.setText(updatedMessage.getText());
        message.setFileUrl(updatedMessage.getFileUrl());
        message.setFileName(updatedMessage.getFileName());
        message.setFileType(updatedMessage.getFileType());

        Message savedMessage = messageRepository.save(message);

        logMessageActivity(
                "MESSAGE_UPDATED",
                savedMessage,
                savedMessage.getSender(),
                "Message updated"
        );

        return savedMessage;
    }

    @DeleteMapping("/{id}")
    public String deleteMessage(@PathVariable Long id) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        messageRepository.deleteById(id);

        logMessageActivity(
                "MESSAGE_DELETED",
                message,
                message.getSender(),
                "Message deleted"
        );

        return "Message deleted";
    }
}
