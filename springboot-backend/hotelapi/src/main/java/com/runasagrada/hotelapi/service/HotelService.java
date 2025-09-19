package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Hotel;

import java.util.List;

public interface HotelService {
    List<Hotel> list();

    Hotel get(Integer id);

    Hotel create(Hotel h, List<Integer> amenityIds);

    Hotel update(Integer id, Hotel partial, List<Integer> amenityIds);

    void delete(Integer id);
}
