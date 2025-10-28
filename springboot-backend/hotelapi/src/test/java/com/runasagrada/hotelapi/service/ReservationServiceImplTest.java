package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.*;
import com.runasagrada.hotelapi.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias con mocks para ReservationServiceImpl
 * Usa Mockito para aislar dependencias (repositorios)
 * Valida lógica de negocio sin levantar contexto Spring
 */
@ExtendWith(MockitoExtension.class)
class ReservationServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomLockRepository roomLockRepository;

    @Mock
    private ReservationServiceRepository reservationServiceRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private User mockUser;
    private Hotel mockHotel;
    private Room mockRoom;
    private RoomType mockRoomType;
    private Reservation mockReservation;

    @BeforeEach
    void setUp() {
        // Arrange: Preparar objetos mock
        mockUser = new User();
        mockUser.setUserId(1);
        mockUser.setEmail("mock@test.com");
        mockUser.setFullName("Mock User");

        mockHotel = new Hotel();
        mockHotel.setHotelId(1L);
        mockHotel.setName("Mock Hotel");

        mockRoomType = new RoomType();
        mockRoomType.setRoomTypeId(1);
        mockRoomType.setName("Mock Type");
        mockRoomType.setCapacity(2);
        mockRoomType.setBasePrice(new BigDecimal("100.00"));

        mockRoom = new Room();
        mockRoom.setRoomId(1);
        mockRoom.setNumber("101");
        mockRoom.setFloor(1);
        mockRoom.setHotel(mockHotel);
        mockRoom.setRoomType(mockRoomType);

        mockReservation = new Reservation();
        mockReservation.setReservationId(1);
        mockReservation.setUser(mockUser);
        mockReservation.setHotel(mockHotel);
        mockReservation.setRoom(mockRoom);
        mockReservation.setCheckIn(LocalDate.now().plusDays(1));
        mockReservation.setCheckOut(LocalDate.now().plusDays(3));
        mockReservation.setStatus(Reservation.Status.PENDING);
    }

    @Test
    void testCreate_Success_CallsRepositoriesCorrectly() {
        // Arrange: Configurar comportamiento de los mocks
        when(userRepository.findById(1)).thenReturn(Optional.of(mockUser));
        when(hotelRepository.findById(1L)).thenReturn(Optional.of(mockHotel));
        when(roomRepository.findById(1)).thenReturn(Optional.of(mockRoom));
        when(roomLockRepository.existsByRoomIdAndLockDate(anyInt(), any(LocalDate.class)))
                .thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenReturn(mockReservation);

        // Act: Crear reservación
        Reservation result = reservationService.create(
                1, 1L, 1,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(3),
                Reservation.Status.PENDING);

        // Assert: Verificar resultado y llamadas a repositorios
        assertThat(result).isNotNull();
        assertThat(result.getReservationId()).isEqualTo(1);

        verify(userRepository, times(1)).findById(1);
        verify(hotelRepository, times(1)).findById(1L);
        verify(roomRepository, times(1)).findById(1);
        verify(reservationRepository, times(1)).save(any(Reservation.class));
        verify(roomLockRepository, times(2)).save(any(RoomLock.class)); // 2 días
    }

    @Test
    void testCreate_ThrowsException_WhenUserIdIsNull() {
        // Act & Assert: Verificar validación de parámetros obligatorios
        assertThatThrownBy(() -> reservationService.create(null, 1L, 1,
                LocalDate.now(), LocalDate.now().plusDays(1), null)).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("obligatorios");

        // Verificar que no se llamó a ningún repositorio
        verify(userRepository, never()).findById(anyInt());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testCreate_ThrowsException_WhenUserNotFound() {
        // Arrange: Simular usuario no encontrado
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.create(999, 1L, 1,
                LocalDate.now(), LocalDate.now().plusDays(1), null)).isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");

        verify(userRepository, times(1)).findById(999);
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testCreate_ThrowsException_WhenHotelNotFound() {
        // Arrange
        when(userRepository.findById(1)).thenReturn(Optional.of(mockUser));
        when(hotelRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.create(1, 999L, 1,
                LocalDate.now(), LocalDate.now().plusDays(1), null)).isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Hotel not found");

        verify(hotelRepository, times(1)).findById(999L);
    }

    @Test
    void testCreate_ThrowsException_WhenRoomNotFound() {
        // Arrange
        when(userRepository.findById(1)).thenReturn(Optional.of(mockUser));
        when(hotelRepository.findById(1L)).thenReturn(Optional.of(mockHotel));
        when(roomRepository.findById(999)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.create(1, 1L, 999,
                LocalDate.now(), LocalDate.now().plusDays(1), null)).isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Room not found");

        verify(roomRepository, times(1)).findById(999);
    }

    @Test
    void testCreate_ThrowsException_WhenRoomIsLocked() {
        // Arrange: Simular habitación ya bloqueada
        when(userRepository.findById(1)).thenReturn(Optional.of(mockUser));
        when(hotelRepository.findById(1L)).thenReturn(Optional.of(mockHotel));
        when(roomRepository.findById(1)).thenReturn(Optional.of(mockRoom));

        // Crear una reservación mock para que no sea null
        Reservation lockedReservation = new Reservation();
        lockedReservation.setUser(mockUser);
        lockedReservation.setHotel(mockHotel);
        lockedReservation.setRoom(mockRoom);
        lockedReservation.setCheckIn(LocalDate.now().plusDays(1));
        lockedReservation.setCheckOut(LocalDate.now().plusDays(3));

        when(reservationRepository.save(any(Reservation.class))).thenReturn(lockedReservation);
        when(roomLockRepository.existsByRoomIdAndLockDate(anyInt(), any(LocalDate.class)))
                .thenReturn(true); // Habitación bloqueada en el primer día

        // Act & Assert
        assertThatThrownBy(() -> reservationService.create(1, 1L, 1,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(3),
                null)).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Room not available");

        // Verify que se intentó guardar pero no se crearon locks
        verify(roomLockRepository, never()).save(any(RoomLock.class));
    }

    @Test
    void testUpdate_Success_DeletesOldLocksAndCreatesNew() {
        // Arrange
        when(reservationRepository.findById(1)).thenReturn(Optional.of(mockReservation));
        when(reservationRepository.save(any(Reservation.class))).thenReturn(mockReservation);
        when(roomLockRepository.existsByRoomIdAndLockDate(anyInt(), any(LocalDate.class)))
                .thenReturn(false);

        // Act: Actualizar fechas
        Reservation updated = reservationService.update(
                1, null, null, null,
                LocalDate.now().plusDays(5),
                LocalDate.now().plusDays(7),
                Reservation.Status.CONFIRMED);

        // Assert
        assertThat(updated).isNotNull();
        verify(roomLockRepository, times(1)).deleteByReservationReservationId(1);
        verify(reservationRepository, times(1)).save(any(Reservation.class));
        verify(roomLockRepository, times(2)).save(any(RoomLock.class)); // Nuevos locks
    }

    @Test
    void testUpdate_ThrowsException_WhenReservationNotFound() {
        // Arrange
        when(reservationRepository.findById(999)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.update(999, null, null, null, null, null, null))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Reservation not found");

        verify(roomLockRepository, never()).deleteByReservationReservationId(anyInt());
    }

    @Test
    void testDelete_Success_RemovesPaymentsServicesLocksAndReservation() {
        // Arrange
        when(reservationRepository.findById(1)).thenReturn(Optional.of(mockReservation));
        when(paymentRepository.findByReservationId_ReservationId(1)).thenReturn(new ArrayList<>());

        // Act
        reservationService.delete(1);

        // Assert: Verificar orden de eliminación
        verify(paymentRepository, times(1)).findByReservationId_ReservationId(1);
        verify(reservationServiceRepository, times(1)).deleteByReservationReservationId(1);
        verify(roomLockRepository, times(1)).deleteByReservationReservationId(1);
        verify(reservationRepository, times(1)).delete(mockReservation);
    }

    @Test
    void testFindAll_ReturnsAllReservations() {
        // Arrange
        List<Reservation> mockList = List.of(mockReservation);
        when(reservationRepository.findAll()).thenReturn(mockList);

        // Act
        List<Reservation> result = reservationService.findAll();

        // Assert
        assertThat(result).hasSize(1);
        verify(reservationRepository, times(1)).findAll();
    }

    @Test
    void testFindById_ReturnsReservationWhenFound() {
        // Arrange
        when(reservationRepository.findById(1)).thenReturn(Optional.of(mockReservation));

        // Act
        Optional<Reservation> result = reservationService.findById(1);

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().getReservationId()).isEqualTo(1);
        verify(reservationRepository, times(1)).findById(1);
    }

    @Test
    void testFindById_ReturnsEmptyWhenNotFound() {
        // Arrange
        when(reservationRepository.findById(999)).thenReturn(Optional.empty());

        // Act
        Optional<Reservation> result = reservationService.findById(999);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    void testFindByUser_CallsCorrectRepositoryMethod() {
        // Arrange
        List<Reservation> mockList = List.of(mockReservation);
        when(reservationRepository.findByUserUserIdOrderByCheckInDesc(1))
                .thenReturn(mockList);

        // Act
        List<Reservation> result = reservationService.findByUser(1);

        // Assert
        assertThat(result).hasSize(1);
        verify(reservationRepository, times(1)).findByUserUserIdOrderByCheckInDesc(1);
    }

    @Test
    void testActivate_UpdatesStatusCorrectly() {
        // Arrange
        when(reservationRepository.findById(1)).thenReturn(Optional.of(mockReservation));
        when(reservationRepository.save(any(Reservation.class))).thenReturn(mockReservation);

        // Act
        Reservation result = reservationService.activate(1, "CONFIRMED");

        // Assert
        verify(reservationRepository, times(1)).findById(1);
        verify(reservationRepository, times(1)).save(any(Reservation.class));
    }

    @Test
    void testDeactivate_RemovesLocksAndSetsStatusToFinished() {
        // Arrange
        when(reservationRepository.findById(1)).thenReturn(Optional.of(mockReservation));
        when(reservationRepository.save(any(Reservation.class))).thenReturn(mockReservation);

        // Act
        Reservation result = reservationService.deactivate(1);

        // Assert
        verify(roomLockRepository, times(1)).deleteByReservationReservationId(1);
        verify(reservationRepository, times(1)).save(any(Reservation.class));
    }

    @Test
    void testUpdateStatus_ChangesStatusSuccessfully() {
        // Arrange
        when(reservationRepository.findById(1)).thenReturn(Optional.of(mockReservation));
        when(reservationRepository.save(any(Reservation.class))).thenReturn(mockReservation);

        // Act
        Reservation result = reservationService.updateStatus(1, "CHECKIN");

        // Assert
        verify(reservationRepository, times(1)).findById(1);
        verify(reservationRepository, times(1)).save(any(Reservation.class));
    }

    @Test
    void testFindByHotelId_ReturnsReservationsForHotel() {
        // Arrange
        when(reservationRepository.findByHotelHotelId(1L)).thenReturn(List.of(mockReservation));

        // Act
        List<Reservation> result = reservationService.findByHotelId(1L);

        // Assert
        assertThat(result).hasSize(1);
        verify(reservationRepository, times(1)).findByHotelHotelId(1L);
    }
}
