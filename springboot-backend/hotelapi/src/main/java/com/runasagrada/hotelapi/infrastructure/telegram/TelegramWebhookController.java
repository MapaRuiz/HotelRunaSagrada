package com.runasagrada.hotelapi.infrastructure.telegram;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.telegram.telegrambots.meta.api.objects.Update;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("${telegram.webhook-path:/api/telegram/webhook}")
@Slf4j
public class TelegramWebhookController {

    @Value("${telegram.secret-token:}")
    private String secretToken;

    @Autowired
    private TelegramBotService telegramBotService;

    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestHeader(value = "X-Telegram-Bot-Api-Secret-Token", required = false) String receivedToken,
            @RequestBody Update update) {

        log.info("Webhook received: {}", update);

        // Validar secret token si está configurado
        if (secretToken != null && !secretToken.isEmpty()) {
            if (receivedToken == null || !receivedToken.equals(secretToken)) {
                log.warn("Invalid secret token received");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }
        }

        try {
            // Procesar update de forma asíncrona para no bloquear
            telegramBotService.onUpdateReceived(update);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error");
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Bot is running");
    }
}
