package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Reservation;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Map;

public interface ReservationService {
        List<Reservation> findAll();

        List<Reservation> findByHotelId(Long hotelId);

        Optional<Reservation> findById(Integer id);

        List<Reservation> findByUser(Integer userId);

        // Crear con status opcional (si es null, se usa default)
        Reservation create(Integer userId, Long hotelId, Integer roomId,
                        LocalDate checkIn, LocalDate checkOut, Reservation.Status status);

        // Update con status opcional (si es null, no se toca)
        Reservation update(Integer id,
                        Integer userId, Long hotelId, Integer roomId,
                        LocalDate checkIn, LocalDate checkOut, Reservation.Status status);

        void delete(Integer id);

        List<Reservation> findCurrentByUser(Integer userId);

        List<Reservation> findHistoryByUser(Integer userId);

        List<Reservation> findForToday();

        Reservation updateStatus(Integer id, String status);

        double[] count();

        Map<String, Long> countByRoomType();
}
