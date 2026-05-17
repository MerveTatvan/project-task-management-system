package com.example.demo.controller;

import com.example.demo.dto.LoginRequest;
import com.example.demo.model.User;
import com.example.demo.model.ActivityLog;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.EmailService;
import com.example.demo.util.PasswordValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private void logAuthActivity(String action, User user, String message) {
        if (user == null) return;

        ActivityLog activityLog = new ActivityLog();
        activityLog.setType("SECURITY");
        activityLog.setTargetId(user.getId());
        activityLog.setAction(action);
        activityLog.setActorEmail(user.getEmail());
        activityLog.setMessage(message);
        activityLog.setCreatedAt(LocalDateTime.now().toString());

        activityLogRepository.save(activityLog);
    }

    private boolean isBCryptHash(String password) {
        if (password == null) return false;

        return password.startsWith("$2a$")
                || password.startsWith("$2b$")
                || password.startsWith("$2y$");
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (rawPassword == null || storedPassword == null) {
            return false;
        }

        if (isBCryptHash(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        return storedPassword.equals(rawPassword);
    }

    private void upgradePlainPasswordToHashIfNeeded(User user, String rawPassword) {
        if (user == null || rawPassword == null) return;

        if (!isBCryptHash(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
        }
    }

    @PostMapping("/register")
    public String register(@RequestBody User user) {

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return "Bu email zaten kayıtlı";
        }

        if (!PasswordValidator.isValid(user.getPassword(), user.getName(), user.getSurname())) {
            return "Şifre kurallara uymuyor";
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

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

        if (user.getResetCode() == null) {
            user.setResetCode("");
        }

        if (user.getResetCodeExpire() == null) {
            user.setResetCodeExpire("");
        }

        User savedUser = userRepository.save(user);

        logAuthActivity(
                "ACCOUNT_REGISTERED",
                savedUser,
                "Account registered"
        );

        return "Kullanıcı başarıyla kaydedildi";
    }

    @PostMapping("/login")
    public Object login(@RequestBody LoginRequest loginRequest) {

        Optional<User> foundUser = userRepository.findByEmail(loginRequest.getEmail());

        if (foundUser.isEmpty()) {
            return "Kullanıcı bulunamadı";
        }

        User user = foundUser.get();

        if (!passwordMatches(loginRequest.getPassword(), user.getPassword())) {
            return "Şifre yanlış";
        }

        upgradePlainPasswordToHashIfNeeded(user, loginRequest.getPassword());

        String token = jwtUtil.generateToken(user);

        logAuthActivity(
                "LOGIN_SUCCESS",
                user,
                "User logged in"
        );

        return Map.of(
                "token", token,
                "email", user.getEmail(),
                "role", user.getRole()
        );
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(@RequestParam String email) {

        Optional<User> foundUser = userRepository.findByEmail(email);

        if (foundUser.isEmpty()) {
            return "Kullanıcı bulunamadı";
        }

        User user = foundUser.get();

        String code = String.valueOf(new Random().nextInt(900000) + 100000);

        user.setResetCode(code);
        user.setResetCodeExpire(LocalDateTime.now().plusMinutes(10).toString());

        userRepository.save(user);

        emailService.sendEmail(
                user.getEmail(),
                "Password Reset Code",
                "Hello " + (user.getName() == null ? "" : user.getName()) + ",\n\n"
                        + "Your password reset verification code is: " + code + "\n\n"
                        + "This code is valid for 10 minutes."
        );

        return "Kod email adresine gönderildi";
    }

    @PostMapping("/verify-reset-code")
    public String verifyResetCode(
            @RequestParam String email,
            @RequestParam String code
    ) {

        Optional<User> foundUser = userRepository.findByEmail(email);

        if (foundUser.isEmpty()) {
            return "Kullanıcı bulunamadı";
        }

        User user = foundUser.get();

        if (user.getResetCode() == null || user.getResetCode().isEmpty()) {
            return "Kod bulunamadı";
        }

        if (!user.getResetCode().equals(code)) {
            return "Kod yanlış";
        }

        if (user.getResetCodeExpire() == null || user.getResetCodeExpire().isEmpty()) {
            return "Kod süresi bulunamadı";
        }

        LocalDateTime expireTime = LocalDateTime.parse(user.getResetCodeExpire());

        if (LocalDateTime.now().isAfter(expireTime)) {
            return "Kodun süresi doldu";
        }

        return "Kod doğrulandı";
    }

    @PostMapping("/reset-password")
    public String resetPassword(
            @RequestParam String email,
            @RequestParam String code,
            @RequestParam String newPassword
    ) {

        Optional<User> foundUser = userRepository.findByEmail(email);

        if (foundUser.isEmpty()) {
            return "Kullanıcı bulunamadı";
        }

        User user = foundUser.get();

        if (user.getResetCode() == null || user.getResetCode().isEmpty()) {
            return "Kod bulunamadı";
        }

        if (!user.getResetCode().equals(code)) {
            return "Kod yanlış";
        }

        if (user.getResetCodeExpire() == null || user.getResetCodeExpire().isEmpty()) {
            return "Kod süresi bulunamadı";
        }

        LocalDateTime expireTime = LocalDateTime.parse(user.getResetCodeExpire());

        if (LocalDateTime.now().isAfter(expireTime)) {
            return "Kodun süresi doldu";
        }

        if (!PasswordValidator.isValid(newPassword, user.getName(), user.getSurname())) {
            return "Şifre kurallara uymuyor";
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetCode("");
        user.setResetCodeExpire("");

        userRepository.save(user);

        logAuthActivity(
                "PASSWORD_RESET",
                user,
                "Password reset completed"
        );

        emailService.sendEmail(
                user.getEmail(),
                "Password Changed",
                "Your password has been changed successfully."
        );

        return "Şifre başarıyla güncellendi";
    }

    @PostMapping("/change-password")
    public String changePassword(
            @RequestParam String email,
            @RequestParam String oldPassword,
            @RequestParam String newPassword
    ) {

        Optional<User> foundUser = userRepository.findByEmail(email);

        if (foundUser.isEmpty()) {
            return "Kullanıcı bulunamadı";
        }

        User user = foundUser.get();

        if (!passwordMatches(oldPassword, user.getPassword())) {
            return "Eski şifre yanlış";
        }

        if (!PasswordValidator.isValid(newPassword, user.getName(), user.getSurname())) {
            return "Şifre kurallara uymuyor";
        }

        user.setPassword(passwordEncoder.encode(newPassword));

        userRepository.save(user);

        logAuthActivity(
                "PASSWORD_CHANGED",
                user,
                "Password changed from profile"
        );

        emailService.sendEmail(
                user.getEmail(),
                "Password Changed",
                "Your password has been changed from your profile."
        );

        return "Şifre başarıyla değiştirildi";
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
