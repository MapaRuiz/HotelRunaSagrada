package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.DTOs.LoginRequest;
import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.security.CustomUserDetailService;
import com.runasagrada.hotelapi.security.JWTGenerator;
import com.runasagrada.hotelapi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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

    @Autowired
    private CustomUserDetailService customUserDetails;

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    private JWTGenerator jwtGenerator;

    // "sesiones" en memoria (luego JWT)
    private final Map<String, Integer> sessions = new ConcurrentHashMap<>();

    @PostMapping("/register")
    public User register(@RequestBody User body, @RequestParam(required = false) String role) {
        try {
            User userEntity = customUserDetails.clientDataToUser(body, role);
            return service.register(userEntity, role);
        } catch (IllegalArgumentException e) {
            if ("email in use".equalsIgnoreCase(e.getMessage())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya está registrado");
            }
            throw e;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest body) {
        /*
         * try {
         * User u = service.login(body.getEmail(), body.getPassword());
         * String token = "dev-" + UUID.randomUUID();
         * sessions.put(token, u.getUserId());
         * return Map.of("access_token", token, "user", u);
         * } catch (SecurityException e) {
         * throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
         * "Invalid credentials");
         * } catch (Exception e) {
         * throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
         * "Login failed");
         * }
         */
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(body.getEmail(), body.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = jwtGenerator.generateToken(authentication);
        User user = service.findByEmail(authentication.getName());

        Map<String, Object> payload = Map.of(
                "access_token", token,
                "user", user);

        return ResponseEntity.ok(payload);

    }

    @GetMapping("/me")
    public User me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "no token");
        }
        return service.findByEmail(authentication.getName());
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
}
