package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Room;

import java.util.List;
import java.util.Optional;

public interface RoomService {
    List<Room> findAll();

    List<Room> findByHotel(Long hotelId);

    List<Room> findByType(Integer roomTypeId);

    Optional<Room> findById(Integer id);

    Room create(Room room, Long hotelId, Integer roomTypeId);

    Room update(Integer id, Room room, Long hotelId, Integer roomTypeId);

    void delete(Integer id);
}
