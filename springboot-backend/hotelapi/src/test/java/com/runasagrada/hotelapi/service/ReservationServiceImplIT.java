package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.*;
import com.runasagrada.hotelapi.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pruebas de integración para ReservationServiceImpl
 * Usa @SpringBootTest con perfil test para levantar contexto completo
 * Cubre flujos de negocio: crear, actualizar, cancelar, validar conflictos
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReservationServiceImplIT {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private RoomLockRepository roomLockRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    private User testUser;
    private Hotel testHotel;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        // Arrange: Limpiar y preparar datos para pruebas de integración
        roomLockRepository.deleteAll();
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        roomTypeRepository.deleteAll();
        hotelRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        // Crear rol
        Role role = new Role();
        role.setName("ROLE_CLIENT");
        roleRepository.save(role);

        // Crear usuario
        testUser = new User();
        testUser.setEmail("integration@test.com");
        testUser.setPassword("password");
        testUser.setFullName("Integration Test User");
        testUser.getRoles().add(role);
        testUser = userRepository.save(testUser);

        // Crear hotel
        testHotel = new Hotel();
        testHotel.setName("Integration Hotel");
        testHotel.setLatitude("10.0");
        testHotel.setLongitude("-84.0");
        testHotel = hotelRepository.save(testHotel);

        // Crear tipo de habitación
        RoomType roomType = new RoomType();
        roomType.setName("Estándar");
        roomType.setCapacity(2);
        roomType.setBasePrice(new BigDecimal("100.00"));
        roomType = roomTypeRepository.save(roomType);

        // Crear habitación
        testRoom = new Room();
        testRoom.setHotel(testHotel);
        testRoom.setRoomType(roomType);
        testRoom.setNumber("101");
        testRoom.setFloor(1);
        testRoom.setResStatus(Room.ReservationStatus.AVAILABLE);
        testRoom = roomRepository.save(testRoom);
    }

    @Test
    void testCreate_Success_CreatesReservationAndLocks() {
        // Arrange: Definir fechas
        LocalDate checkIn = LocalDate.now().plusDays(1);
        LocalDate checkOut = LocalDate.now().plusDays(3);

        // Act: Crear reservación
        Reservation reservation = reservationService.create(
                testUser.getUserId(),
                testHotel.getHotelId(),
                testRoom.getRoomId(),
                checkIn,
                checkOut,
                Reservation.Status.PENDING);

        // Assert: Verificar que se creó correctamente
        assertThat(reservation).isNotNull();
        assertThat(reservation.getReservationId()).isNotNull();
        assertThat(reservation.getUser().getUserId()).isEqualTo(testUser.getUserId());
        assertThat(reservation.getRoom().getRoomId()).isEqualTo(testRoom.getRoomId());
        assertThat(reservation.getStatus()).isEqualTo(Reservation.Status.PENDING);

        // Verificar que se crearon los locks (2 días: día 1 y día 2, checkOut es
        // exclusivo)
        List<RoomLock> locks = roomLockRepository.findAll();
        assertThat(locks).hasSize(2);
        assertThat(locks).extracting(RoomLock::getLockDate)
                .containsExactlyInAnyOrder(checkIn, checkIn.plusDays(1));
    }

    @Test
    void testCreate_ThrowsException_WhenRoomAlreadyLocked() {
        // Arrange: Crear primera reservación
        LocalDate checkIn = LocalDate.now().plusDays(1);
        LocalDate checkOut = LocalDate.now().plusDays(3);

        reservationService.create(
                testUser.getUserId(),
                testHotel.getHotelId(),
                testRoom.getRoomId(),
                checkIn,
                checkOut,
                Reservation.Status.CONFIRMED);

        // Act & Assert: Intentar crear otra reservación que se solape (debe fallar)
        assertThatThrownBy(() -> reservationService.create(
                testUser.getUserId(),
                testHotel.getHotelId(),
                testRoom.getRoomId(),
                checkIn.plusDays(1), // Se solapa con la primera
                checkOut.plusDays(1),
                Reservation.Status.PENDING)).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Room not available");
    }

    @Test
    void testCreate_ThrowsException_WhenRequiredParametersNull() {
        // Act & Assert: Intentar crear con parámetros nulos
        assertThatThrownBy(() -> reservationService.create(null, testHotel.getHotelId(), testRoom.getRoomId(),
                LocalDate.now(), LocalDate.now().plusDays(1), Reservation.Status.PENDING))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("obligatorios");
    }

    @Test
    void testCreate_ThrowsException_WhenUserNotFound() {
        // Act & Assert: Crear con userId inexistente
        assertThatThrownBy(() -> reservationService.create(9999, testHotel.getHotelId(), testRoom.getRoomId(),
                LocalDate.now(), LocalDate.now().plusDays(1), Reservation.Status.PENDING))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void testUpdate_Success_UpdatesDatesAndRecreatesLocks() {
        // Arrange: Crear reservación inicial
        LocalDate oldCheckIn = LocalDate.now().plusDays(1);
        LocalDate oldCheckOut = LocalDate.now().plusDays(3);

        Reservation reservation = reservationService.create(
                testUser.getUserId(),
                testHotel.getHotelId(),
                testRoom.getRoomId(),
                oldCheckIn,
                oldCheckOut,
                Reservation.Status.PENDING);

        assertThat(roomLockRepository.findAll()).hasSize(2); // 2 locks iniciales

        // Act: Actualizar fechas
        LocalDate newCheckIn = LocalDate.now().plusDays(5);
        LocalDate newCheckOut = LocalDate.now().plusDays(7);

        Reservation updated = reservationService.update(
                reservation.getReservationId(),
                null, null, null, // No cambiar user, hotel, room
                newCheckIn,
                newCheckOut,
                Reservation.Status.CONFIRMED);

        // Assert: Verificar actualización
        assertThat(updated.getCheckIn()).isEqualTo(newCheckIn);
        assertThat(updated.getCheckOut()).isEqualTo(newCheckOut);
        assertThat(updated.getStatus()).isEqualTo(Reservation.Status.CONFIRMED);

        // Verificar que se recrearon los locks (2 nuevos días)
        List<RoomLock> locks = roomLockRepository.findAll();
        assertThat(locks).hasSize(2);
        assertThat(locks).extracting(RoomLock::getLockDate)
                .containsExactlyInAnyOrder(newCheckIn, newCheckIn.plusDays(1));
    }

    @Test
    void testDelete_Success_RemovesReservationAndLocks() {
        // Arrange: Crear reservación
        Reservation reservation = reservationService.create(
                testUser.getUserId(),
                testHotel.getHotelId(),
                testRoom.getRoomId(),
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(3),
                Reservation.Status.PENDING);

        Integer reservationId = reservation.getReservationId();
        assertThat(roomLockRepository.findAll()).isNotEmpty();

        // Act: Eliminar reservación
        reservationService.delete(reservationId);

        // Assert: Verificar que se eliminó la reservación y los locks
        assertThat(reservationRepository.findById(reservationId)).isEmpty();
        assertThat(roomLockRepository.findAll()).isEmpty();
    }

    @Test
    void testFindCurrentByUser_ReturnsOnlyFutureAndOngoingReservations() {
        // Arrange: Crear reservaciones pasadas, actuales y futuras
        LocalDate today = LocalDate.now();

        // Reservación pasada (checkOut anterior a hoy)
        reservationService.create(
                testUser.getUserId(), testHotel.getHotelId(), testRoom.getRoomId(),
                today.minusDays(5), today.minusDays(2), Reservation.Status.FINISHED);

        // Crear otra habitación para evitar conflictos de locks
        Room room2 = new Room();
        room2.setHotel(testHotel);
        room2.setRoomType(testRoom.getRoomType());
        room2.setNumber("102");
        room2.setFloor(1);
        room2 = roomRepository.save(room2);

        // Reservación actual (incluye hoy)
        reservationService.create(
                testUser.getUserId(), testHotel.getHotelId(), room2.getRoomId(),
                today.minusDays(1), today.plusDays(2), Reservation.Status.CONFIRMED);

        // Crear otra habitación
        Room room3 = new Room();
        room3.setHotel(testHotel);
        room3.setRoomType(testRoom.getRoomType());
        room3.setNumber("103");
        room3.setFloor(1);
        room3 = roomRepository.save(room3);

        // Reservación futura
        reservationService.create(
                testUser.getUserId(), testHotel.getHotelId(), room3.getRoomId(),
                today.plusDays(5), today.plusDays(7), Reservation.Status.PENDING);

        // Act: Obtener reservaciones actuales
        List<Reservation> currentReservations = reservationService.findCurrentByUser(testUser.getUserId());

        // Assert: Solo debe retornar las 2 que no han terminado (actual y futura)
        assertThat(currentReservations).hasSize(2);
        assertThat(currentReservations).allMatch(r -> r.getCheckOut() != null && !r.getCheckOut().isBefore(today));
    }

    @Test
    void testActivate_ChangesStatusCorrectly() {
        // Arrange: Crear reservación en PENDING
        Reservation reservation = reservationService.create(
                testUser.getUserId(),
                testHotel.getHotelId(),
                testRoom.getRoomId(),
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(3),
                Reservation.Status.PENDING);

        // Act: Activar (cambiar a CONFIRMED)
        Reservation activated = reservationService.activate(
                reservation.getReservationId(),
                "CONFIRMED");

        // Assert: Verificar cambio de estado
        assertThat(activated.getStatus()).isEqualTo(Reservation.Status.CONFIRMED);
    }

    @Test
    void testDeactivate_SetsStatusToFinishedAndRemovesLocks() {
        // Arrange: Crear reservación
        Reservation reservation = reservationService.create(
                testUser.getUserId(),
                testHotel.getHotelId(),
                testRoom.getRoomId(),
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(3),
                Reservation.Status.CONFIRMED);

        assertThat(roomLockRepository.findAll()).isNotEmpty();

        // Act: Desactivar
        Reservation deactivated = reservationService.deactivate(reservation.getReservationId());

        // Assert: Verificar estado FINISHED y locks eliminados
        assertThat(deactivated.getStatus()).isEqualTo(Reservation.Status.FINISHED);
        assertThat(roomLockRepository.findAll()).isEmpty();
    }

    @Test
    void testFindForToday_ReturnsOnlyTodayActiveReservations() {
        // Arrange: Crear reservaciones con diferentes rangos
        LocalDate today = LocalDate.now();

        // Reservación que NO incluye hoy (futura)
        reservationService.create(
                testUser.getUserId(), testHotel.getHotelId(), testRoom.getRoomId(),
                today.plusDays(5), today.plusDays(7), Reservation.Status.CONFIRMED);

        // Crear habitación adicional
        Room room2 = new Room();
        room2.setHotel(testHotel);
        room2.setRoomType(testRoom.getRoomType());
        room2.setNumber("104");
        room2.setFloor(1);
        room2 = roomRepository.save(room2);

        // Reservación que SÍ incluye hoy (checkIn <= hoy < checkOut)
        reservationService.create(
                testUser.getUserId(), testHotel.getHotelId(), room2.getRoomId(),
                today.minusDays(1), today.plusDays(2), Reservation.Status.CHECKIN);

        // Act: Obtener reservaciones activas hoy
        List<Reservation> todayReservations = reservationService.findForToday();

        // Assert: Solo la segunda debe aparecer
        assertThat(todayReservations).hasSize(1);
        assertThat(todayReservations.get(0).getRoom().getNumber()).isEqualTo("104");
    }
}
