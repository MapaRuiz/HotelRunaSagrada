package com.runasagrada.hotelapi.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "telegram")
@Data
public class TelegramProperties {
    private String botToken;
    private String botUsername;
    private String webhookPath;
    private String secretToken;
}
