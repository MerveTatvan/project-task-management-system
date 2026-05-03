package com.example.demo.controller;

import com.example.demo.dto.LoginRequest;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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

        if (user.getLinkedin() == null) {
            user.setLinkedin("");
        }

        if (user.getGithub() == null) {
            user.setGithub("");
        }

        if (user.getProfileImage() == null) {
            user.setProfileImage("");
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

        Map<String, Object> profile = new HashMap<>();

        profile.put("id", user.getId());
        profile.put("name", user.getName() == null ? "" : user.getName());
        profile.put("surname", user.getSurname() == null ? "" : user.getSurname());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole() == null ? "" : user.getRole());
        profile.put("department", user.getDepartment() == null ? "" : user.getDepartment());
        profile.put("birthDate", user.getBirthDate() == null ? "" : user.getBirthDate());
        profile.put("extraInfo", user.getExtraInfo() == null ? "" : user.getExtraInfo());
        profile.put("linkedin", user.getLinkedin() == null ? "" : user.getLinkedin());
        profile.put("github", user.getGithub() == null ? "" : user.getGithub());
        profile.put("profileImage", user.getProfileImage() == null ? "" : user.getProfileImage());

        return profile;
    }
}