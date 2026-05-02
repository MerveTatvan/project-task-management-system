package com.example.demo.controller;

import com.example.demo.model.Request;
import com.example.demo.repository.RequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "*")
public class RequestController {

    @Autowired
    private RequestRepository requestRepository;

    @PostMapping
    public Request createRequest(@RequestBody Request request) {
        request.setStatus("PENDING");
        return requestRepository.save(request);
    }

    @GetMapping
    public List<Request> getAllRequests() {
        return requestRepository.findAll();
    }

    @PutMapping("/{id}")
    public Request updateStatus(@PathVariable Long id, @RequestBody Request updated) {
        Request req = requestRepository.findById(id).orElseThrow();
        req.setStatus(updated.getStatus());
        return requestRepository.save(req);
    }
}