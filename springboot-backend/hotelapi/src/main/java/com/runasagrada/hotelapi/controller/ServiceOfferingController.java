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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.runasagrada.hotelapi.model.Hotel;
import com.runasagrada.hotelapi.model.ServiceOffering;
import com.runasagrada.hotelapi.model.ServiceSchedule;
import com.runasagrada.hotelapi.service.ServiceOfferingService;
import com.runasagrada.hotelapi.service.ServiceScheduleService;

import io.swagger.v3.oas.annotations.media.Schema;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class ServiceOfferingController {

    @Autowired
    private ServiceOfferingService serviceOfferingService;
    @Autowired
    private ServiceScheduleService serviceScheduleService;

    @GetMapping("/servoffering")
    public List<ServiceOffering> getAllServices() {
        return serviceOfferingService.getAllServiceOfferings();
    }

    @GetMapping("/servoffering/{id}")
    public ResponseEntity<ServiceOffering> getServiceById(@PathVariable("id") Long identifier) {
        return serviceOfferingService.searchById(identifier)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/servoffering/add")
    public ResponseEntity<ServiceOffering> createService(@RequestBody ServiceOfferingRequest request) {
        if (request.getHotelId() == null) {
            return ResponseEntity.badRequest().<ServiceOffering>build();
        }
        ServiceOffering newService = new ServiceOffering();
        applyRequestToServiceOffering(newService, request);
        serviceOfferingService.save(newService, request.getHotelId());
        return ResponseEntity.status(HttpStatus.CREATED).body(newService);
    }

    @PutMapping("/servoffering/update/{id}")
    public ResponseEntity<ServiceOffering> updateService(@PathVariable("id") Long id,
            @RequestBody ServiceOfferingRequest request) {
        return serviceOfferingService.searchById(id)
                .map(existing -> buildServiceUpdateResponse(existing, request, id))
                .orElseGet(() -> ResponseEntity.notFound().<ServiceOffering>build());
    }

    private ResponseEntity<ServiceOffering> buildServiceUpdateResponse(ServiceOffering existing,
            ServiceOfferingRequest request, Long id) {
        applyRequestToServiceOffering(existing, request);
        existing.setId(id);

        Long targetHotelId = request.getHotelId();
        if (targetHotelId == null) {
            Hotel currentHotel = existing.getHotel();
            if (currentHotel == null || currentHotel.getHotelId() == null) {
                return ResponseEntity.badRequest().<ServiceOffering>build();
            }
            targetHotelId = currentHotel.getHotelId().longValue();
        }

        serviceOfferingService.save(existing, targetHotelId);
        return ResponseEntity.ok(existing);
    }

    private void applyRequestToServiceOffering(ServiceOffering target, ServiceOfferingRequest request) {
        target.setName(request.getName());
        target.setCategory(request.getCategory());
        target.setSubcategory(request.getSubcategory());
        target.setDescription(request.getDescription());
        target.setBasePrice(request.getBasePrice());
        target.setDurationMinutes(request.getDurationMinutes());
        target.setImageUrls(request.getImageUrls());
        target.setMaxParticipants(request.getMaxParticipants());
        target.setLatitude(request.getLatitude());
        target.setLongitude(request.getLongitude());
    }

    @PostMapping("/servoffering/{serviceId}/schedules/add")
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

    @PutMapping("/servoffering/schedules/update/{scheduleId}")
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

    @GetMapping("/servoffering/available/{id}")
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

    @GetMapping("/servoffering/gastronomy")
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

    @GetMapping("/servoffering/tours")
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

    @GetMapping("/servoffering/amenities")
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

    @DeleteMapping("/servoffering/delete/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable("id") Long identifier) {
        return serviceOfferingService.searchById(identifier)
                .map(this::buildDeleteResponse)
                .orElseGet(() -> ResponseEntity.notFound().<Void>build());
    }

    private ResponseEntity<Void> buildDeleteResponse(ServiceOffering existing) {
        serviceOfferingService.delete(existing.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/servoffering/schedule/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable("id") Long identifier) {
        return serviceScheduleService.findById(identifier)
                .map(this::buildDeleteResponseSchedule)
                .orElseGet(() -> ResponseEntity.notFound().<Void>build());
    }

    private ResponseEntity<Void> buildDeleteResponseSchedule(ServiceSchedule existing) {
        serviceScheduleService.delete(existing.getId());
        return ResponseEntity.noContent().build();
    }

    private List<ServiceOffering> filter(List<ServiceOffering> source, Predicate<ServiceOffering> predicate) {
        return source.stream().filter(predicate).collect(Collectors.toList());
    }

    private LocalTime calculateEnd(LocalTime startTime, int durationMinutes) {
        int clamped = Math.max(30, Math.min(durationMinutes, 480));
        return startTime.plusMinutes(clamped);
    }

    @GetMapping("/servoffering/hotels/{hotelId}/services")
    public List<ServiceOffering> servicesByHotel(@PathVariable Long hotelId) {
        return serviceOfferingService.findByHotel(hotelId);
    }

    /** Lista los horarios de un servicio */
    @GetMapping("/servoffering/services/{serviceId}/schedules")
    public List<ServiceSchedule> schedulesByService(@PathVariable Long serviceId) {
        return serviceScheduleService.findByService(serviceId);
    }

    @Data
    static class ScheduleRequest {
        @Schema(name = "days_of_week")
        private Set<ServiceSchedule.DayWeek> daysOfWeek;

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
        @Schema(name = "start_time", type = "string", pattern = "^\\d{2}:\\d{2}$", example = "08:00")
        private LocalTime startTime;

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
        @Schema(name = "end_time", type = "string", pattern = "^\\d{2}:\\d{2}$", example = "09:30")
        private LocalTime endTime;

        private Boolean active;
    }

    @Data
    static class ServiceOfferingRequest {
        private String name;
        private String category;
        private String subcategory;
        private String description;
        private double basePrice;
        private int durationMinutes;
        private List<String> imageUrls;
        private int maxParticipants;
        private double latitude;
        private double longitude;
        @JsonProperty("hotel_id")
        private Long hotelId;
    }
}
