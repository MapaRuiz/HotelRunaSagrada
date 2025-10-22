package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNationalId(String nationalId);

    @Query("""
                SELECT COUNT(DISTINCT u)
                FROM User u
                JOIN u.roles r
                WHERE r.name = 'CLIENT'
                  AND u.createdAt BETWEEN :start AND :end
            """)
    long countByCreatedAtBetween(Instant start, Instant end);
}
