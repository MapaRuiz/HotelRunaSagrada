package com.runasagrada.hotelapi.DTOs;

import java.time.LocalDate;

import com.runasagrada.hotelapi.model.Reservation;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReservationDTO {
    private Integer reservationId;
    private Integer userId;
    private Long hotelId;
    private Integer roomId;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private Reservation.Status status;

    public static ReservationDTO buildDTO(Reservation r) {
        return new ReservationDTO(r.getReservationId(), r.getUser().getUserId(), r.getHotel().getHotelId(),
                r.getRoom().getRoomId(), r.getCheckIn(), r.getCheckOut(), r.getStatus());
    }
}
