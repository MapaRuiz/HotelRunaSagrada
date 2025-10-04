package com.runasagrada.hotelapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.runasagrada.hotelapi.model.ReservationService;

@Repository
public interface ReservationServiceRepository extends JpaRepository<ReservationService, Long> {
}
