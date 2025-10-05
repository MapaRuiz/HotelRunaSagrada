package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.RoomLock;
import com.runasagrada.hotelapi.model.RoomLockId;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomLockRepository extends JpaRepository<RoomLock, RoomLockId> {

    boolean existsByRoomIdAndLockDate(Integer roomId, LocalDate date);

    void deleteByReservationReservationId(Integer reservationId);

    @Query("SELECT rl FROM RoomLock rl WHERE rl.roomId = :roomId AND rl.lockDate >= :lockDate ORDER BY rl.lockDate ASC")
    List<RoomLock> findNextLocksForRoom(@Param("roomId") Integer roomId,
            @Param("lockDate") LocalDate lockDate);
}
