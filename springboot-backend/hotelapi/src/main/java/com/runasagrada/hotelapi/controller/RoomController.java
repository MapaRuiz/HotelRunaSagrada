package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.model.Room;
import com.runasagrada.hotelapi.service.RoomService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rooms")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService service;

    @GetMapping
    public List<Room> list(
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) Integer roomTypeId) {
        if (hotelId != null)
            return service.findByHotel(hotelId);
        if (roomTypeId != null)
            return service.findByType(roomTypeId);
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> get(@PathVariable Integer id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
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

    @PutMapping("/{id}")
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

    @DeleteMapping("/{id}")
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
}