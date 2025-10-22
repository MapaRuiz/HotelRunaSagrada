package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.sql.Timestamp;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    List<Reservation> findByUserUserId(Integer userId);

    List<Reservation> findByHotelHotelId(Long hotelId);

    boolean existsByUserUserId(Integer userId);

    long countByStatusAndCreatedAtBetween(Reservation.Status status, Timestamp start, Timestamp end);
}
