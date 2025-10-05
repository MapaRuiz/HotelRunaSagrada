package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.model.Reservation;
import com.runasagrada.hotelapi.model.Room;
import com.runasagrada.hotelapi.model.RoomLock;
import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.service.RoomService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.Hibernate;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService service;

    @GetMapping("/rooms")
    public List<Room> list(
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) Integer roomTypeId) {
        if (hotelId != null)
            return service.findByHotel(hotelId);
        if (roomTypeId != null)
            return service.findByType(roomTypeId);
        return service.findAll();
    }

    @GetMapping("/rooms/{id}")
    public ResponseEntity<Room> get(@PathVariable Integer id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/rooms/numbertest/{roomNum}")
    public ResponseEntity<Room> getRoom(@PathVariable String roomNum) {
        return service.findByNumber(roomNum)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/rooms/number/{roomNum}")
    public ResponseEntity<Map<String, Object>> getTodayReservation(@PathVariable String roomNum) {
        return service.findByNumber(roomNum)
                .flatMap(room -> service.findRoomLockByNumGreaterEqDate(room.getRoomId(), LocalDate.now()))
                .map(RoomLock::getReservation)
                .map(this::initializeReservation)
                .map(reservation -> {
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("reservation", ReservationRes.from(reservation));
                    payload.put("guest", GuestRes.from(reservation.getUser()));
                    return ResponseEntity.ok(payload);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/rooms")
    public ResponseEntity<Room> create(@RequestBody RoomRequest body) {
        Room r = new Room();
        r.setNumber(body.getNumber());
        r.setFloor(body.getFloor());
        r.setResStatus(body.getResStatus());
        r.setCleStatus(body.getCleStatus());
        r.setThemeName(body.getThemeName());
        if (body.getImages() != null)
            r.getImages().addAll(body.getImages());
        Room saved = service.create(r, body.getHotelId(), body.getRoomTypeId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<Room> update(@PathVariable Integer id, @RequestBody RoomRequest body) {
        Room data = new Room();
        data.setNumber(body.getNumber());
        data.setFloor(body.getFloor());
        data.setResStatus(body.getResStatus());
        data.setCleStatus(body.getCleStatus());
        data.setThemeName(body.getThemeName());
        if (body.getImages() != null)
            data.setImages(body.getImages());
        Room saved = service.update(id, data, body.getHotelId(), body.getRoomTypeId());
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Clase interna para request
    @Data
    public static class RoomRequest {
        private Long hotelId;
        private Integer roomTypeId;
        private String number;
        private Integer floor;
        private Room.ReservationStatus resStatus;
        private Room.CleaningStatus cleStatus;
        private String themeName;
        private List<String> images;
    }

    // Ensures the reservation and its key relations are fully initialized before
    // serialization.
    private Reservation initializeReservation(Reservation reservation) {
        if (reservation == null) {
            return null;
        }
        Reservation unproxied = (Reservation) Hibernate.unproxy(reservation);

        if (unproxied.getUser() != null) {
            Hibernate.initialize(unproxied.getUser());
        }

        if (unproxied.getRoom() != null) {
            Hibernate.initialize(unproxied.getRoom());
        }

        return unproxied;
    }

    @Data
    private static class ReservationRes {
        private Integer reservationId;
        private LocalDate checkIn;
        private LocalDate checkOut;
        private String status;
        private Integer roomId;
        private String roomNumber;

        static ReservationRes from(Reservation reservation) {
            ReservationRes dto = new ReservationRes();
            if (reservation == null) {
                return dto;
            }
            dto.setReservationId(reservation.getReservationId());
            dto.setCheckIn(reservation.getCheckIn());
            dto.setCheckOut(reservation.getCheckOut());
            dto.setStatus(reservation.getStatus() != null ? reservation.getStatus().name() : null);
            if (reservation.getRoom() != null) {
                dto.setRoomId(reservation.getRoom().getRoomId());
                dto.setRoomNumber(reservation.getRoom().getNumber());
            }
            return dto;
        }
    }

    @Data
    private static class GuestRes {
        private Integer userId;
        private String fullName;
        private String email;
        private String phone;

        static GuestRes from(User user) {
            if (user == null) {
                return null;
            }
            GuestRes dto = new GuestRes();
            dto.setUserId(user.getUserId());
            dto.setFullName(user.getFullName());
            dto.setEmail(user.getEmail());
            dto.setPhone(user.getPhone());
            return dto;
        }
    }

}
