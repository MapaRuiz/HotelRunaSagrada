package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.model.Reservation;
import com.runasagrada.hotelapi.model.Payment;
import com.runasagrada.hotelapi.service.PaymentService;
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

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService service;
    private final PaymentService paymentService;
    private final com.runasagrada.hotelapi.service.ReceiptService receiptService;

    @GetMapping
    public List<Reservation> all(@RequestParam(required = false) Integer userId) {
        if (userId != null)
            return service.findByUserOrdered(userId);
        return service.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Reservation> allByUser(@PathVariable Integer userId) {
        return service.findByUserOrdered(userId);
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

    // Proxy endpoints for payments related to a reservation
    @GetMapping("/{id}/payments")
    public List<Payment> paymentsForReservation(@PathVariable Integer id) {
        return paymentService.getByReservationId(id);
    }

    @GetMapping("/{id}/payments/all-paid")
    public Map<String, Object> paymentsAllPaid(@PathVariable Integer id) {
        List<Payment> list = paymentService.getByReservationId(id);
        long paid = list.stream()
                .filter(p -> p.getStatus() != null && p.getStatus().equalsIgnoreCase("PAID"))
                .count();
        boolean allPaid = list.isEmpty() || paid == list.size();
        return Map.of(
                "reservationId", id,
                "total", list.size(),
                "paid", (int) paid,
                "allPaid", allPaid);
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
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Integer userId = asInt(body.get("userId"));
            Long hotelId = asLong(body.get("hotelId"));
            Integer roomId = asInt(body.get("roomId"));
            LocalDate checkIn = asDate(body.get("checkIn"));
            LocalDate checkOut = asDate(body.get("checkOut"));
            Reservation.Status status = asStatus(body.get("status")); // puede venir null

            Reservation created = service.create(userId, hotelId, roomId, checkIn, checkOut, status);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (jakarta.persistence.EntityNotFoundException e) {
            // Usuario, hotel o habitación no encontrados
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Bad Request", "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Bad Request", "message", e.getMessage()));
        }
    }

    @GetMapping("/lumpsum/{id}")
    public ResponseEntity<Double> getLumpSumById(@PathVariable Long id) {
        Double lumpSum = service.findLumpSumById(id);
        if (lumpSum == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(lumpSum);
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

    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<Reservation> updateStatus(@PathVariable Integer id, @PathVariable String status) {
        Reservation updated = service.updateStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        paymentService.deleteByReservationId(id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/receipt")
    public ResponseEntity<Map<String, String>> sendReceipt(
            @PathVariable Integer id,
            @RequestParam(required = false, defaultValue = "true") boolean attachPdf,
            @RequestParam(required = false) String confirmationCode) {
        try {
            receiptService.sendReservationReceipt(id, attachPdf, confirmationCode);
            return ResponseEntity.ok(Map.of("message", "Receipt sent successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to send receipt: " + e.getMessage()));
        }
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
            return service.findByUserOrdered(userId);
        }
        return service.findAll();
    }

    @GetMapping("/today")
    public List<Reservation> getToday() {
        return service.findForToday();
    }

    @GetMapping("/summary/count")
    public double[] count() {
        return service.count();
    }

    @GetMapping("/summary/by-room-type")
    public Map<String, Long> countRoomType() {
        return service.countByRoomType();
    }

    @GetMapping("/summary/count/hotel/{hotelId}")
    public double[] countByHotel(@PathVariable Long hotelId) {
        return service.countByHotel(hotelId);
    }

    @GetMapping("/summary/by-room-type/hotel/{hotelId}")
    public Map<String, Long> countByRoomTypeAndHotel(@PathVariable Long hotelId) {
        return service.countByRoomTypeAndHotel(hotelId);
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
