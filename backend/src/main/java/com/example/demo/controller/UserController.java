package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PutMapping("/{id}/role")
    public String updateUserRole(
            @PathVariable Long id,
            @RequestParam String adminEmail,
            @RequestBody String role
    ) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (!"ADMIN".equals(admin.getRole())) {
            return "You are not authorized";
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(role.replace("\"", ""));
        userRepository.save(user);

        return "Role updated";
    }

    @PutMapping("/update/{email}")
    public User updateUser(@PathVariable String email, @RequestBody User updatedUser) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setExtraInfo(updatedUser.getExtraInfo());

        return userRepository.save(user);
    }
}