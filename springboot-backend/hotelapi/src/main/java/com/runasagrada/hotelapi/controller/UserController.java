package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.service.UserService;

import lombok.Data;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UserService service;
    @Autowired
    private AuthController auth; // para leer el userId del token (simple)

    @GetMapping("/users/me")
    public User getMe(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Integer uid = auth.getUserId(authHeader);
        return service.me(uid);
    }

    @PutMapping("/users/me")
    public User updateMe(@RequestHeader("Authorization") String authHeader, @RequestBody User partial) {
        Integer uid = auth.getUserId(authHeader);
        // Más adelante: allowEmailChange=false si el rol es OPERATOR
        return service.updateMe(uid, partial, true);
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
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(name = "cascade", defaultValue = "false") boolean cascade) {
        var uid = auth.getUserId(authHeader);
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
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Opcional: aquí solo validamos que el token exista; si quieres, agrega
        // validación de rol ADMIN
        auth.getUserId(authHeader);

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

    @Data
    static class AdminUpdateUserRequest {
        private String email;
        private String password;
        private String fullName;
        private String phone;
        private String nationalId;
        private String selectedPet;
        private Boolean enabled;
        private List<String> roles; // ['ADMIN','OPERATOR','CLIENT']
    }

}
