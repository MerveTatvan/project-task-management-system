package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public String register(@RequestBody User user) {

        // Aynı email var mı kontrol et
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return "Bu email zaten kayıtlı";
        }

        // Default rol
        user.setRole("CALISAN");

        // Kaydet
        userRepository.save(user);

        return "Kullanıcı başarıyla kaydedildi";
    }
}