package com.runasagrada.hotelapi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.runasagrada.hotelapi.model.ReservationServiceEntity;

@Repository
public interface ReservationServiceRepository extends JpaRepository<ReservationServiceEntity, Long> {

    List<ReservationServiceEntity> findByReservationReservationId(Long id);
}
