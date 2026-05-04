package com.example.demo.util;

public class PasswordValidator {

    public static boolean isValid(String password, String name, String surname) {

        if (password == null || password.length() < 8) {
            return false;
        }

        if (!password.matches(".*[A-Z].*")) return false;
        if (!password.matches(".*[a-z].*")) return false;
        if (!password.matches(".*\\d.*")) return false;
        if (!password.matches(".*[!@#$%^&*].*")) return false;

        String lowerPassword = password.toLowerCase();

        if (name != null && !name.isEmpty() &&
                lowerPassword.contains(name.toLowerCase())) {
            return false;
        }

        if (surname != null && !surname.isEmpty() &&
                lowerPassword.contains(surname.toLowerCase())) {
            return false;
        }

        return true;
    }
}