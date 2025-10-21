package com.runasagrada.hotelapi.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.runasagrada.hotelapi.model.Reservation;
import com.runasagrada.hotelapi.model.ReservationServiceEntity;
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
    public Optional<ReservationServiceEntity> searchById(Long id) {
        return reservationServiceRepository.findById(id);
    }

    @Override
    public List<ReservationServiceEntity> getAll() {
        return reservationServiceRepository.findAll();
    }

    @Override
    public ReservationServiceEntity save(ReservationServiceEntity reservationService, Long reservationId,
            Long serviceId,
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

        // Before saving, check if there's an existing reservation service for the same
        // reservation + service + schedule. If so, merge quantities into the existing
        // row and avoid creating a duplicate.
        Long rid = targetReservation.getReservationId() != null
                ? targetReservation.getReservationId().longValue()
                : null;

        if (rid != null) {
            List<ReservationServiceEntity> existingList = reservationServiceRepository
                    .findByReservationReservationId(rid);

            ReservationServiceEntity duplicate = null;
            for (ReservationServiceEntity rs : existingList) {
                Long sid = rs.getService() != null ? rs.getService().getId() : null;
                Long targetSid = targetService != null ? targetService.getId() : null;
                Long schedId = rs.getSchedule() != null ? rs.getSchedule().getId() : null;
                Long targetSchedId = targetSchedule != null ? targetSchedule.getId() : null;

                if (sid != null && sid.equals(targetSid)) {
                    if (schedId == null && targetSchedId == null) {
                        duplicate = rs;
                        break;
                    }
                    if (schedId != null && targetSchedId != null && schedId.equals(targetSchedId)) {
                        duplicate = rs;
                        break;
                    }
                }
            }

            if (duplicate != null) {
                // If duplicate is the same row (update in place), just update values below
                if (reservationService.getId() == null || !duplicate.getId().equals(reservationService.getId())) {
                    // Merge: sum quantities and update unit price/status to the incoming values
                    int incomingQty = reservationService.getQty();
                    duplicate.setQty(duplicate.getQty() + incomingQty);
                    if (reservationService.getUnitPrice() != null)
                        duplicate.setUnitPrice(reservationService.getUnitPrice());
                    if (reservationService.getStatus() != null)
                        duplicate.setStatus(reservationService.getStatus());

                    helper.resyncIdentity("reservation_services", "res_service_id");
                    ReservationServiceEntity saved = reservationServiceRepository.save(duplicate);

                    // If we were updating a different existing row, remove it
                    if (reservationService.getId() != null && !duplicate.getId().equals(reservationService.getId())) {
                        try {
                            reservationServiceRepository.deleteById(reservationService.getId());
                        } catch (Exception ex) {
                            // ignore deletion errors, we've already merged
                        }
                    }
                    return saved;
                }
                // else duplicate is the same entity being saved; continue to update below
            }
        }

        helper.resyncIdentity("reservation_services", "res_service_id");
        return reservationServiceRepository.save(reservationService);
    }

    @Override
    public void delete(Long id) {
        helper.resyncIdentity("reservation_services", "res_service_id");
        reservationServiceRepository.deleteById(id);
    }

    private Integer resolveReservationId(ReservationServiceEntity reservationService, Long reservationId) {
        if (reservationId != null) {
            return reservationId.intValue();
        }
        Reservation current = reservationService.getReservation();
        if (current != null && current.getReservationId() != null) {
            return current.getReservationId();
        }
        throw new EntityNotFoundException("Reservation identifier is required");
    }

    private Long resolveServiceId(ReservationServiceEntity reservationService, Long serviceId) {
        if (serviceId != null) {
            return serviceId;
        }
        ServiceOffering current = reservationService.getService();
        if (current != null && current.getId() != null) {
            return current.getId();
        }
        throw new EntityNotFoundException("Service offering identifier is required");
    }

    private Long resolveScheduleId(ReservationServiceEntity reservationService, Long scheduleId) {
        if (scheduleId != null) {
            return scheduleId;
        }
        ServiceSchedule current = reservationService.getSchedule();
        if (current != null) {
            return current.getId();
        }
        return null;
    }

    @Override
    public List<ReservationServiceEntity> findByReservation(Long id) {
        return reservationServiceRepository.findByReservationReservationId(id);
    }

}
