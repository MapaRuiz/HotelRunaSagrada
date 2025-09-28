package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.RoomLock;
import com.runasagrada.hotelapi.model.RoomLockId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface RoomLockRepository extends JpaRepository<RoomLock, RoomLockId> {
    boolean existsByRoomIdAndLockDate(Integer roomId, LocalDate date);

    void deleteByReservationReservationId(Integer reservationId);

}
