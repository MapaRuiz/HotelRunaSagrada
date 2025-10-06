package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Integer> {
    boolean existsByHotelHotelIdAndNumber(Long hotelId, String number);

    List<Room> findByHotelHotelId(Long hotelId);

    List<Room> findByRoomTypeRoomTypeId(Integer roomTypeId);

    Optional<Room> findByNumber(String number);

    int deleteByRoomTypeRoomTypeId(Integer roomTypeId);

    @Query("select r from Room r where r.hotel.hotelId = :hotelId")
    List<Room> findByHotelId(@Param("hotelId") Long hotelId);

    @Query("select r from Room r where r.hotel.hotelId = :hotelId and r.roomType.roomTypeId = :typeId")
    List<Room> findByHotelIdAndTypeId(@Param("hotelId") Long hotelId,
            @Param("typeId") Long roomTypeId);

}
