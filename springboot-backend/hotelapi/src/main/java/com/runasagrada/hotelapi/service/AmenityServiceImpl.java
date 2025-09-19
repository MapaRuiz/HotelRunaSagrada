package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Amenity;
import com.runasagrada.hotelapi.model.Hotel;
import com.runasagrada.hotelapi.repository.AmenityRepository;
import com.runasagrada.hotelapi.repository.HotelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class AmenityServiceImpl implements AmenityService {

    @Autowired
    private AmenityRepository amenities;

    @Autowired
    private HotelRepository hotels;

    @Override
    @Transactional(readOnly = true)
    public List<Amenity> list() {
        return amenities.findAll(Sort.by(Sort.Direction.ASC, "amenityId"));
    }

    @Override
    public Amenity create(Amenity a) {
        if (a.getName() == null || a.getName().isBlank())
            throw new IllegalArgumentException("Amenity name is required");
        if (amenities.existsByName(a.getName()))
            throw new IllegalArgumentException("Amenity already exists");
        return amenities.save(a);
    }

    @Override
    public Amenity update(Integer id, Amenity partial) {
        Amenity db = amenities.findById(id).orElseThrow(() -> new NoSuchElementException("Amenity not found"));
        if (partial.getName() != null && !partial.getName().isBlank())
            db.setName(partial.getName());
        return amenities.save(db);
    }

    @Override
    public void delete(Integer id) {
        Amenity a = amenities.findById(id).orElseThrow(() -> new NoSuchElementException("Amenity not found"));
        // Desasociar de hoteles para no violar FK
        List<Hotel> withAmenity = hotels.findByAmenities_AmenityId(id);
        for (Hotel h : withAmenity) {
            h.getAmenities().remove(a);
        }
        hotels.saveAll(withAmenity);
        amenities.delete(a);
    }
}
