package com.runasagrada.hotelapi.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.runasagrada.hotelapi.model.ServiceOffering;
import com.runasagrada.hotelapi.model.ServiceSchedule;
import com.runasagrada.hotelapi.service.ServiceOfferingService;
import com.runasagrada.hotelapi.service.ServiceScheduleService;

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
}
