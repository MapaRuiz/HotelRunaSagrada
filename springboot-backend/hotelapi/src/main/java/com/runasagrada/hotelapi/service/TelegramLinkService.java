package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.TelegramLink;
import java.util.Optional;

/**
 * Service interface for managing Telegram user links.
 * 
 * This service handles the association between Telegram chat IDs and system
 * users,
 * allowing users to interact with the hotel system through Telegram.
 * 
 * @author Hotel Runa Sagrada Team
 * @version 2.0
 */
public interface TelegramLinkService {

    /**
     * Finds a Telegram link by chat ID.
     * 
     * @param chatId The Telegram chat ID
     * @return Optional containing the link if found, empty otherwise
     */
    Optional<TelegramLink> findByChatId(Long chatId);

    /**
     * Finds a Telegram link by user ID.
     * 
     * @param userId The system user ID
     * @return Optional containing the link if found, empty otherwise
     */
    Optional<TelegramLink> findByUserId(Integer userId);

    /**
     * Checks if a link exists for the given chat ID.
     * 
     * @param chatId The Telegram chat ID
     * @return true if a link exists, false otherwise
     */
    boolean existsByChatId(Long chatId);

    /**
     * Creates a new link between a Telegram chat and a system user.
     * 
     * @param chatId The Telegram chat ID
     * @param userId The system user ID
     * @return The created TelegramLink
     */
    TelegramLink createLink(Long chatId, Integer userId);

    /**
     * Updates the last seen timestamp for a chat.
     * 
     * @param chatId The Telegram chat ID
     * @return The updated TelegramLink, or null if not found
     */
    TelegramLink updateLastSeen(Long chatId);
}
