package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.TelegramLink;
import com.runasagrada.hotelapi.repository.TelegramLinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Implementation of TelegramLinkService for managing Telegram user links.
 * 
 * This service handles the persistence and retrieval of associations between
 * Telegram chat IDs and system users, enabling Telegram-based interaction.
 * 
 * @author Hotel Runa Sagrada Team
 * @version 2.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TelegramLinkServiceImpl implements TelegramLinkService {

    // ==================== Dependencies ====================

    private final TelegramLinkRepository telegramLinkRepository;

    // ==================== Query Methods ====================

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<TelegramLink> findByChatId(Long chatId) {
        log.debug("Finding Telegram link for chat ID: {}", chatId);
        return telegramLinkRepository.findByChatId(chatId);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<TelegramLink> findByUserId(Integer userId) {
        log.debug("Finding Telegram link for user ID: {}", userId);
        return telegramLinkRepository.findByUserId(userId);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public boolean existsByChatId(Long chatId) {
        log.debug("Checking if Telegram link exists for chat ID: {}", chatId);
        return telegramLinkRepository.existsByChatId(chatId);
    }

    // ==================== Modification Methods ====================

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public TelegramLink createLink(Long chatId, Integer userId) {
        log.info("Creating new Telegram link: chatId={}, userId={}", chatId, userId);

        TelegramLink link = new TelegramLink();
        link.setChatId(chatId);
        link.setUserId(userId);
        link.setLinkedAt(Instant.now());
        link.setLastSeenAt(Instant.now());

        TelegramLink savedLink = telegramLinkRepository.save(link);
        log.info("Successfully created Telegram link with ID: {}", savedLink.getId());

        return savedLink;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public TelegramLink updateLastSeen(Long chatId) {
        log.debug("Updating last seen timestamp for chat ID: {}", chatId);

        Optional<TelegramLink> linkOpt = telegramLinkRepository.findByChatId(chatId);
        if (linkOpt.isEmpty()) {
            log.warn("No Telegram link found for chat ID: {}", chatId);
            return null;
        }

        TelegramLink link = linkOpt.get();
        link.setLastSeenAt(Instant.now());

        return telegramLinkRepository.save(link);
    }
}
