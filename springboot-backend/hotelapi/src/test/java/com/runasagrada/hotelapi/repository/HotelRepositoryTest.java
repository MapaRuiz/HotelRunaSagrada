package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Amenity;
import com.runasagrada.hotelapi.model.AmenityType;
import com.runasagrada.hotelapi.model.Hotel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pruebas para consultas personalizadas de HotelRepository
 * Cubre: countAmenitiesByHotel (JPQL con agregación)
 */
@DataJpaTest
@ActiveProfiles("test")
class HotelRepositoryTest {

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private AmenityRepository amenityRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Amenity amenity1, amenity2, amenity3;

    @BeforeEach
    void setUp() {
        // Arrange: Limpiar y crear amenidades
        hotelRepository.deleteAll();
        amenityRepository.deleteAll();

        amenity1 = createAmenity("WiFi", AmenityType.HOTEL);
        amenity2 = createAmenity("Piscina", AmenityType.HOTEL);
        amenity3 = createAmenity("Gimnasio", AmenityType.HOTEL);

        amenityRepository.saveAll(List.of(amenity1, amenity2, amenity3));
        entityManager.flush();
    }

    @Test
    void testCountAmenitiesByHotel_MultipleHotelsWithDifferentAmenities() {
        // Arrange: Crear hoteles con diferentes cantidades de amenidades
        Hotel hotel1 = createHotel("Hotel Luxury");
        hotel1.getAmenities().add(amenity1);
        hotel1.getAmenities().add(amenity2);
        hotel1.getAmenities().add(amenity3); // 3 amenidades

        Hotel hotel2 = createHotel("Hotel Basic");
        hotel2.getAmenities().add(amenity1); // 1 amenidad

        Hotel hotel3 = createHotel("Hotel Comfort");
        hotel3.getAmenities().add(amenity1);
        hotel3.getAmenities().add(amenity2); // 2 amenidades

        hotelRepository.saveAll(List.of(hotel1, hotel2, hotel3));
        entityManager.flush();

        // Act: Obtener conteo de amenidades por hotel (ordenado DESC)
        List<Object[]> results = hotelRepository.countAmenitiesByHotel();

        // Assert: Verificar orden descendente y conteos correctos
        assertThat(results).hasSize(3);

        // Primer hotel debe tener 3 amenidades
        Object[] first = results.get(0);
        assertThat(first[0]).isEqualTo("Hotel Luxury");
        assertThat(first[1]).isEqualTo(3L);

        // Segundo hotel debe tener 2 amenidades
        Object[] second = results.get(1);
        assertThat(second[0]).isEqualTo("Hotel Comfort");
        assertThat(second[1]).isEqualTo(2L);

        // Tercer hotel debe tener 1 amenidad
        Object[] third = results.get(2);
        assertThat(third[0]).isEqualTo("Hotel Basic");
        assertThat(third[1]).isEqualTo(1L);
    }

    @Test
    void testCountAmenitiesByHotel_HotelWithoutAmenities() {
        // Arrange: Crear hoteles con y sin amenidades
        Hotel hotelWithAmenities = createHotel("Hotel Con Amenidades");
        hotelWithAmenities.getAmenities().add(amenity1);

        Hotel hotelWithoutAmenities = createHotel("Hotel Sin Amenidades");
        // No agregamos amenidades

        hotelRepository.saveAll(List.of(hotelWithAmenities, hotelWithoutAmenities));
        entityManager.flush();

        // Act: Obtener conteos
        List<Object[]> results = hotelRepository.countAmenitiesByHotel();

        // Assert: Ambos hoteles deben aparecer, uno con 1 y otro con 0
        assertThat(results).hasSize(2);

        // El hotel con amenidades debe aparecer primero (orden DESC)
        Object[] first = results.get(0);
        assertThat(first[0]).isEqualTo("Hotel Con Amenidades");
        assertThat(first[1]).isEqualTo(1L);

        // El hotel sin amenidades debe tener conteo 0
        Object[] second = results.get(1);
        assertThat(second[0]).isEqualTo("Hotel Sin Amenidades");
        assertThat(second[1]).isEqualTo(0L);
    }

    @Test
    void testFindByAmenities_Success() {
        // Arrange: Crear hoteles con amenidades específicas
        Hotel hotel1 = createHotel("Hotel A");
        hotel1.getAmenities().add(amenity1);
        hotel1.getAmenities().add(amenity2);

        Hotel hotel2 = createHotel("Hotel B");
        hotel2.getAmenities().add(amenity2);

        Hotel hotel3 = createHotel("Hotel C");
        hotel3.getAmenities().add(amenity3);

        hotelRepository.saveAll(List.of(hotel1, hotel2, hotel3));
        entityManager.flush();

        // Act: Buscar hoteles con amenity2 (Piscina)
        List<Hotel> hotelsWithPool = hotelRepository.findByAmenities_AmenityId(amenity2.getAmenityId());

        // Assert: Solo Hotel A y Hotel B deben tener piscina
        assertThat(hotelsWithPool).hasSize(2);
        assertThat(hotelsWithPool).extracting(Hotel::getName)
                .containsExactlyInAnyOrder("Hotel A", "Hotel B");
    }

    @Test
    void testExistsByName_True() {
        // Arrange: Crear hotel
        Hotel hotel = createHotel("Hotel Test");
        hotelRepository.save(hotel);

        // Act & Assert
        assertThat(hotelRepository.existsByName("Hotel Test")).isTrue();
    }

    @Test
    void testExistsByName_False() {
        // Act & Assert: Nombre inexistente
        assertThat(hotelRepository.existsByName("Hotel Inexistente")).isFalse();
    }

    @Test
    void testCountAmenitiesByHotel_EmptyDatabase() {
        // Arrange: Base de datos vacía (ya limpiada en setUp)

        // Act: Ejecutar query en BD vacía
        List<Object[]> results = hotelRepository.countAmenitiesByHotel();

        // Assert: Debe retornar lista vacía
        assertThat(results).isEmpty();
    }

    // Helper methods
    private Hotel createHotel(String name) {
        Hotel hotel = new Hotel();
        hotel.setName(name);
        hotel.setLatitude("10.0");
        hotel.setLongitude("-84.0");
        hotel.setDescription("Hotel de prueba");
        hotel.setCheckInAfter("15:00");
        hotel.setCheckOutBefore("12:00");
        hotel.setAmenities(new HashSet<>());
        return hotel;
    }

    private Amenity createAmenity(String name, AmenityType type) {
        Amenity amenity = new Amenity();
        amenity.setName(name);
        amenity.setType(type);
        amenity.setImage("/images/" + name.toLowerCase() + ".png");
        return amenity;
    }
}
