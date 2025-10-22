package com.runasagrada.hotelapi.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.runasagrada.hotelapi.model.Reservation;
import com.runasagrada.hotelapi.model.ReservationService;
import com.runasagrada.hotelapi.model.ServiceOffering;
import com.runasagrada.hotelapi.model.ServiceSchedule;
import com.runasagrada.hotelapi.repository.ReservationRepository;
import com.runasagrada.hotelapi.repository.ReservationServiceRepository;
import com.runasagrada.hotelapi.repository.ServiceOfferingRepository;
import com.runasagrada.hotelapi.repository.ServiceScheduleRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ReservationServiceServiceImpl implements ReservationServiceService {

    @Autowired
    private ReservationServiceRepository reservationServiceRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private ServiceOfferingRepository serviceOfferingRepository;

    @Autowired
    private ServiceScheduleRepository serviceScheduleRepository;

    @Autowired
    private ServiceHelper helper;

    @Override
    public Optional<ReservationService> searchById(Long id) {
        return reservationServiceRepository.findById(id);
    }

    @Override
    public List<ReservationService> getAll() {
        return reservationServiceRepository.findAll();
    }

    @Override
    public ReservationService save(ReservationService reservationService, Long reservationId, Long serviceId,
            Long scheduleId) {
        Reservation targetReservation = reservationRepository
                .findById(resolveReservationId(reservationService, reservationId))
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found"));

        Long targetServiceId = resolveServiceId(reservationService, serviceId);
        ServiceOffering targetService = serviceOfferingRepository.findById(targetServiceId)
                .orElseThrow(() -> new EntityNotFoundException("Service offering not found"));

        ServiceSchedule targetSchedule = null;
        Long finalScheduleId = resolveScheduleId(reservationService, scheduleId);
        if (finalScheduleId != null) {
            targetSchedule = serviceScheduleRepository.findById(finalScheduleId)
                    .orElseThrow(() -> new EntityNotFoundException("Service schedule not found"));
        }

        reservationService.setReservation(targetReservation);
        reservationService.setService(targetService);
        reservationService.setSchedule(targetSchedule);

        helper.resyncIdentity("reservation_services", "res_service_id");
        return reservationServiceRepository.save(reservationService);
    }

    @Override
    public void delete(Long id) {
        helper.resyncIdentity("reservation_services", "res_service_id");
        reservationServiceRepository.deleteById(id);
    }

    private Integer resolveReservationId(ReservationService reservationService, Long reservationId) {
        if (reservationId != null) {
            return reservationId.intValue();
        }
        Reservation current = reservationService.getReservation();
        if (current != null && current.getReservationId() != null) {
            return current.getReservationId();
        }
        throw new EntityNotFoundException("Reservation identifier is required");
    }

    private Long resolveServiceId(ReservationService reservationService, Long serviceId) {
        if (serviceId != null) {
            return serviceId;
        }
        ServiceOffering current = reservationService.getService();
        if (current != null && current.getId() != null) {
            return current.getId();
        }
        throw new EntityNotFoundException("Service offering identifier is required");
    }

    private Long resolveScheduleId(ReservationService reservationService, Long scheduleId) {
        if (scheduleId != null) {
            return scheduleId;
        }
        ServiceSchedule current = reservationService.getSchedule();
        if (current != null) {
            return current.getId();
        }
        return null;
    }

}
