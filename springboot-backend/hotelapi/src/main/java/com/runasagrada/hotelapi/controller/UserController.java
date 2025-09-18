package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.service.UserService;

import lombok.Data;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UserService service;
    @Autowired
    private AuthController auth; // para leer el userId del token (simple)

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

    // BORRARME (requiere Authorization: Bearer ...)
    @DeleteMapping("/users/me")
    public ResponseEntity<Void> deleteMe(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Integer uid = auth.getUserId(authHeader); // lanza SecurityException si no hay/malo
        service.delete(uid); // soft delete o hard, como lo tengas
        return ResponseEntity.noContent().build(); // 204
    }

    // BORRAR POR ID (solo números, evita chocar con 'me')
    @DeleteMapping("/users/{id:\\d+}")
    public ResponseEntity<Void> deleteById(@PathVariable Integer id) {
        service.delete(id);
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

    @Data
    static class AdminUpdateUserRequest {
        private String email;
        private String password;
        private String fullName;
        private String phone;
        private String nationalId;
        private String selectedPet;
        private Boolean enabled;
        private java.util.List<String> roles; // ['ADMIN','OPERATOR','CLIENT']
    }

}
