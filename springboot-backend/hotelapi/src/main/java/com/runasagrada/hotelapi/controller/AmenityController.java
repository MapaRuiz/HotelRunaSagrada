package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.model.Amenity;
import com.runasagrada.hotelapi.service.AmenityService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class AmenityController {

    @Autowired
    private AmenityService service;

    @GetMapping("/amenities")
    public List<Amenity> list() {
        return service.list();
    }

    @PostMapping("/amenities")
    public ResponseEntity<Amenity> create(@RequestBody AmenityRequest body) {
        Amenity a = new Amenity(null, body.getName());
        return ResponseEntity.ok(service.create(a));
    }

    @PutMapping("/amenities/{id}")
    public ResponseEntity<Amenity> update(@PathVariable Integer id, @RequestBody AmenityRequest body) {
        Amenity p = new Amenity();
        p.setName(body.getName());
        return ResponseEntity.ok(service.update(id, p));
    }

    @DeleteMapping("/amenities/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class AmenityRequest {
        private String name;
    }
}
