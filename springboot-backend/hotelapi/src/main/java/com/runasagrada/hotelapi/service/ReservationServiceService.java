package com.runasagrada.hotelapi.service;

import java.util.List;
import java.util.Optional;

import com.runasagrada.hotelapi.model.ReservationService;

public interface ReservationServiceService {
    Optional<ReservationService> searchById(Long id);

    List<ReservationService> getAll();

    ReservationService save(ReservationService reservationService, Long reservationId, Long serviceId,
            Long scheduleId);

    void delete(Long id);
}
