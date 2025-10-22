package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.service.UserService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private UserService service;

    // "sesiones" en memoria (luego JWT)
    private final Map<String, Integer> sessions = new ConcurrentHashMap<>();

    @PostMapping("/register")
    public User register(@RequestBody User body, @RequestParam(required = false) String role) {
        return service.register(body, role);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest body) {
        User u = service.login(body.getEmail(), body.getPassword());
        String token = "dev-" + UUID.randomUUID();
        sessions.put(token, u.getUserId());
        return Map.of("access_token", token, "user", u);
    }

    @GetMapping("/me")
    public User me(@RequestHeader(value = "Authorization", required = false) String auth) {
        Integer uid = getUserId(auth);
        return service.me(uid);
    }

    Integer getUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "no token");
        }
        Integer uid = sessions.get(authHeader.substring(7));
        if (uid == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token");
        }
        return uid;
    }

    @Data
    static class LoginRequest {
        String email;
        String password;
    }
}
