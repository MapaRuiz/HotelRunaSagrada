package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pruebas para consultas personalizadas de ReservationRepository
 * Cubre: countByRoomType, countByStatusAndCreatedAtBetween
 */
@DataJpaTest
@ActiveProfiles("test")
class ReservationRepositoryTest {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User testUser;
    private Hotel testHotel;
    private RoomType roomTypeStandard, roomTypeDeluxe;
    private Room room1, room2;

    @BeforeEach
    void setUp() {
        // Arrange: Limpiar base de datos
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
        testUser.setEmail("client@test.com");
        testUser.setPassword("pass123");
        testUser.setFullName("Test Client");
        testUser.getRoles().add(role);
        testUser = userRepository.save(testUser);

        // Crear hotel
        testHotel = new Hotel();
        testHotel.setName("Hotel Test");
        testHotel.setLatitude("10.0");
        testHotel.setLongitude("-84.0");
        testHotel.setDescription("Test hotel");
        testHotel = hotelRepository.save(testHotel);

        // Crear tipos de habitación
        roomTypeStandard = new RoomType();
        roomTypeStandard.setName("Estándar");
        roomTypeStandard.setCapacity(2);
        roomTypeStandard.setBasePrice(new BigDecimal("100.00"));
        roomTypeStandard = roomTypeRepository.save(roomTypeStandard);

        roomTypeDeluxe = new RoomType();
        roomTypeDeluxe.setName("Deluxe");
        roomTypeDeluxe.setCapacity(4);
        roomTypeDeluxe.setBasePrice(new BigDecimal("200.00"));
        roomTypeDeluxe = roomTypeRepository.save(roomTypeDeluxe);

        // Crear habitaciones
        room1 = createRoom(testHotel, roomTypeStandard, "101");
        room2 = createRoom(testHotel, roomTypeDeluxe, "201");
        roomRepository.saveAll(List.of(room1, room2));

        entityManager.flush();
    }

    @Test
    void testCountByRoomType_MultiplReservationsGroupedByType() {
        // Arrange: Crear reservaciones de diferentes tipos
        createReservation(testUser, testHotel, room1, LocalDate.now(), LocalDate.now().plusDays(1));
        createReservation(testUser, testHotel, room1, LocalDate.now().plusDays(5), LocalDate.now().plusDays(6));
        createReservation(testUser, testHotel, room2, LocalDate.now().plusDays(10), LocalDate.now().plusDays(11));
        entityManager.flush();

        // Act: Contar por tipo de habitación
        List<Object[]> results = reservationRepository.countByRoomType();

        // Assert: Verificar agrupación correcta
        assertThat(results).hasSize(2);

        // Buscar resultados por nombre de tipo
        Object[] standardResult = results.stream()
                .filter(r -> r[0].equals("Estándar"))
                .findFirst()
                .orElseThrow();
        assertThat(standardResult[1]).isEqualTo(2L); // 2 reservaciones Estándar

        Object[] deluxeResult = results.stream()
                .filter(r -> r[0].equals("Deluxe"))
                .findFirst()
                .orElseThrow();
        assertThat(deluxeResult[1]).isEqualTo(1L); // 1 reservación Deluxe
    }

    @Test
    void testCountByRoomType_EmptyWhenNoReservations() {
        // Act: Contar sin reservaciones
        List<Object[]> results = reservationRepository.countByRoomType();

        // Assert: Lista vacía
        assertThat(results).isEmpty();
    }

    @Test
    void testCountByStatusAndCreatedAtBetween_FiltersByStatusAndDateRange() {
        // Arrange: Crear reservaciones en diferentes fechas y estados
        LocalDateTime now = LocalDateTime.now();

        Reservation res1 = createReservation(testUser, testHotel, room1,
                LocalDate.now(), LocalDate.now().plusDays(1));
        res1.setStatus(Reservation.Status.CONFIRMED);
        res1.setCreatedAt(Timestamp.valueOf(now.minusDays(5)));

        Reservation res2 = createReservation(testUser, testHotel, room2,
                LocalDate.now().plusDays(2), LocalDate.now().plusDays(3));
        res2.setStatus(Reservation.Status.CONFIRMED);
        res2.setCreatedAt(Timestamp.valueOf(now.minusDays(3)));

        Reservation res3 = createReservation(testUser, testHotel, room1,
                LocalDate.now().plusDays(4), LocalDate.now().plusDays(5));
        res3.setStatus(Reservation.Status.PENDING);
        res3.setCreatedAt(Timestamp.valueOf(now.minusDays(2)));

        Reservation res4 = createReservation(testUser, testHotel, room2,
                LocalDate.now().plusDays(6), LocalDate.now().plusDays(7));
        res4.setStatus(Reservation.Status.CONFIRMED);
        res4.setCreatedAt(Timestamp.valueOf(now.minusDays(10))); // Fuera de rango

        reservationRepository.saveAll(List.of(res1, res2, res3, res4));
        entityManager.flush();

        // Act: Contar CONFIRMED en últimos 7 días
        Timestamp start = Timestamp.valueOf(now.minusDays(7));
        Timestamp end = Timestamp.valueOf(now);
        long count = reservationRepository.countByStatusAndCreatedAtBetween(
                Reservation.Status.CONFIRMED, start, end);

        // Assert: Solo 2 confirmadas en el rango (res1 y res2, res4 está fuera)
        assertThat(count).isEqualTo(2L);
    }

    @Test
    void testCountByRoomTypeAndHotel_FiltersCorrectlyByHotel() {
        // Arrange: Crear otro hotel
        Hotel hotel2 = new Hotel();
        hotel2.setName("Hotel 2");
        hotel2.setLatitude("11.0");
        hotel2.setLongitude("-85.0");
        hotel2 = hotelRepository.save(hotel2);

        Room room3 = createRoom(hotel2, roomTypeStandard, "301");
        roomRepository.save(room3);

        // Crear reservaciones en ambos hoteles
        createReservation(testUser, testHotel, room1, LocalDate.now(), LocalDate.now().plusDays(1));
        createReservation(testUser, testHotel, room1, LocalDate.now().plusDays(2), LocalDate.now().plusDays(3));
        createReservation(testUser, hotel2, room3, LocalDate.now().plusDays(4), LocalDate.now().plusDays(5));
        entityManager.flush();

        // Act: Contar por tipo solo en testHotel
        List<Object[]> results = reservationRepository.countByRoomTypeAndHotel(testHotel.getHotelId());

        // Assert: Solo debe contar las 2 del testHotel
        assertThat(results).hasSize(1);
        Object[] result = results.get(0);
        assertThat(result[0]).isEqualTo("Estándar");
        assertThat(result[1]).isEqualTo(2L);
    }

    @Test
    void testFindByUserUserId_ReturnsAllUserReservations() {
        // Arrange: Crear múltiples reservaciones para el usuario
        createReservation(testUser, testHotel, room1, LocalDate.now(), LocalDate.now().plusDays(1));
        createReservation(testUser, testHotel, room2, LocalDate.now().plusDays(2), LocalDate.now().plusDays(3));
        entityManager.flush();

        // Act: Buscar por userId
        List<Reservation> reservations = reservationRepository.findByUserUserId(testUser.getUserId());

        // Assert: Debe retornar ambas
        assertThat(reservations).hasSize(2);
    }

    @Test
    void testFindByUserUserIdOrderByCheckInDesc_OrdersCorrectly() {
        // Arrange: Crear reservaciones con diferentes check-in
        createReservation(testUser, testHotel, room1, LocalDate.now().plusDays(5), LocalDate.now().plusDays(6));
        createReservation(testUser, testHotel, room2, LocalDate.now().plusDays(1), LocalDate.now().plusDays(2));
        createReservation(testUser, testHotel, room1, LocalDate.now().plusDays(10), LocalDate.now().plusDays(11));
        entityManager.flush();

        // Act: Obtener ordenadas por check-in DESC
        List<Reservation> reservations = reservationRepository.findByUserUserIdOrderByCheckInDesc(testUser.getUserId());

        // Assert: Verificar orden descendente
        assertThat(reservations).hasSize(3);
        assertThat(reservations.get(0).getCheckIn()).isEqualTo(LocalDate.now().plusDays(10));
        assertThat(reservations.get(1).getCheckIn()).isEqualTo(LocalDate.now().plusDays(5));
        assertThat(reservations.get(2).getCheckIn()).isEqualTo(LocalDate.now().plusDays(1));
    }

    // Helper methods
    private Room createRoom(Hotel hotel, RoomType roomType, String number) {
        Room room = new Room();
        room.setHotel(hotel);
        room.setRoomType(roomType);
        room.setNumber(number);
        room.setFloor(Integer.parseInt(number.substring(0, 1)));
        room.setResStatus(Room.ReservationStatus.AVAILABLE);
        room.setCleStatus(Room.CleaningStatus.CLEAN);
        return room;
    }

    private Reservation createReservation(User user, Hotel hotel, Room room,
            LocalDate checkIn, LocalDate checkOut) {
        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setHotel(hotel);
        reservation.setRoom(room);
        reservation.setCheckIn(checkIn);
        reservation.setCheckOut(checkOut);
        reservation.setStatus(Reservation.Status.PENDING);
        return reservationRepository.save(reservation);
    }
}
