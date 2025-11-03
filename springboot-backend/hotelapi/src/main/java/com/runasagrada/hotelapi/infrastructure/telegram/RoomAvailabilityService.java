package com.runasagrada.hotelapi.infrastructure.telegram;

import com.runasagrada.hotelapi.model.Room;
import com.runasagrada.hotelapi.repository.RoomLockRepository;
import com.runasagrada.hotelapi.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

/**
 * Service class responsible for room availability checks.
 * Encapsulates business logic related to room availability.
 */
@Component
@RequiredArgsConstructor
public class RoomAvailabilityService {

    private final RoomService roomService;
    private final RoomLockRepository roomLockRepository;

    /**
     * Checks availability of all rooms between given dates.
     * Returns a map of room type names to available count.
     */
    @Transactional(readOnly = true)
    public Map<String, Integer> checkAvailability(LocalDate checkIn, LocalDate checkOut) {
        List<Room> allRooms = roomService.findAll();
        Map<String, List<Room>> roomsByType = groupRoomsByType(allRooms);

        return calculateAvailabilityByType(roomsByType, checkIn, checkOut);
    }

    /**
     * Groups rooms by their type name safely within transaction.
     */
    private Map<String, List<Room>> groupRoomsByType(List<Room> rooms) {
        Map<String, List<Room>> roomsByType = new HashMap<>();

        for (Room room : rooms) {
            if (room.getRoomType() != null) {
                String typeName = room.getRoomType().getName();
                roomsByType.computeIfAbsent(typeName, k -> new ArrayList<>()).add(room);
            }
        }

        return roomsByType;
    }

    /**
     * Calculates available room count per type for given date range.
     */
    private Map<String, Integer> calculateAvailabilityByType(Map<String, List<Room>> roomsByType,
            LocalDate checkIn,
            LocalDate checkOut) {
        Map<String, Integer> availability = new HashMap<>();

        roomsByType.forEach((typeName, rooms) -> {
            int availableCount = (int) rooms.stream()
                    .filter(room -> isRoomAvailable(room.getRoomId(), checkIn, checkOut))
                    .count();

            if (availableCount > 0) {
                availability.put(typeName, availableCount);
            }
        });

        return availability;
    }

    /**
     * Checks if a specific room is available for the entire date range.
     */
    public boolean isRoomAvailable(Integer roomId, LocalDate checkIn, LocalDate checkOut) {
        LocalDate current = checkIn;

        // Check-out is exclusive: check until checkOut - 1
        while (!current.isAfter(checkOut.minusDays(1))) {
            if (roomLockRepository.existsByRoomIdAndLockDate(roomId, current)) {
                return false;
            }
            current = current.plusDays(1);
        }

        return true;
    }
}
