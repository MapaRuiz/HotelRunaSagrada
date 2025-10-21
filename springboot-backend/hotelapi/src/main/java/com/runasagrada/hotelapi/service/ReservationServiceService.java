package com.runasagrada.hotelapi.service;

import java.util.List;
import java.util.Optional;
import com.runasagrada.hotelapi.model.ReservationServiceEntity;

public interface ReservationServiceService {
    Optional<ReservationServiceEntity> searchById(Long id);

    List<ReservationServiceEntity> getAll();

    ReservationServiceEntity save(ReservationServiceEntity reservationService, Long reservationId, Long serviceId,
            Long scheduleId);

    void delete(Long id);

    List<ReservationServiceEntity> findByReservation(Long id);

}
