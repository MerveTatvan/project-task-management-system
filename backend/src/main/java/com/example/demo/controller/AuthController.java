package com.example.demo.controller;

import com.example.demo.dto.LoginRequest;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public String register(@RequestBody User user) {

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return "Bu email zaten kayıtlı";
        }

        user.setRole("CALISAN");
        userRepository.save(user);

        return "Kullanıcı başarıyla kaydedildi";
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest loginRequest) {

        Optional<User> foundUser = userRepository.findByEmail(loginRequest.getEmail());

        if (foundUser.isEmpty()) {
            return "Kullanıcı bulunamadı";
        }

        User user = foundUser.get();

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return "Şifre yanlış";
        }

        return "Giriş başarılı. Hoş geldin " + user.getName();
    }
}
