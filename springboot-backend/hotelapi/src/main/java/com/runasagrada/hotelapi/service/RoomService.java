package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Reservation;
import com.runasagrada.hotelapi.model.Room;
import com.runasagrada.hotelapi.model.RoomLock;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RoomService {
    List<Room> findAll();

    List<Room> findByHotel(Long hotelId);

    List<Room> findByType(Integer roomTypeId);

    Optional<Room> findById(Integer id);

    Optional<Room> findByNumber(String number);

    Optional<RoomLock> findRoomLockByNumGreaterEqDate(Integer roomId, LocalDate lockDate);

    Room create(Room room, Long hotelId, Integer roomTypeId);

    Room update(Integer id, Room room, Long hotelId, Integer roomTypeId);

    void delete(Integer id);

    List<Room> listByHotel(Long hotelId);

    List<Room> listByHotelAndType(Long hotelId, Long roomTypeId);

    List<Reservation> getReservations(String roomNum);
}
