package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.model.Reservation;
import com.runasagrada.hotelapi.service.ReservationService;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService service;

    @GetMapping
    public List<Reservation> all(@RequestParam(required = false) Integer userId) {
        if (userId != null)
            return service.findByUser(userId);
        return service.findAll();
    }

    // Get all reservation by hotel
    @GetMapping("/hotel/{hotelId}")
    public List<ReservationDTO> allByHotel(@PathVariable Long hotelId) {
        List<Reservation> all = service.findByHotelId(hotelId);
        List<ReservationDTO> response = new ArrayList<>();
        for (Reservation res : all) {
            response.add(ReservationDTO.buildDTO(res));
        }
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reservation> one(@PathVariable Integer id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ---------- Helpers para leer el payload a pelo ----------
    private Integer asInt(Object o) {
        return (o == null) ? null : (o instanceof Number n ? n.intValue() : Integer.valueOf(o.toString()));
    }

    private Long asLong(Object o) {
        return (o == null) ? null : (o instanceof Number n ? n.longValue() : Long.valueOf(o.toString()));
    }

    private LocalDate asDate(Object o) {
        return (o == null) ? null : LocalDate.parse(o.toString());
    }

    private Reservation.Status asStatus(Object o) {
        return (o == null) ? null : Reservation.Status.valueOf(o.toString());
    }

    @PostMapping
    public ResponseEntity<Reservation> create(@RequestBody Map<String, Object> body) {
        Integer userId = asInt(body.get("userId"));
        Long hotelId = asLong(body.get("hotelId"));
        Integer roomId = asInt(body.get("roomId"));
        LocalDate checkIn = asDate(body.get("checkIn"));
        LocalDate checkOut = asDate(body.get("checkOut"));
        Reservation.Status status = asStatus(body.get("status")); // puede venir null

        Reservation created = service.create(userId, hotelId, roomId, checkIn, checkOut, status);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Reservation> update(@PathVariable Integer id,
            @RequestBody Map<String, Object> body) {
        Integer userId = asInt(body.get("userId")); // opcional
        Long hotelId = asLong(body.get("hotelId")); // opcional
        Integer roomId = asInt(body.get("roomId")); // opcional
        LocalDate checkIn = asDate(body.get("checkIn")); // opcional
        LocalDate checkOut = asDate(body.get("checkOut")); // opcional
        Reservation.Status status = asStatus(body.get("status")); // opcional

        Reservation updated = service.update(id, userId, hotelId, roomId, checkIn, checkOut, status);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<Reservation> activate(@PathVariable Integer id, @RequestParam String status) {
        Reservation updated = service.activate(id, status);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<Reservation> deactivate(@PathVariable Integer id) {
        Reservation updated = service.deactivate(id);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/reservations/current?userId=...
    @GetMapping("/current")
    public List<Reservation> getCurrent(@RequestParam(required = false) Integer userId) {
        if (userId != null) {
            return service.findCurrentByUser(userId);
        }
        // si no se pasa userId devolvemos todas las actuales
        LocalDate today = LocalDate.now();
        return service.findAll().stream()
                .filter(r -> r.getCheckOut() != null && !r.getCheckOut().isBefore(today))
                .collect(Collectors.toList());
    }

    // GET /api/reservations/history?userId=...
    @GetMapping("/history")
    public List<Reservation> getHistory(@RequestParam(required = false) Integer userId) {
        if (userId != null) {
            return service.findByUser(userId);
        }
        return service.findAll();
    }

    @GetMapping("/today")
    public List<Reservation> getToday() {
        return service.findForToday();
    }

    @Data
    @AllArgsConstructor
    public static class ReservationDTO {
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

}
