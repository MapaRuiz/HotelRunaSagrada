package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Role;
import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.repository.ReservationRepository;
import com.runasagrada.hotelapi.repository.RoleRepository;
import com.runasagrada.hotelapi.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

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
    public void delete(Integer id) {
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
}
