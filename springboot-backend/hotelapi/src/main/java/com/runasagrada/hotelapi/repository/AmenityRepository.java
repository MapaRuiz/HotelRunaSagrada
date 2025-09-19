package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AmenityRepository extends JpaRepository<Amenity, Integer> {
    boolean existsByName(String name);

    Optional<Amenity> findByName(String name);
}
