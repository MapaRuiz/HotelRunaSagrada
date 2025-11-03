package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "telegram_links", indexes = {
        @Index(name = "idx_chat_id", columnList = "chatId"),
        @Index(name = "idx_user_id", columnList = "userId")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class TelegramLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long chatId;

    @Column(nullable = false)
    private Integer userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "userId", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password" })
    private User user;

    private Instant linkedAt = Instant.now();

    private Instant lastSeenAt = Instant.now();
}
