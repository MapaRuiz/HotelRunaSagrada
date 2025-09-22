package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = "rooms")
@Entity
@Table(name = "room_types", uniqueConstraints = {
        @UniqueConstraint(name = "uk_roomtype_name", columnNames = "name")
})
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_type_id")
    @EqualsAndHashCode.Include
    private Integer roomTypeId;

    @Column(name = "name", nullable = false, length = 40)
    private String name; // "Estándar Regional", "Deluxe Cultural", etc.

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "description", length = 300)
    private String description;

    @Column(name = "image")
    private String image; // 1 url

    // Borrado en cascada de Rooms cuando se elimina un RoomType
    @OneToMany(mappedBy = "roomType", cascade = CascadeType.REMOVE, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<Room> rooms = new LinkedHashSet<>();
}
