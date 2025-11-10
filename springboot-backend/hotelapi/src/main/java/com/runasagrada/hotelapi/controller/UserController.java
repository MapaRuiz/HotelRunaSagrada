package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.DTOs.AdminUpdateUserRequest;
import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UserService service;

    @GetMapping("/users/me")
    public User getMe(Authentication authentication) {
        return service.me(resolveUserId(authentication));
    }

    @PutMapping("/users/me")
    public User updateMe(Authentication authentication, @RequestBody User partial) {
        // Más adelante: allowEmailChange=false si el rol es OPERATOR
        return service.updateMe(resolveUserId(authentication), partial, true);
    }

    // Admin:
    @GetMapping("/users")
    public List<User> all() {
        return service.findAll();
    }

    @GetMapping("/user/id/{userId}")
    public User getMethodName(@PathVariable Integer userId) {
        return service.findById(userId);
    }

    @DeleteMapping("/users/{id:\\d+}")
    public ResponseEntity<?> deleteById(
            @PathVariable Integer id,
            @RequestParam(name = "cascade", defaultValue = "false") boolean cascade) {
        if (cascade) {
            service.deleteCascade(id);
        } else {
            service.delete(id); // puede lanzar IllegalStateException si hay reservas (opción mixta)
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/me")
    public ResponseEntity<?> deleteMe(
            Authentication authentication,
            @RequestParam(name = "cascade", defaultValue = "false") boolean cascade) {
        var uid = resolveUserId(authentication);
        if (cascade) {
            service.deleteCascade(uid);
        } else {
            service.delete(uid);
        }
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{id:\\d+}")
    public ResponseEntity<User> updateById(
            @PathVariable Integer id,
            @RequestBody AdminUpdateUserRequest body,
            Authentication authentication) {

        // Opcional: aquí solo validamos que el token exista; si quieres, agrega
        // validación de rol ADMIN
        ensureAuthenticated(authentication);

        User partial = new User();
        partial.setEmail(body.getEmail());
        partial.setPassword(body.getPassword());
        partial.setFullName(body.getFullName());
        partial.setPhone(body.getPhone());
        partial.setNationalId(body.getNationalId());
        partial.setSelectedPet(body.getSelectedPet());
        partial.setEnabled(body.getEnabled());

        User updated = service.updateByAdmin(id, partial, body.getRoles());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/users/{email}")
    public boolean existsByEmail(@PathVariable String email) {
        return service.existsByEmail(email);
    }

    @GetMapping("/users/nationalId/{nationalId}")
    public boolean existsByNationalId(@PathVariable String nationalId) {
        return service.existsByNationalId(nationalId);
    }

    @GetMapping("/users/summary")
    public double[] summary() {
        return service.usersSummary();
    }

    private Integer resolveUserId(Authentication authentication) {
        return resolveCurrentUser(authentication).getUserId();
    }

    private User resolveCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "no token");
        }
        return service.findByEmail(authentication.getName());
    }

    private void ensureAuthenticated(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "no token");
        }
    }
}
