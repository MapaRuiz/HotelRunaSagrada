package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomTypeRepository extends JpaRepository<RoomType, Integer> {
    boolean existsByNameIgnoreCase(String name);

    Optional<RoomType> findByNameIgnoreCase(String name);
}
