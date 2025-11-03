package com.runasagrada.hotelapi.config;

import com.runasagrada.hotelapi.infrastructure.telegram.TelegramBotService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;

/**
 * Configuration class for initializing and registering the Telegram bot.
 * 
 * This configuration is responsible for:
 * <ul>
 * <li>Creating the TelegramBotsApi instance with DefaultBotSession</li>
 * <li>Registering the TelegramBotService to receive updates via Long
 * Polling</li>
 * <li>Logging initialization status and potential errors</li>
 * </ul>
 * 
 * The bot will start listening for messages as soon as this bean is
 * initialized.
 * 
 * @author Hotel Runa Sagrada Team
 * @version 2.0
 * @see TelegramBotService
 */
@Configuration
@Slf4j
public class TelegramBotConfig {

    // ==================== Bot API Initialization ====================

    /**
     * Initializes the Telegram Bot API and registers the bot service.
     * This bean is created automatically when Spring Boot starts.
     * 
     * The registration process:
     * 1. Creates a new TelegramBotsApi instance with DefaultBotSession (Long
     * Polling mode)
     * 2. Registers the TelegramBotService to start receiving updates
     * 3. Logs success or failure messages
     * 
     * @param telegramBotService The bot service to register (injected by Spring)
     * @return The initialized TelegramBotsApi instance, or null if initialization
     *         failed
     * @throws TelegramApiException if bot registration fails (caught and logged)
     */
    @Bean
    public TelegramBotsApi telegramBotsApi(TelegramBotService telegramBotService) {
        TelegramBotsApi botsApi = null;

        try {
            log.info("Initializing Telegram Bot API...");
            botsApi = new TelegramBotsApi(DefaultBotSession.class);

            log.info("Registering bot: {}", telegramBotService.getBotUsername());
            botsApi.registerBot(telegramBotService);

            log.info("✓ Telegram bot registered successfully: {}", telegramBotService.getBotUsername());
            log.info("✓ Bot is ready to receive messages via Long Polling");

        } catch (TelegramApiException e) {
            log.error("✗ Failed to initialize Telegram bot", e);
            log.error("Please verify your bot token is valid: telegram.bot-token in application.properties");
            log.error("Get your token from @BotFather on Telegram");
        }

        return botsApi;
    }
}
