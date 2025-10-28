package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.PaymentMethod;
import com.runasagrada.hotelapi.model.Role;
import com.runasagrada.hotelapi.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pruebas para consultas personalizadas de PaymentMethodRepository
 * Cubre: findActiveByUserId y deactivateById
 */
@DataJpaTest
@ActiveProfiles("test")
class PaymentMethodRepositoryTest {

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Arrange: Limpiar datos y crear usuario de prueba
        paymentMethodRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        // Crear rol básico
        Role role = new Role();
        role.setName("ROLE_CLIENT");
        role = roleRepository.save(role);

        // Crear usuario
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPassword("password123");
        testUser.setFullName("Test User");
        testUser.getRoles().add(role);
        testUser = userRepository.save(testUser);
    }

    @Test
    void testFindActiveByUserId_ReturnsOnlyActivePaymentMethods() {
        // Arrange: Crear métodos de pago activos e inactivos
        PaymentMethod active1 = createPaymentMethod(testUser, "VISA", "1234", true);
        PaymentMethod active2 = createPaymentMethod(testUser, "MASTERCARD", "5678", true);
        PaymentMethod inactive = createPaymentMethod(testUser, "AMEX", "9012", false);

        paymentMethodRepository.saveAll(List.of(active1, active2, inactive));
        entityManager.flush();

        // Act: Buscar solo activos
        List<PaymentMethod> activeMethods = paymentMethodRepository.findActiveByUserId(testUser.getUserId());

        // Assert: Verificar que solo retorna los activos
        assertThat(activeMethods).hasSize(2);
        assertThat(activeMethods).extracting(PaymentMethod::getType)
                .containsExactlyInAnyOrder("VISA", "MASTERCARD");
        assertThat(activeMethods).allMatch(PaymentMethod::getActive);
    }

    @Test
    void testFindActiveByUserId_EmptyWhenNoActiveMethods() {
        // Arrange: Crear solo métodos inactivos
        PaymentMethod inactive1 = createPaymentMethod(testUser, "VISA", "1111", false);
        PaymentMethod inactive2 = createPaymentMethod(testUser, "MASTERCARD", "2222", false);
        paymentMethodRepository.saveAll(List.of(inactive1, inactive2));

        // Act: Buscar activos
        List<PaymentMethod> activeMethods = paymentMethodRepository.findActiveByUserId(testUser.getUserId());

        // Assert: No debe encontrar ninguno
        assertThat(activeMethods).isEmpty();
    }

    @Test
    void testFindActiveByUserId_EmptyWhenUserHasNoMethods() {
        // Act: Buscar para usuario sin métodos de pago
        List<PaymentMethod> activeMethods = paymentMethodRepository.findActiveByUserId(testUser.getUserId());

        // Assert: Lista vacía
        assertThat(activeMethods).isEmpty();
    }

    @Test
    void testDeactivateById_Success() {
        // Arrange: Crear método de pago activo
        PaymentMethod active = createPaymentMethod(testUser, "VISA", "4444", true);
        PaymentMethod saved = paymentMethodRepository.save(active);
        entityManager.flush();
        entityManager.clear();

        // Act: Desactivar
        paymentMethodRepository.deactivateById(saved.getPaymentMethodId());
        entityManager.flush();
        entityManager.clear();

        // Assert: Verificar que está inactivo
        PaymentMethod updated = paymentMethodRepository.findById(saved.getPaymentMethodId()).orElseThrow();
        assertThat(updated.getActive()).isFalse();
    }

    @Test
    void testDeactivateById_MultipleMethodsPreserved() {
        // Arrange: Crear múltiples métodos de pago
        PaymentMethod method1 = createPaymentMethod(testUser, "VISA", "1111", true);
        PaymentMethod method2 = createPaymentMethod(testUser, "MASTERCARD", "2222", true);
        PaymentMethod method3 = createPaymentMethod(testUser, "AMEX", "3333", true);

        method1 = paymentMethodRepository.save(method1);
        method2 = paymentMethodRepository.save(method2);
        method3 = paymentMethodRepository.save(method3);
        entityManager.flush();

        // Act: Desactivar solo uno
        paymentMethodRepository.deactivateById(method2.getPaymentMethodId());
        entityManager.flush();
        entityManager.clear();

        // Assert: Verificar que solo se desactivó el indicado
        List<PaymentMethod> all = paymentMethodRepository.findAll();
        assertThat(all).hasSize(3);

        PaymentMethod m1 = paymentMethodRepository.findById(method1.getPaymentMethodId()).orElseThrow();
        PaymentMethod m2 = paymentMethodRepository.findById(method2.getPaymentMethodId()).orElseThrow();
        PaymentMethod m3 = paymentMethodRepository.findById(method3.getPaymentMethodId()).orElseThrow();

        assertThat(m1.getActive()).isTrue();
        assertThat(m2.getActive()).isFalse();
        assertThat(m3.getActive()).isTrue();
    }

    @Test
    void testFindByUserId_ReturnsAllRegardlessOfActive() {
        // Arrange: Crear métodos activos e inactivos
        PaymentMethod active = createPaymentMethod(testUser, "VISA", "1234", true);
        PaymentMethod inactive = createPaymentMethod(testUser, "MASTERCARD", "5678", false);
        paymentMethodRepository.saveAll(List.of(active, inactive));

        // Act: Buscar todos por userId
        List<PaymentMethod> all = paymentMethodRepository.findByUserId_UserId(testUser.getUserId());

        // Assert: Debe retornar ambos (activos e inactivos)
        assertThat(all).hasSize(2);
        assertThat(all).extracting(PaymentMethod::getType)
                .containsExactlyInAnyOrder("VISA", "MASTERCARD");
    }

    // Helper method para crear PaymentMethod
    private PaymentMethod createPaymentMethod(User user, String type, String last4, boolean active) {
        PaymentMethod pm = new PaymentMethod();
        pm.setUserId(user);
        pm.setType(type);
        pm.setLastfour(last4);
        pm.setHolderName(user.getFullName());
        pm.setBillingAddress("Test Address");
        pm.setActive(active);
        return pm;
    }
}
