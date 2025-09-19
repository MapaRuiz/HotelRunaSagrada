package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HotelRepository extends JpaRepository<Hotel, Integer> {
    boolean existsByName(String name);

    List<Hotel> findByAmenities_AmenityId(Integer amenityId);
}
