package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Room;
import com.runasagrada.hotelapi.model.RoomType;
import com.runasagrada.hotelapi.repository.RoomTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomTypeServiceImpl implements RoomTypeService {

    private final RoomTypeRepository roomTypeRepository;
    private final RoomService roomService;

    @Override
    public List<RoomType> findAll() {
        return roomTypeRepository.findAll();
    }

    @Override
    public Optional<RoomType> findById(Integer id) {
        return roomTypeRepository.findById(id);
    }

    @Override
    public RoomType create(RoomType rt) {
        return roomTypeRepository.save(rt);
    }

    @Override
    public RoomType update(Integer id, RoomType data) {
        RoomType rt = roomTypeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("RoomType not found: " + id));
        rt.setName(data.getName());
        rt.setCapacity(data.getCapacity());
        rt.setBasePrice(data.getBasePrice());
        rt.setDescription(data.getDescription());
        rt.setImage(data.getImage());
        return rt; // dirty checking
    }

    @Override
    public void delete(Integer id) {
        RoomType rt = roomTypeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("RoomType not found: " + id));

        // Obtener lista de IDs de rooms antes de cualquier operación
        List<Integer> roomIds = rt.getRooms() != null
                ? rt.getRooms().stream()
                        .filter(room -> room != null && room.getRoomId() != null)
                        .map(Room::getRoomId)
                        .toList()
                : List.of();

        // Eliminar cada room (esto maneja reservations, locks, etc.)
        for (Integer roomId : roomIds) {
            roomService.delete(roomId);
        }

        // Ahora eliminar el room type
        roomTypeRepository.delete(rt);
    }
}
