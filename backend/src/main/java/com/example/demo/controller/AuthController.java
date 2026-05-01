package com.example.demo.controller;

import com.example.demo.dto.LoginRequest;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public String register(@RequestBody User user) {

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return "Bu email zaten kayıtlı";
        }

        if ("admin@test.com".equals(user.getEmail())) {
            user.setRole("ADMIN");
        } else {
            user.setRole("WORKER");
        }

        if (user.getExtraInfo() == null) {
            user.setExtraInfo("");
        }

        userRepository.save(user);

        return "Kullanıcı başarıyla kaydedildi";
    }

    @PostMapping("/login")
    public Object login(@RequestBody LoginRequest loginRequest) {

        Optional<User> foundUser = userRepository.findByEmail(loginRequest.getEmail());

        if (foundUser.isEmpty()) {
            return "Kullanıcı bulunamadı";
        }

        User user = foundUser.get();

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return "Şifre yanlış";
        }

        String token = jwtUtil.generateToken(user);

        return Map.of(
                "token", token,
                "email", user.getEmail(),
                "role", user.getRole()
        );
    }

    @GetMapping("/me/{email}")
    public Object getProfile(@PathVariable String email) {

        Optional<User> foundUser = userRepository.findByEmail(email);

        if (foundUser.isEmpty()) {
            return "Kullanıcı bulunamadı";
        }

        User user = foundUser.get();

        return Map.of(
                "id", user.getId(),
                "name", user.getName() == null ? "" : user.getName(),
                "surname", user.getSurname() == null ? "" : user.getSurname(),
                "email", user.getEmail(),
                "role", user.getRole() == null ? "" : user.getRole(),
                "department", user.getDepartment() == null ? "" : user.getDepartment(),
                "birthDate", user.getBirthDate() == null ? "" : user.getBirthDate(),
                "extraInfo", user.getExtraInfo() == null ? "" : user.getExtraInfo()
        );
    }
}