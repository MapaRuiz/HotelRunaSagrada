package com.runasagrada.hotelapi.controller;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.runasagrada.hotelapi.model.Hotel;
import com.runasagrada.hotelapi.service.HotelService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class HotelController {

    @Autowired
    private HotelService service;

    @GetMapping("/hotels")
    public List<Hotel> list() {
        return service.list();
    }

    @GetMapping("/hotels/{id}")
    public Hotel get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping("/hotels")
    public ResponseEntity<Hotel> create(@RequestBody HotelRequest body) {
        Hotel h = new Hotel();
        h.setName(body.getName());
        h.setLatitude(body.getLatitude());
        h.setLongitude(body.getLongitude());
        h.setDescription(body.getDescription());
        // NUEVOS
        h.setCheckInAfter(body.getCheckInAfter());
        h.setCheckOutBefore(body.getCheckOutBefore());
        h.setImage(body.getImage());
        return ResponseEntity.ok(service.create(h, body.getAmenityIds()));
    }

    @PutMapping("/hotels/{id}")
    public ResponseEntity<Hotel> update(@PathVariable Long id, @RequestBody HotelRequest body) {
        Hotel p = new Hotel();
        p.setName(body.getName());
        p.setLatitude(body.getLatitude());
        p.setLongitude(body.getLongitude());
        p.setDescription(body.getDescription());
        // NUEVOS
        p.setCheckInAfter(body.getCheckInAfter());
        p.setCheckOutBefore(body.getCheckOutBefore());
        p.setImage(body.getImage());
        return ResponseEntity.ok(service.update(id, p, body.getAmenityIds()));
    }

    @DeleteMapping("/hotels/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class HotelRequest {
        private String name;
        private String latitude;
        private String longitude;
        private String description;

        // NUEVOS
        private String checkInAfter; // "15:00"
        private String checkOutBefore; // "12:00"
        private String image; // ruta/URL

        // null = no tocar; [] = limpiar; valores = reemplazar
        private List<Integer> amenityIds;
    }
}
