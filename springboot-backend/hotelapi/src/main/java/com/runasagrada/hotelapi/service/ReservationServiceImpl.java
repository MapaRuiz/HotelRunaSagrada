package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Hotel;
import com.runasagrada.hotelapi.model.Reservation;
import com.runasagrada.hotelapi.model.Room;
import com.runasagrada.hotelapi.model.RoomLock;
import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.repository.HotelRepository;
import com.runasagrada.hotelapi.repository.ReservationRepository;
import com.runasagrada.hotelapi.model.ReservationServiceEntity;
import com.runasagrada.hotelapi.repository.ReservationServiceRepository;
import com.runasagrada.hotelapi.repository.RoomLockRepository;
import com.runasagrada.hotelapi.repository.RoomRepository;
import com.runasagrada.hotelapi.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationServiceImpl implements ReservationService {

    @Autowired
    private ReservationRepository reservationRepo;
    @Autowired
    private ReservationServiceRepository reservationServiceRepo;
    @Autowired
    private UserRepository userRepo;
    @Autowired
    private HotelRepository hotelRepo;
    @Autowired
    private RoomRepository roomRepo;
    @Autowired
    private RoomLockRepository lockRepo;

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

    // Delete reservation and associated locks and services
    @Override
    public void delete(Integer id) {
        Reservation res = reservationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found: " + id));
        reservationServiceRepo.deleteByReservationReservationId(id);
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
    public List<Reservation> findByHotelId(Long hotelId) {
        return reservationRepo.findByHotelHotelId(hotelId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reservation> findByUser(Integer userId) {
        return reservationRepo.findByUserUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reservation> findCurrentByUser(Integer userId) {
        List<Reservation> all = findByUser(userId);
        LocalDate today = LocalDate.now();
        return all.stream()
                .filter(r -> r.getCheckOut() != null && !r.getCheckOut().isBefore(today))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reservation> findHistoryByUser(Integer userId) {

        return findByUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reservation> findForToday() {
        LocalDate today = LocalDate.now();
        return reservationRepo.findAll().stream()
                .filter(reservation -> {
                    LocalDate checkIn = reservation.getCheckIn();
                    LocalDate checkOut = reservation.getCheckOut();

                    // Verificar que las fechas no sean null
                    if (checkIn == null || checkOut == null) {
                        return false;
                    }

                    // La reserva está activa hoy si: checkIn <= hoy < checkOut
                    return !checkIn.isAfter(today) && today.isBefore(checkOut);
                })
                .collect(Collectors.toList());
    }

    @Override
    public Reservation activate(Integer id, String status) {
        Reservation res = reservationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found: " + id));
        res.setStatus(Reservation.Status.valueOf(status));
        return reservationRepo.save(res);
    }

    @Override
    public Reservation deactivate(Integer id) {
        Reservation res = reservationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found: " + id));
        lockRepo.deleteByReservationReservationId(id);
        res.setStatus(Reservation.Status.FINISHED);
        return reservationRepo.save(res);
    }

    public Reservation updateStatus(Integer id, String status) {
        Reservation res = reservationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found: " + id));
        Reservation.Status newStatus = Reservation.Status.valueOf(status.toUpperCase());
        res.setStatus(newStatus);
        return reservationRepo.save(res);
    }

    @Override
    public Double findLumpSumById(Long id) {
        List<ReservationServiceEntity> reservationService = reservationServiceRepo.findByReservationReservationId(id);
        if (reservationService == null || reservationService.isEmpty()) {
            return null;
        }
        return reservationService.stream().mapToDouble(rs -> rs.getUnitPrice() * rs.getQty()).sum();
    }

    @Override
    public double[] count() {
        LocalDateTime now = LocalDateTime.now();
        YearMonth current = YearMonth.from(now);
        YearMonth previous = current.minusMonths(1);

        LocalDateTime curStart = current.atDay(1).atStartOfDay();
        LocalDateTime curEnd = current.atEndOfMonth().atTime(23, 59, 59, 999_000_000);

        LocalDateTime prevStart = previous.atDay(1).atStartOfDay();
        LocalDateTime prevEnd = previous.atEndOfMonth().atTime(23, 59, 59, 999_000_000);

        Timestamp tCurStart = Timestamp.valueOf(curStart);
        Timestamp tCurEnd = Timestamp.valueOf(curEnd);
        Timestamp tPrevStart = Timestamp.valueOf(prevStart);
        Timestamp tPrevEnd = Timestamp.valueOf(prevEnd);

        long currentConfirmed = reservationRepo.countByStatusAndCreatedAtBetween(
                Reservation.Status.CONFIRMED, tCurStart, tCurEnd);
        long previousConfirmed = reservationRepo.countByStatusAndCreatedAtBetween(
                Reservation.Status.CONFIRMED, tPrevStart, tPrevEnd);

        double delta;
        if (previousConfirmed == 0) {
            delta = currentConfirmed > 0 ? 100.0 : 0.0;
        } else {
            delta = ((currentConfirmed - (double) previousConfirmed) / previousConfirmed) * 100.0;
        }

        delta = Math.round(delta * 10.0) / 10.0;

        return new double[] { currentConfirmed, delta };
    }

    @Override
    public Map<String, Long> countByRoomType() {
        List<Object[]> rows = reservationRepo.countByRoomType();

        return rows.stream()
                .map(r -> Map.entry(
                        (String) r[0],
                        (r[1] instanceof Number n) ? n.longValue() : 0L))
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new));
    }

    @Override
    public double[] countByHotel(Long hotelId) {
        LocalDateTime now = LocalDateTime.now();
        YearMonth current = YearMonth.from(now);
        YearMonth previous = current.minusMonths(1);

        LocalDateTime curStart = current.atDay(1).atStartOfDay();
        LocalDateTime curEnd = current.atEndOfMonth().atTime(23, 59, 59, 999_000_000);

        LocalDateTime prevStart = previous.atDay(1).atStartOfDay();
        LocalDateTime prevEnd = previous.atEndOfMonth().atTime(23, 59, 59, 999_000_000);

        Timestamp tCurStart = Timestamp.valueOf(curStart);
        Timestamp tCurEnd = Timestamp.valueOf(curEnd);
        Timestamp tPrevStart = Timestamp.valueOf(prevStart);
        Timestamp tPrevEnd = Timestamp.valueOf(prevEnd);

        long currentConfirmed = reservationRepo.countByHotelHotelIdAndStatusAndCreatedAtBetween(hotelId,
                Reservation.Status.CONFIRMED, tCurStart, tCurEnd);
        long previousConfirmed = reservationRepo.countByHotelHotelIdAndStatusAndCreatedAtBetween(hotelId,
                Reservation.Status.CONFIRMED, tPrevStart, tPrevEnd);

        double delta;
        if (previousConfirmed == 0) {
            delta = currentConfirmed > 0 ? 100.0 : 0.0;
        } else {
            delta = ((currentConfirmed - (double) previousConfirmed) / previousConfirmed) * 100.0;
        }

        delta = Math.round(delta * 10.0) / 10.0;

        return new double[] { currentConfirmed, delta };
    }

    @Override
    public Map<String, Long> countByRoomTypeAndHotel(Long hotelId) {
        List<Object[]> rows = reservationRepo.countByRoomTypeAndHotel(hotelId);

        return rows.stream()
                .map(r -> Map.entry(
                        (String) r[0],
                        (r[1] instanceof Number n) ? n.longValue() : 0L))
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new));
    }
}
