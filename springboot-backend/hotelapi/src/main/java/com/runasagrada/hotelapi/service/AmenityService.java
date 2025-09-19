package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Amenity;

import java.util.List;

public interface AmenityService {
    List<Amenity> list();

    Amenity create(Amenity a);

    Amenity update(Integer id, Amenity partial);

    void delete(Integer id);
}
