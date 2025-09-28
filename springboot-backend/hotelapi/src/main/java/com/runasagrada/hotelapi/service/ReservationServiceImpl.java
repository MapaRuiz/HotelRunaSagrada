package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Hotel;
import com.runasagrada.hotelapi.model.Reservation;
import com.runasagrada.hotelapi.model.Room;
import com.runasagrada.hotelapi.model.RoomLock;
import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.repository.HotelRepository;
import com.runasagrada.hotelapi.repository.ReservationRepository;
import com.runasagrada.hotelapi.repository.RoomLockRepository;
import com.runasagrada.hotelapi.repository.RoomRepository;
import com.runasagrada.hotelapi.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepo;
    private final UserRepository userRepo;
    private final HotelRepository hotelRepo;
    private final RoomRepository roomRepo;
    private final RoomLockRepository lockRepo;

    @Override
    public Reservation create(Integer userId, Long hotelId, Integer roomId,
            LocalDate checkIn, LocalDate checkOut, Reservation.Status status) {

        if (userId == null || hotelId == null || roomId == null || checkIn == null || checkOut == null) {
            throw new IllegalArgumentException("userId, hotelId, roomId, checkIn y checkOut son obligatorios");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        Hotel hotel = hotelRepo.findById(hotelId)
                .orElseThrow(() -> new EntityNotFoundException("Hotel not found: " + hotelId));
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("Room not found: " + roomId));

        Reservation res = new Reservation();
        res.setUser(user);
        res.setHotel(hotel);
        res.setRoom(room);
        res.setCheckIn(checkIn);
        res.setCheckOut(checkOut);

        // default status si no vino (alineado con el front que inicia en PENDING)
        res.setStatus(status != null ? status : Reservation.Status.PENDING);

        Reservation saved = reservationRepo.save(res);
        createLocks(saved);
        return saved;
    }

    @Override
    public Reservation update(Integer id,
            Integer userId, Long hotelId, Integer roomId,
            LocalDate checkIn, LocalDate checkOut, Reservation.Status status) {

        Reservation res = reservationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found: " + id));

        // 1) eliminar locks viejos
        lockRepo.deleteByReservationReservationId(id);

        // 2) re-asignar relaciones si llegaron nuevas
        if (userId != null && (res.getUser() == null || !userId.equals(res.getUser().getUserId()))) {
            User user = userRepo.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
            res.setUser(user);
        }
        if (hotelId != null && (res.getHotel() == null || !hotelId.equals(res.getHotel().getHotelId()))) {
            Hotel hotel = hotelRepo.findById(hotelId)
                    .orElseThrow(() -> new EntityNotFoundException("Hotel not found: " + hotelId));
            res.setHotel(hotel);
        }
        if (roomId != null && (res.getRoom() == null || !roomId.equals(res.getRoom().getRoomId()))) {
            Room room = roomRepo.findById(roomId)
                    .orElseThrow(() -> new EntityNotFoundException("Room not found: " + roomId));
            res.setRoom(room);
        }

        // 3) fechas si llegaron
        if (checkIn != null)
            res.setCheckIn(checkIn);
        if (checkOut != null)
            res.setCheckOut(checkOut);

        // 4) status si llegó (permite PENDING ⇄ CONFIRMED)
        if (status != null)
            res.setStatus(status);

        // 5) guardar y recrear locks
        Reservation saved = reservationRepo.save(res);
        createLocks(saved);
        return saved;
    }

    @Override
    public void delete(Integer id) {
        Reservation res = reservationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found: " + id));
        lockRepo.deleteByReservationReservationId(id);
        reservationRepo.delete(res);
    }

    private void createLocks(Reservation reservation) {
        LocalDate d = reservation.getCheckIn();
        LocalDate endExclusive = reservation.getCheckOut(); // check-out exclusivo

        while (!d.isAfter(endExclusive.minusDays(1))) {
            Integer roomId = reservation.getRoom().getRoomId();
            if (lockRepo.existsByRoomIdAndLockDate(roomId, d)) {
                throw new IllegalStateException("Room not available on " + d);
            }
            lockRepo.save(new RoomLock(roomId, d, reservation));
            d = d.plusDays(1);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reservation> findAll() {
        return reservationRepo.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Reservation> findById(Integer id) {
        return reservationRepo.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reservation> findByUser(Integer userId) {
        return reservationRepo.findByUserUserId(userId);
    }
}
