package com.runasagrada.hotelapi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = { "hotel", "roomType" })
@Entity
@Table(name = "rooms", uniqueConstraints = {
        @UniqueConstraint(name = "uk_room_hotel_number", columnNames = { "hotel_id", "number" })
})
public class Room {

    public enum ReservationStatus {
        AVAILABLE, BOOKED, MAINTENANCE
    }

    public enum CleaningStatus {
        CLEAN, DIRTY
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    @EqualsAndHashCode.Include
    private Integer roomId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id", nullable = false, foreignKey = @ForeignKey(name = "fk_room_hotel"))
    @JsonIgnore
    private Hotel hotel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_type_id", nullable = false, foreignKey = @ForeignKey(name = "fk_room_roomtype"))
    @JsonIgnore
    private RoomType roomType;

    @Column(name = "number", nullable = false, length = 10)
    private String number; // p.ej. "1-101", "2-102"

    @Column(name = "floor", nullable = false)
    private Integer floor;

    @Enumerated(EnumType.STRING)
    @Column(name = "res_status", nullable = false, length = 20)
    private ReservationStatus resStatus = ReservationStatus.AVAILABLE;

    @Enumerated(EnumType.STRING)
    @Column(name = "cle_status", nullable = false, length = 20)
    private CleaningStatus cleStatus = CleaningStatus.CLEAN;

    @Column(name = "theme_name")
    private String themeName;

    // Galería de imágenes similar a Services
    @ElementCollection
    @CollectionTable(name = "room_images", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "image_url", nullable = false, length = 500)
    private List<String> images = new ArrayList<>();

    // Exponer ids planos al JSON (alineado con tu front)
    @JsonProperty("hotel_id")
    public Long getHotelId() {
        return hotel != null ? hotel.getHotelId() : null;
    }

    @JsonProperty("room_type_id")
    public Integer getRoomTypeId() {
        return roomType != null ? roomType.getRoomTypeId() : null;
    }
}
