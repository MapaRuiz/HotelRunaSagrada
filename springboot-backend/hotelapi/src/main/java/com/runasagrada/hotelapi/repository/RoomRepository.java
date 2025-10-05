package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Integer> {
    boolean existsByHotelHotelIdAndNumber(Long hotelId, String number);

    List<Room> findByHotelHotelId(Long hotelId);

    List<Room> findByRoomTypeRoomTypeId(Integer roomTypeId);

    Optional<Room> findByNumber(String number);

    int deleteByRoomTypeRoomTypeId(Integer roomTypeId); // opcional si quieres borrar “desde rooms”
}
