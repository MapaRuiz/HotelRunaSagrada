package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Role;
import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.repository.ReservationRepository;
import com.runasagrada.hotelapi.repository.RoleRepository;
import com.runasagrada.hotelapi.repository.UserRepository;
import com.runasagrada.hotelapi.repository.StaffMemberRepository;
import com.runasagrada.hotelapi.repository.PaymentMethodRepository;
import com.runasagrada.hotelapi.repository.PaymentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository users;
    @Autowired
    private RoleRepository roles;
    @Autowired
    private ServiceHelper helper;
    @Autowired
    private ReservationRepository reservationRepo;
    @Autowired
    private ReservationService reservationService;
    @Autowired
    private StaffMemberRepository staffMemberRepo;
    @Autowired
    private PaymentMethodRepository paymentMethodRepo;
    @Autowired
    private PaymentRepository paymentRepo;

    @Override
    public User register(User u, String roleName) {
        if (users.existsByEmail(u.getEmail()))
            throw new IllegalArgumentException("email in use");
        Role r = roles.findByName(roleName == null ? "CLIENT" : roleName).orElseThrow();
        u.getRoles().add(r);
        helper.resyncIdentity("users", "user_id");
        return users.save(u);
    }

    @Override
    public User login(String email, String password) {
        User u = users.findByEmail(email).orElseThrow(() -> new SecurityException("invalid credentials"));
        if (!u.getPassword().equals(password))
            throw new SecurityException("invalid credentials");
        return u;
    }

    @Override
    public User me(Integer id) {
        return users.findById(id).orElseThrow();
    }

    @Override
    public User updateMe(Integer id, User p, boolean allowEmailChange) {
        User u = users.findById(id).orElseThrow();
        if (allowEmailChange && p.getEmail() != null)
            u.setEmail(p.getEmail());
        if (p.getFullName() != null)
            u.setFullName(p.getFullName());
        if (p.getPhone() != null)
            u.setPhone(p.getPhone());
        if (p.getNationalId() != null)
            u.setNationalId(p.getNationalId());
        if (p.getSelectedPet() != null)
            u.setSelectedPet(p.getSelectedPet());
        return users.save(u);
    }

    @Override
    public List<User> findAll() {
        return users.findAll(Sort.by(Sort.Direction.ASC, "userId"));
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        // Verificar que el usuario existe
        if (!users.existsById(id)) {
            throw new NoSuchElementException("User not found: " + id);
        }

        // 1. Eliminar staff members asociados al usuario
        var staffMembers = staffMemberRepo.findByUserId(id.longValue());
        if (staffMembers != null) {
            staffMemberRepo.delete(staffMembers);
        }

        // 2. Eliminar pagos asociados a los payment methods del usuario
        var paymentMethods = paymentMethodRepo.findByUserId_UserId(id);
        for (var paymentMethod : paymentMethods) {
            var payments = paymentRepo.findByPaymentMethodId_PaymentMethodId(paymentMethod.getPaymentMethodId());
            if (!payments.isEmpty()) {
                paymentRepo.deleteAll(payments);
            }
        }

        // 3. Eliminar payment methods del usuario
        if (!paymentMethods.isEmpty()) {
            paymentMethodRepo.deleteAll(paymentMethods);
        }

        // 4. Eliminar reservas del usuario (esto también limpia room locks y sus
        // payments)
        var reservations = reservationRepo.findByUserUserId(id);
        for (var reservation : reservations) {
            reservationService.delete(reservation.getReservationId());
        }

        // 5. Finalmente eliminar el usuario
        users.deleteById(id);
        helper.resyncIdentity("users", "user_id");
    }

    @Override
    public User updateByAdmin(Integer id, User p, List<String> roleNames) {
        User u = users.findById(id).orElseThrow(() -> new NoSuchElementException("User not found: " + id));

        if (p.getEmail() != null && !p.getEmail().equals(u.getEmail())) {
            if (users.existsByEmail(p.getEmail()))
                throw new IllegalArgumentException("Email already in use");
            u.setEmail(p.getEmail());
        }
        if (p.getPassword() != null && !p.getPassword().isBlank()) {
            u.setPassword(p.getPassword());
        }
        if (p.getFullName() != null)
            u.setFullName(p.getFullName());
        if (p.getPhone() != null)
            u.setPhone(p.getPhone());
        if (p.getNationalId() != null)
            u.setNationalId(p.getNationalId());
        if (p.getSelectedPet() != null)
            u.setSelectedPet(p.getSelectedPet());
        if (p.getEnabled() != null)
            u.setEnabled(p.getEnabled());

        if (roleNames != null) {
            Set<Role> newRoles = new HashSet<>();
            for (String rn : roleNames) {
                roles.findByName(rn).ifPresent(newRoles::add);
            }
            if (!newRoles.isEmpty())
                u.setRoles(newRoles);
        }

        return users.save(u);
    }

    public void deleteCascade(Integer id) {
        // 1) Borrar reservas del usuario (usa el service para que limpie RoomLocks)
        var reservas = reservationRepo.findByUserUserId(id);
        for (var r : reservas) {
            reservationService.delete(r.getReservationId());
        }
        // 2) Borrar el usuario
        users.deleteById(id);
        helper.resyncIdentity("users", "user_id");
    }

    public boolean existsByEmail(String email) {
        return users.existsByEmail(email);
    }

    public boolean existsByNationalId(String nationalId) {
        return users.existsByNationalId(nationalId);
    }

    @Override
    public User findById(Integer userId) {
        return users.findById(userId).orElseThrow();
    }

    @Override
    public double[] usersSummary() {
        ZoneId zone = ZoneId.systemDefault();

        YearMonth current = YearMonth.from(LocalDate.now(zone));
        YearMonth previous = current.minusMonths(1);

        Instant curStart = current.atDay(1).atStartOfDay(zone).toInstant();
        Instant curEnd = current.atEndOfMonth().atTime(23, 59, 59, 999_000_000).atZone(zone).toInstant();

        Instant prevStart = previous.atDay(1).atStartOfDay(zone).toInstant();
        Instant prevEnd = previous.atEndOfMonth().atTime(23, 59, 59, 999_000_000).atZone(zone).toInstant();

        long currentUsers = users.countByCreatedAtBetween(curStart, curEnd);
        long previousUsers = users.countByCreatedAtBetween(prevStart, prevEnd);

        double delta;
        if (previousUsers == 0) {
            delta = currentUsers > 0 ? 100.0 : 0.0;
        } else {
            delta = ((currentUsers - (double) previousUsers) / previousUsers) * 100.0;
        }

        delta = Math.round(delta * 10.0) / 10.0;

        return new double[] { currentUsers, delta };
    }
}
