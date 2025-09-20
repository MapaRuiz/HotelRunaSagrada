package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "hotels")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Hotel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hotel_id")
    private Long hotelId;

    @Column(name = "name", length = 120, nullable = false)
    private String name;

    @Column(name = "latitude", length = 255)
    private String latitude;

    @Column(name = "longitude", length = 255)
    private String longitude;

    @Column(name = "description", length = 500)
    private String description;

    // NUEVOS: políticas básicas e imagen
    @Column(name = "check_in_after", length = 10) // ej. "15:00"
    private String checkInAfter;

    @Column(name = "check_out_before", length = 10) // ej. "12:00"
    private String checkOutBefore;

    @Column(name = "image", length = 255) // ya tienes la ruta en BD
    private String image;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "hotel_amenities", joinColumns = @JoinColumn(name = "hotel_id"), inverseJoinColumns = @JoinColumn(name = "amenity_id"))
    private Set<Amenity> amenities = new HashSet<>();
}
