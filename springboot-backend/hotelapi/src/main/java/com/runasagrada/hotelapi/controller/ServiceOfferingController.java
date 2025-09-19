package com.runasagrada.hotelapi.controller;

import java.time.LocalTime;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.runasagrada.hotelapi.model.ServiceOffering;
import com.runasagrada.hotelapi.model.ServiceSchedule;
import com.runasagrada.hotelapi.service.ServiceOfferingService;
import com.runasagrada.hotelapi.service.ServiceScheduleService;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import lombok.Data;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class ServiceOfferingController {

    @Autowired
    private ServiceOfferingService serviceOfferingService;
    @Autowired
    private ServiceScheduleService serviceScheduleService;

    @GetMapping("/services")
    public List<ServiceOffering> getAllServices() {
        return serviceOfferingService.getAllServiceOfferings();
    }

    @GetMapping("/services/{id}")
    public ResponseEntity<ServiceOffering> getServiceById(@PathVariable("id") Long identifier) {
        return serviceOfferingService.searchById(identifier)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/services/admin")
    public List<ServiceOffering> getAdminServices() {
        return serviceOfferingService.getAllServiceOfferings();
    }

    @GetMapping("/services/available")
    public List<ServiceOffering> getAvailableServices() {
        return serviceOfferingService.getAllServiceOfferings();
    }

    @PostMapping("/services/add")
    public ResponseEntity<ServiceOffering> createService(@RequestBody ServiceOffering serviceOffering) {
        serviceOffering.setId(null);
        serviceOfferingService.save(serviceOffering);
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceOffering);
    }

    @PutMapping("/services/update/{id}")
    public ResponseEntity<ServiceOffering> updateService(@PathVariable("id") Long id,
            @RequestBody ServiceOffering serviceOffering) {
        if (serviceOfferingService.searchById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        serviceOffering.setId(id);
        serviceOfferingService.save(serviceOffering);
        return ResponseEntity.ok(serviceOffering);
    }

    @PostMapping("/services/{serviceId}/schedules/add")
    public ResponseEntity<ServiceSchedule> createSchedule(@PathVariable("serviceId") Long serviceId,
            @RequestBody ScheduleRequest request) {
        return serviceOfferingService.searchById(serviceId)
                .map(service -> buildScheduleCreationResponse(service, request))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    private ResponseEntity<ServiceSchedule> buildScheduleCreationResponse(ServiceOffering service,
            ScheduleRequest request) {
        Set<ServiceSchedule.DayWeek> days = request.getDaysOfWeek();
        LocalTime start = request.getStartTime();
        LocalTime end = request.getEndTime();

        if (start == null || end == null || days == null || days.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        ServiceSchedule schedule = new ServiceSchedule();
        schedule.setService(service);
        schedule.setDaysOfWeek(EnumSet.copyOf(days));
        schedule.setStartTime(start);
        schedule.setEndTime(end);
        boolean active = request.getActive() == null ? true : request.getActive();
        schedule.setActive(active);

        serviceScheduleService.save(schedule);
        return ResponseEntity.status(HttpStatus.CREATED).body(schedule);
    }

    @PutMapping("/services/schedules/update/{scheduleId}")
    public ResponseEntity<ServiceSchedule> updateSchedule(@PathVariable("scheduleId") Long scheduleId,
            @RequestBody ScheduleRequest request) {
        return serviceScheduleService.findById(scheduleId).map(existing -> {
            Set<ServiceSchedule.DayWeek> days = request.getDaysOfWeek();
            LocalTime start = request.getStartTime() != null ? request.getStartTime() : existing.getStartTime();
            LocalTime end = request.getEndTime() != null ? request.getEndTime()
                    : calculateEnd(start, existing.getService().getDurationMinutes());

            ServiceSchedule merged = new ServiceSchedule();
            merged.setId(existing.getId());
            merged.setService(existing.getService());
            merged.setDaysOfWeek((days == null || days.isEmpty()) ? existing.getDaysOfWeek()
                    : EnumSet.copyOf(days));
            merged.setStartTime(start);
            merged.setEndTime(end);
            boolean active = request.getActive() == null ? existing.isActive() : request.getActive();
            merged.setActive(active);

            serviceScheduleService.save(merged);
            return ResponseEntity.ok(merged);
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
    }

    @GetMapping("/services/available/{id}")
    public ResponseEntity<Map<String, Object>> getServiceDetail(@PathVariable("id") Long identifier) {
        return serviceOfferingService.searchById(identifier)
                .map(service -> {
                    List<ServiceSchedule> schedules = serviceScheduleService.findByService(service);
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("service", service);
                    payload.put("schedules", schedules);
                    return ResponseEntity.ok(payload);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/services/gastronomy")
    public Map<String, List<ServiceOffering>> getGastronomyServices() {
        List<ServiceOffering> allServices = serviceOfferingService.getAllServiceOfferings();
        Map<String, List<ServiceOffering>> payload = new HashMap<>();
        payload.put("gastronomy", filter(allServices, s -> "Comida".equals(s.getCategory())));
        payload.put("platosFuertes", filter(allServices,
                item -> "Comida".equals(item.getCategory()) && "Plato Principal".equals(item.getSubcategory())));
        payload.put("postres", filter(allServices,
                item -> "Comida".equals(item.getCategory()) && "Postre".equals(item.getSubcategory())));
        payload.put("bebidas", filter(allServices,
                item -> "Comida".equals(item.getCategory()) && "Bebida".equals(item.getSubcategory())));
        return payload;
    }

    @GetMapping("/services/tours")
    public Map<String, List<ServiceOffering>> getTourServices() {
        List<ServiceOffering> allServices = serviceOfferingService.getAllServiceOfferings();
        Map<String, List<ServiceOffering>> payload = new HashMap<>();
        payload.put("tours", filter(allServices, s -> "Tours".equals(s.getCategory())));
        payload.put("toursCulturales", filter(allServices,
                item -> "Tours".equals(item.getCategory()) && "Cultural".equals(item.getSubcategory())));
        payload.put("toursNaturaleza", filter(allServices,
                item -> "Tours".equals(item.getCategory()) && "Naturaleza".equals(item.getSubcategory())));
        payload.put("otrosTours", filter(allServices,
                item -> "Tours".equals(item.getCategory())
                        && (item.getSubcategory() == null
                                || (!"Cultural".equals(item.getSubcategory())
                                        && !"Naturaleza".equals(item.getSubcategory())))));
        return payload;
    }

    @GetMapping("/services/amenities")
    public Map<String, List<ServiceOffering>> getAmenityServices() {
        List<ServiceOffering> allServices = serviceOfferingService.getAllServiceOfferings();
        Map<String, List<ServiceOffering>> payload = new HashMap<>();
        payload.put("amenities", filter(allServices, s -> "Hotel".equals(s.getCategory())));
        payload.put("bienestar", filter(allServices,
                item -> "Hotel".equals(item.getCategory())
                        && (item.getName().contains("Spa") || item.getName().contains("Gimnasio"))));
        payload.put("hospedaje", filter(allServices,
                item -> "Hotel".equals(item.getCategory())
                        && (item.getName().contains("Suite") || item.getName().contains("Cabañas"))));
        payload.put("servicios", filter(allServices,
                item -> "Hotel".equals(item.getCategory())
                        && !item.getName().contains("Spa")
                        && !item.getName().contains("Gimnasio")
                        && !item.getName().contains("Suite")
                        && !item.getName().contains("Cabañas")));
        return payload;
    }

    private List<ServiceOffering> filter(List<ServiceOffering> source, Predicate<ServiceOffering> predicate) {
        return source.stream().filter(predicate).collect(Collectors.toList());
    }

    private LocalTime calculateEnd(LocalTime startTime, int durationMinutes) {
        int clamped = Math.max(30, Math.min(durationMinutes, 480));
        return startTime.plusMinutes(clamped);
    }

    @Data
    static class ScheduleRequest {
        private Set<ServiceSchedule.DayWeek> daysOfWeek;
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
        private LocalTime startTime;
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
        private LocalTime endTime;
        private Boolean active;
    }
}
