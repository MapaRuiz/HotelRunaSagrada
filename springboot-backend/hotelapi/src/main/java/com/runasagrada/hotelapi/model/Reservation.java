package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer reservationId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "reservations" })
    private User user;

    @ManyToOne
    @JoinColumn(name = "hotel_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "reservations" })
    private Hotel hotel;

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "reservations" })
    private Room room;

    private LocalDate checkIn;
    private LocalDate checkOut;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    private Timestamp createdAt = Timestamp.from(Instant.now());

    public enum Status {
        PENDING, CONFIRMED, CHECKIN, FINISHED
    }
}
