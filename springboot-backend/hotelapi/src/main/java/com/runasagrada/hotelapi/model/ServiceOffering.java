package com.runasagrada.hotelapi.model;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "service_offerings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceOffering {
    @Id
    @GeneratedValue
    @Column(name = "service_offering_id")
    private Long id;

    @Column(length = 120, nullable = false)
    private String name;

    @Column(length = 255, nullable = false)
    private String category;

    @Column(length = 255, nullable = false)
    private String subcategory;

    @Column(length = 500, nullable = false)
    private String description;

    @Column(nullable = false)
    private double basePrice;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    private List<String> imageUrls;

    @Column(name = "max_participants", nullable = false)
    private int maxParticipants;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    // Relation with other entities
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    @OneToMany(mappedBy = "service", fetch = FetchType.EAGER, orphanRemoval = true)
    @OrderBy("startTime ASC")
    private List<ServiceSchedule> schedules;
}
