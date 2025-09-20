package com.runasagrada.hotelapi.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.runasagrada.hotelapi.model.Hotel;
import com.runasagrada.hotelapi.model.ServiceOffering;
import com.runasagrada.hotelapi.repository.HotelRepository;
import com.runasagrada.hotelapi.repository.ServiceOfferingRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ServiceOfferingServiceImpl implements ServiceOfferingService {

    @Autowired
    private ServiceOfferingRepository serviceOfferingRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Override
    public Optional<ServiceOffering> searchById(Long id) {
        return serviceOfferingRepository.findById(id);
    }

    @Override
    public List<ServiceOffering> getAllServiceOfferings() {
        return serviceOfferingRepository.findAll();
    }

    @Override
    public void save(ServiceOffering serviceOffering, Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new EntityNotFoundException("Hotel not found"));
        serviceOffering.setHotel(hotel);
        serviceOfferingRepository.save(serviceOffering);
    }

    @Override
    public void delete(Long id) {
        serviceOfferingRepository.deleteById(id);
    }

}
