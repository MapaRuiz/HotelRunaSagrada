package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "amenities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Amenity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "amenity_id")
    private Integer amenityId;

    @Column(name = "name", length = 60, nullable = false, unique = true)
    private String name;

    @Column(name = "image", length = 255)
    private String image;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 10, nullable = false)
    private AmenityType type;
}
