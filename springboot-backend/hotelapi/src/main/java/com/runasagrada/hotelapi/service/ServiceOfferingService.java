package com.runasagrada.hotelapi.service;

import java.util.List;
import java.util.Optional;

import com.runasagrada.hotelapi.model.ServiceOffering;

public interface ServiceOfferingService {
    public Optional<ServiceOffering> searchById(Long id);

    public List<ServiceOffering> getAllServiceOfferings();

    public void save(ServiceOffering serviceOffering);

    public void delete(Long id);
}
