package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.model.RoomType;
import com.runasagrada.hotelapi.service.RoomTypeService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class RoomTypeController {

    private final RoomTypeService service;

    @GetMapping("/room-types")
    public List<RoomType> list() {
        return service.findAll();
    }

    @GetMapping("/room-types/{id}")
    public ResponseEntity<RoomType> get(@PathVariable Integer id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/room-types")
    public ResponseEntity<RoomType> create(@RequestBody RoomTypeRequest body) {
        RoomType rt = new RoomType();
        rt.setName(body.getName());
        rt.setCapacity(body.getCapacity());
        rt.setBasePrice(body.getBasePrice());
        rt.setDescription(body.getDescription());
        rt.setImage(body.getImage());
        RoomType saved = service.create(rt);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/room-types/{id}")
    public ResponseEntity<RoomType> update(@PathVariable Integer id, @RequestBody RoomTypeRequest body) {
        RoomType data = new RoomType();
        data.setName(body.getName());
        data.setCapacity(body.getCapacity());
        data.setBasePrice(body.getBasePrice());
        data.setDescription(body.getDescription());
        data.setImage(body.getImage());
        return ResponseEntity.ok(service.update(id, data));
    }

    @DeleteMapping("/room-types/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Clase interna para request
    @Data
    public static class RoomTypeRequest {
        private String name;
        private Integer capacity;
        private BigDecimal basePrice;
        private String description;
        private String image;
    }
}