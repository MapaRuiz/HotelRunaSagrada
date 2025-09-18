package com.runasagrada.hotelapi.model;

import com.runasagrada.hotelapi.repository.RoleRepository;
import com.runasagrada.hotelapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.IntStream;

@Component
@RequiredArgsConstructor
public class DatabaseInit implements CommandLineRunner {

    private final RoleRepository roleRepo;
    private final UserRepository userRepo;

    @Override
    public void run(String... args) {

        // --- Roles base ---
        Role adminRole = roleRepo.findByName("ADMIN").orElseGet(() -> roleRepo.save(new Role(null, "ADMIN")));
        Role operatorRole = roleRepo.findByName("OPERATOR").orElseGet(() -> roleRepo.save(new Role(null, "OPERATOR")));
        Role clientRole = roleRepo.findByName("CLIENT").orElseGet(() -> roleRepo.save(new Role(null, "CLIENT")));

        // --- 1 Admin ---
        userRepo.findByEmail("admin@hotel.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("admin@hotel.com");
            u.setPassword("admin123");
            u.setFullName("Admin");
            u.setPhone("3000000000");
            u.setNationalId("CC-ADMIN-001");
            u.setSelectedPet("/images/icons/icono1.png");
            u.setRoles(Set.of(adminRole));
            return userRepo.save(u);
        });

        // --- 5 Operadores (op1…op5) ---
        IntStream.rangeClosed(1, 5).forEach(i -> {
            String email = "op" + i + "@hotel.com";
            userRepo.findByEmail(email).orElseGet(() -> {
                User u = new User();
                u.setEmail(email);
                u.setPassword("op123");
                u.setFullName("Operador Hotel " + i);
                u.setPhone("301000000" + i);
                u.setNationalId("OP-" + String.format("%03d", i));
                u.setSelectedPet(pickIcon(i)); // solo 3 iconos
                u.setRoles(Set.of(operatorRole));
                return userRepo.save(u);
            });
        });

        // --- 10 Clientes (client01…client10) ---
        IntStream.rangeClosed(1, 10).forEach(i -> {
            String email = "client" + String.format("%02d", i) + "@demo.com";
            userRepo.findByEmail(email).orElseGet(() -> {
                User u = new User();
                u.setEmail(email);
                u.setPassword("client123");
                u.setFullName("Cliente " + String.format("%02d", i));
                u.setPhone("30200000" + String.format("%02d", i));
                u.setNationalId("CLI-" + String.format("%04d", i));
                u.setSelectedPet(pickIcon(i)); // solo 3 iconos
                u.setRoles(Set.of(clientRole));
                return userRepo.save(u);
            });
        });
    }

    private String pickIcon(int i) {
        // rota entre 3 íconos disponibles
        int mod = i % 3;
        return switch (mod) {
            case 1 -> "/images/icons/icono1.png";
            case 2 -> "/images/icons/icono2.png";
            default -> "/images/icons/icono3.png";
        };
    }
}
