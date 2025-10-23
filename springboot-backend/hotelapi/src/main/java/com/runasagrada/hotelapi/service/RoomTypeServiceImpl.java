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
        if (rt.getRooms() != null && !rt.getRooms().isEmpty()) {
            for (Room room : List.copyOf(rt.getRooms())) {
                Integer roomId = room != null ? room.getRoomId() : null;
                if (roomId != null) {
                    roomService.delete(roomId);
                }
            }
            rt.getRooms().clear();
        }
        roomTypeRepository.delete(rt);
    }
}
