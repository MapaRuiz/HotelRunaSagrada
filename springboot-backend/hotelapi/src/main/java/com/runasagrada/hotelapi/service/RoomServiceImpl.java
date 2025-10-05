package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Hotel;
import com.runasagrada.hotelapi.model.Room;
import com.runasagrada.hotelapi.model.RoomLock;
import com.runasagrada.hotelapi.model.RoomType;
import com.runasagrada.hotelapi.repository.HotelRepository;
import com.runasagrada.hotelapi.repository.RoomLockRepository;
import com.runasagrada.hotelapi.repository.RoomRepository;
import com.runasagrada.hotelapi.repository.RoomTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomLockRepository roomLockRepository;

    @Override
    public List<Room> findAll() {
        return roomRepository.findAll();
    }

    @Override
    public List<Room> findByHotel(Long hotelId) {
        return roomRepository.findByHotelHotelId(hotelId);
    }

    @Override
    public List<Room> findByType(Integer roomTypeId) {
        return roomRepository.findByRoomTypeRoomTypeId(roomTypeId);
    }

    @Override
    public java.util.Optional<Room> findById(Integer id) {
        return roomRepository.findById(id);
    }

    @Override
    public Optional<Room> findByNumber(String number) {
        return roomRepository.findByNumber(number);
    }

    @Override
    public Optional<RoomLock> findRoomLockByNumGreaterEqDate(Integer roomId, LocalDate lockDate) {
        return roomLockRepository.findNextLocksForRoom(roomId, lockDate).stream().findFirst();
    }

    @Override
    public Room create(Room room, Long hotelId, Integer roomTypeId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new EntityNotFoundException("Hotel not found: " + hotelId));
        RoomType type = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new EntityNotFoundException("RoomType not found: " + roomTypeId));

        // unicidad (hotel, number)
        if (roomRepository.existsByHotelHotelIdAndNumber(hotelId, room.getNumber())) {
            throw new IllegalArgumentException("Room number already exists in this hotel: " + room.getNumber());
        }

        room.setHotel(hotel);
        room.setRoomType(type);
        if (room.getResStatus() == null)
            room.setResStatus(Room.ReservationStatus.AVAILABLE);
        if (room.getCleStatus() == null)
            room.setCleStatus(Room.CleaningStatus.CLEAN);
        return roomRepository.save(room);
    }

    @Override
    public Room update(Integer id, Room data, Long hotelId, Integer roomTypeId) {
        Room r = roomRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Room not found: " + id));

        // Si cambian hotel o number, volver a validar unicidad
        if (hotelId != null && (r.getHotel() == null || !hotelId.equals(r.getHotel().getHotelId()))) {
            Hotel h = hotelRepository.findById(hotelId)
                    .orElseThrow(() -> new EntityNotFoundException("Hotel not found: " + hotelId));
            r.setHotel(h);
        }
        if (roomTypeId != null && (r.getRoomType() == null || !roomTypeId.equals(r.getRoomType().getRoomTypeId()))) {
            RoomType t = roomTypeRepository.findById(roomTypeId)
                    .orElseThrow(() -> new EntityNotFoundException("RoomType not found: " + roomTypeId));
            r.setRoomType(t);
        }

        if (data.getNumber() != null) {
            boolean sameNumber = data.getNumber().equals(r.getNumber());
            if (!sameNumber
                    && roomRepository.existsByHotelHotelIdAndNumber(r.getHotel().getHotelId(), data.getNumber())) {
                throw new IllegalArgumentException("Room number already exists in this hotel: " + data.getNumber());
            }
            r.setNumber(data.getNumber());
        }

        if (data.getFloor() != null)
            r.setFloor(data.getFloor());
        if (data.getThemeName() != null)
            r.setThemeName(data.getThemeName());
        if (data.getResStatus() != null)
            r.setResStatus(data.getResStatus());
        if (data.getCleStatus() != null)
            r.setCleStatus(data.getCleStatus());
        if (data.getImages() != null) {
            r.getImages().clear();
            r.getImages().addAll(data.getImages());
        }
        return r; // dirty checking
    }

    @Override
    public void delete(Integer id) {
        roomRepository.deleteById(id);
    }
}
