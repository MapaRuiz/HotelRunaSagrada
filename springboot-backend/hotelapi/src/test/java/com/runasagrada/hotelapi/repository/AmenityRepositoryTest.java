package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Amenity;
import com.runasagrada.hotelapi.model.AmenityType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pruebas unitarias para AmenityRepository
 * Usa @DataJpaTest para levantar contexto JPA mínimo con H2
 */
@DataJpaTest
@ActiveProfiles("test")
class AmenityRepositoryTest {

    @Autowired
    private AmenityRepository amenityRepository;

    private Amenity testAmenity;

    @BeforeEach
    void setUp() {
        // Arrange: Limpiar y preparar datos de prueba
        amenityRepository.deleteAll();

        testAmenity = new Amenity();
        testAmenity.setName("Piscina");
        testAmenity.setImage("/images/pool.png");
        testAmenity.setType(AmenityType.HOTEL);
    }

    @Test
    void testCreateAmenity_Success() {
        // Act: Guardar nueva amenidad
        Amenity saved = amenityRepository.save(testAmenity);

        // Assert: Verificar que se guardó correctamente
        assertThat(saved).isNotNull();
        assertThat(saved.getAmenityId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("Piscina");
        assertThat(saved.getType()).isEqualTo(AmenityType.HOTEL);
    }

    @Test
    void testFindById_Success() {
        // Arrange: Guardar amenidad
        Amenity saved = amenityRepository.save(testAmenity);

        // Act: Buscar por ID
        Optional<Amenity> found = amenityRepository.findById(saved.getAmenityId());

        // Assert: Verificar que se encontró
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Piscina");
    }

    @Test
    void testFindById_NotFound() {
        // Act: Buscar ID inexistente
        Optional<Amenity> found = amenityRepository.findById(9999);

        // Assert: Verificar que no existe
        assertThat(found).isEmpty();
    }

    @Test
    void testFindAll_MultipleAmenities() {
        // Arrange: Guardar múltiples amenidades
        amenityRepository.save(testAmenity);

        Amenity amenity2 = new Amenity();
        amenity2.setName("Gimnasio");
        amenity2.setImage("/images/gym.png");
        amenity2.setType(AmenityType.HOTEL);
        amenityRepository.save(amenity2);

        // Act: Obtener todas
        List<Amenity> all = amenityRepository.findAll();

        // Assert: Verificar cantidad
        assertThat(all).hasSize(2);
        assertThat(all).extracting(Amenity::getName)
                .containsExactlyInAnyOrder("Piscina", "Gimnasio");
    }

    @Test
    void testUpdateAmenity_Success() {
        // Arrange: Guardar amenidad
        Amenity saved = amenityRepository.save(testAmenity);

        // Act: Actualizar nombre
        saved.setName("Piscina Climatizada");
        Amenity updated = amenityRepository.save(saved);

        // Assert: Verificar actualización
        assertThat(updated.getName()).isEqualTo("Piscina Climatizada");
        assertThat(amenityRepository.findById(saved.getAmenityId()).get().getName())
                .isEqualTo("Piscina Climatizada");
    }

    @Test
    void testDeleteAmenity_Success() {
        // Arrange: Guardar amenidad
        Amenity saved = amenityRepository.save(testAmenity);
        Integer id = saved.getAmenityId();

        // Act: Eliminar
        amenityRepository.deleteById(id);

        // Assert: Verificar que se eliminó
        Optional<Amenity> found = amenityRepository.findById(id);
        assertThat(found).isEmpty();
    }

    @Test
    void testExistsByName_True() {
        // Arrange: Guardar amenidad
        amenityRepository.save(testAmenity);

        // Act: Verificar existencia por nombre
        boolean exists = amenityRepository.existsByName("Piscina");

        // Assert
        assertThat(exists).isTrue();
    }

    @Test
    void testExistsByName_False() {
        // Act: Verificar nombre inexistente
        boolean exists = amenityRepository.existsByName("Sauna");

        // Assert
        assertThat(exists).isFalse();
    }

    @Test
    void testFindByName_Success() {
        // Arrange: Guardar amenidad
        amenityRepository.save(testAmenity);

        // Act: Buscar por nombre
        Optional<Amenity> found = amenityRepository.findByName("Piscina");

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getType()).isEqualTo(AmenityType.HOTEL);
    }

    @Test
    void testFindByName_NotFound() {
        // Act: Buscar nombre inexistente
        Optional<Amenity> found = amenityRepository.findByName("Jacuzzi");

        // Assert
        assertThat(found).isEmpty();
    }

    @Test
    void testUniqueNameConstraint() {
        // Arrange: Guardar primera amenidad
        amenityRepository.save(testAmenity);

        // Act & Assert: Intentar guardar otra con el mismo nombre debe fallar
        Amenity duplicate = new Amenity();
        duplicate.setName("Piscina");
        duplicate.setType(AmenityType.ROOM);

        // El constraint UNIQUE hará que falle al hacer flush
        try {
            amenityRepository.saveAndFlush(duplicate);
            assertThat(false).as("Debería fallar por nombre duplicado").isTrue();
        } catch (Exception e) {
            // Esperamos una excepción por constraint violation
            assertThat(e).isNotNull();
        }
    }
}
