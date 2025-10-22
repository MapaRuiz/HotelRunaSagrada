package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface HotelRepository extends JpaRepository<Hotel, Long> {
    boolean existsByName(String name);

    List<Hotel> findByAmenities_AmenityId(Integer amenityId);

    @Query("""
            SELECT h.name AS hotelName,
                   COUNT(DISTINCT a.amenityId) AS cnt
            FROM Hotel h
            LEFT JOIN h.amenities a
            GROUP BY h.hotelId, h.name
            ORDER BY COUNT(DISTINCT a.amenityId) DESC
            """)
    List<Object[]> countAmenitiesByHotel();
}
