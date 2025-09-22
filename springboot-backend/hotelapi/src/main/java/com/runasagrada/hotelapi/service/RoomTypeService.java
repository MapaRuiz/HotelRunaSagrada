package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.RoomType;

import java.util.List;
import java.util.Optional;

public interface RoomTypeService {
    List<RoomType> findAll();

    Optional<RoomType> findById(Integer id);

    RoomType create(RoomType rt);

    RoomType update(Integer id, RoomType rt);

    void delete(Integer id); // debe borrar sus Rooms
}
