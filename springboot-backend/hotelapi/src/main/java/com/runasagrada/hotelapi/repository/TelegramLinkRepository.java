package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.TelegramLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TelegramLinkRepository extends JpaRepository<TelegramLink, Long> {

    Optional<TelegramLink> findByChatId(Long chatId);

    Optional<TelegramLink> findByUserId(Integer userId);

    boolean existsByChatId(Long chatId);
}
