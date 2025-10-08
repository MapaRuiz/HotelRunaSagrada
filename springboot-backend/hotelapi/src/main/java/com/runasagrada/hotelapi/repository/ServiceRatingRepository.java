package com.runasagrada.hotelapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.runasagrada.hotelapi.model.ServiceRating;

@Repository
public interface ServiceRatingRepository extends JpaRepository<ServiceRating, Long> {
}
