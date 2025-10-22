package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Hotel;

import java.util.List;
import java.util.Map;

public interface HotelService {
    List<Hotel> list();

    Hotel get(Long id);

    Hotel create(Hotel h, List<Integer> amenityIds);

    Hotel update(Long id, Hotel partial, List<Integer> amenityIds);

    void delete(Long id);

    Map<Long, String> getHotelsIdName();

    Map<String, Long> amenitiesCountByHotel();
}
