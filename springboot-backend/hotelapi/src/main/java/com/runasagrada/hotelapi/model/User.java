package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer userId;

    @Column(unique = true, length = 120, nullable = false)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 120)
    private String fullName;

    @Column(length = 15)
    private String phone;

    @Column(length = 15)
    private String nationalId;

    // Ruta de imagen / icono seleccionado por el usuario
    @Column(length = 255)
    private String selectedPet = "/images/icons/icono3.png";

    private Instant createdAt = Instant.now();

    private Boolean enabled = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();
}
