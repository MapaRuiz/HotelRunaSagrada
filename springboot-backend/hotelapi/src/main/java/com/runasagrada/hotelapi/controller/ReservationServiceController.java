package com.runasagrada.hotelapi.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.runasagrada.hotelapi.model.ReservationService;
import com.runasagrada.hotelapi.service.ReservationServiceService;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.EntityNotFoundException;
import lombok.Data;

@RestController
@RequestMapping("/api/reservservice")
@CrossOrigin(origins = "http://localhost:4200")
public class ReservationServiceController {
    @Autowired
    private ReservationServiceService reservationService;

    @GetMapping
    public List<ReservationService> list() {
        return reservationService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationService> getById(@PathVariable Long id) {
        return reservationService.searchById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/add")
    public ResponseEntity<ReservationService> create(@RequestBody ReservationServiceRequest request) {
        if (!request.hasRequiredIdentifiers() || request.getQty() == null || request.getUnitPrice() == null) {
            return ResponseEntity.badRequest().build();
        }

        ReservationService newReservationService = new ReservationService();
        applyRequest(newReservationService, request);

        try {
            ReservationService stored = reservationService.save(newReservationService, request.getReservationId(),
                    request.getServiceId(), request.getScheduleId());
            return ResponseEntity.status(HttpStatus.CREATED).body(stored);
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<ReservationService> update(@PathVariable Long id,
            @RequestBody ReservationServiceRequest request) {
        return reservationService.searchById(id)
                .map(existing -> buildReServiceUpdateResponse(existing, request))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private ResponseEntity<ReservationService> buildReServiceUpdateResponse(ReservationService existing,
            ReservationServiceRequest request) {
        applyRequest(existing, request);
        try {
            Long reservationId = resolveReservationId(existing, request);
            Long serviceId = resolveServiceId(existing, request);
            if (reservationId == null || serviceId == null) {
                return ResponseEntity.badRequest().build();
            }

            Long scheduleId = resolveScheduleId(existing, request);
            ReservationService updated = reservationService.save(existing, reservationId, serviceId, scheduleId);
            return ResponseEntity.ok(updated);
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            reservationService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (EmptyResultDataAccessException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    private void applyRequest(ReservationService target, ReservationServiceRequest request) {
        if (request.getQty() != null) {
            target.setQty(request.getQty());
        }

        if (request.getUnitPrice() != null) {
            target.setUnitPrice(request.getUnitPrice());
        }

        if (request.getStatus() != null) {
            target.setStatus(request.getStatus());
        }
    }

    private Long resolveReservationId(ReservationService existing, ReservationServiceRequest request) {
        if (request.hasReservationId()) {
            return request.getReservationId();
        }
        if (existing.getReservation() != null && existing.getReservation().getReservationId() != null) {
            return existing.getReservation().getReservationId().longValue();
        }
        return null;
    }

    private Long resolveServiceId(ReservationService existing, ReservationServiceRequest request) {
        if (request.hasServiceId()) {
            return request.getServiceId();
        }
        if (existing.getService() != null && existing.getService().getId() != null) {
            return existing.getService().getId();
        }
        return null;
    }

    private Long resolveScheduleId(ReservationService existing, ReservationServiceRequest request) {
        if (request.hasScheduleId()) {
            return request.getScheduleId();
        }
        if (existing.getSchedule() != null) {
            return existing.getSchedule().getId();
        }
        return null;
    }

    @Data
    public static class ReservationServiceRequest {
        @Schema(name = "reservation_id")
        private Long reservationId;
        @Schema(name = "service_id")
        private Long serviceId;
        @Schema(name = "schedule_id")
        private Long scheduleId;
        private Integer qty;
        @Schema(name = "unit_price")
        private Double unitPrice;
        private ReservationService.Status status;

        boolean hasRequiredIdentifiers() {
            return hasReservationId() && hasServiceId();
        }

        boolean hasReservationId() {
            return reservationId != null;
        }

        boolean hasServiceId() {
            return serviceId != null;
        }

        boolean hasScheduleId() {
            return scheduleId != null;
        }
    }
}
