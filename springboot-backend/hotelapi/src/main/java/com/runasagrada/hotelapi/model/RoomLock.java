package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(RoomLockId.class)
public class RoomLock {

    @Id
    private Integer roomId;

    @Id
    private LocalDate lockDate;

    @ManyToOne
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;
}
