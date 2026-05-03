package com.example.demo.repository;

import com.example.demo.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findBySenderOrReceiver(String sender, String receiver);

    List<Message> findBySenderAndReceiverOrReceiverAndSender(
            String sender,
            String receiver,
            String receiver2,
            String sender2
    );

    void deleteBySenderAndReceiverOrReceiverAndSender(
            String sender,
            String receiver,
            String receiver2,
            String sender2
    );
}