package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer roleId;

    @Column(unique = true, length = 20, nullable = false)
    private String name; // ADMIN | OPERATOR | CLIENT
}
