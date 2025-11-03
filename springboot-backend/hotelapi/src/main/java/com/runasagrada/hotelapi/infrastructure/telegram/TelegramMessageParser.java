package com.runasagrada.hotelapi.infrastructure.telegram;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parser for Telegram bot messages and commands.
 * Handles command extraction, parameter parsing, and date validation.
 * 
 * This class centralizes all message parsing logic to keep the main bot service
 * clean.
 * 
 * @author Hotel Runa Sagrada Team
 * @version 2.0
 */
@Component
public class TelegramMessageParser {

    // ==================== Constants ====================

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Regex patterns for command parsing
    private static final Pattern DISPONIBILIDAD_PATTERN = Pattern
            .compile("/disponibilidad\\s+(\\d{4}-\\d{2}-\\d{2})\\s+(\\d{4}-\\d{2}-\\d{2})");

    private static final Pattern HOTEL_PATTERN = Pattern.compile("/hotel[\\s]+(\\d+)");

    private static final Pattern HABITACION_PATTERN = Pattern.compile("/habitacion\\s+(\\d+)");

    private static final Pattern SERVICIO_PATTERN = Pattern.compile("/servicio\\s+(\\d+)");

    // ==================== Command Detection ====================

    /**
     * Checks if the given text is a command (starts with /).
     * 
     * @param text Text to check
     * @return true if text is a command, false otherwise
     */
    public boolean isCommand(String text) {
        return text != null && text.startsWith("/");
    }

    /**
     * Extracts the command from the text (e.g., "/hotel 123" returns "/hotel").
     * 
     * @param text Text containing the command
     * @return The command string in lowercase, or null if not a command
     */
    public String extractCommand(String text) {
        if (!isCommand(text)) {
            return null;
        }

        int spaceIndex = text.indexOf(' ');
        if (spaceIndex > 0) {
            return text.substring(0, spaceIndex).toLowerCase();
        }

        return text.toLowerCase();
    }

    // ==================== Command Parsers ====================

    /**
     * Parses the /disponibilidad command to extract check-in and check-out dates.
     * Expected format: /disponibilidad YYYY-MM-DD YYYY-MM-DD
     * 
     * @param text Command text
     * @return Map with "checkIn" and "checkOut" keys, or null if format is invalid
     */
    public Map<String, String> parseDisponibilidadCommand(String text) {
        Matcher matcher = DISPONIBILIDAD_PATTERN.matcher(text);
        if (matcher.find()) {
            Map<String, String> result = new HashMap<>();
            result.put("checkIn", matcher.group(1));
            result.put("checkOut", matcher.group(2));
            return result;
        }
        return null;
    }

    /**
     * Parses the /hotel command to extract hotel ID.
     * Expected format: /hotel <id>
     * 
     * @param text Command text
     * @return Hotel ID, or null if format is invalid
     */
    public Long parseHotelCommand(String text) {
        Matcher matcher = HOTEL_PATTERN.matcher(text);
        if (matcher.find()) {
            try {
                return Long.parseLong(matcher.group(1));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Parses the /habitacion command to extract room ID.
     * Expected format: /habitacion <id>
     * 
     * @param text Command text
     * @return Room ID, or null if format is invalid
     */
    public Integer parseHabitacionCommand(String text) {
        Matcher matcher = HABITACION_PATTERN.matcher(text);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Parses the /servicio command to extract service ID.
     * Expected format: /servicio <id>
     * 
     * @param text Command text
     * @return Service ID, or null if format is invalid
     */
    public Long parseServicioCommand(String text) {
        Matcher matcher = SERVICIO_PATTERN.matcher(text);
        if (matcher.find()) {
            try {
                return Long.parseLong(matcher.group(1));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    // ==================== Date Utilities ====================

    /**
     * Parses a date string in YYYY-MM-DD format.
     * 
     * @param dateStr Date string to parse
     * @return LocalDate object, or null if parsing fails
     */
    public LocalDate parseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr, DATE_FORMAT);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /**
     * Validates that check-in date is before check-out date.
     * 
     * @param checkIn  Check-in date
     * @param checkOut Check-out date
     * @return true if date range is valid, false otherwise
     */
    public boolean isValidDateRange(LocalDate checkIn, LocalDate checkOut) {
        return checkIn != null && checkOut != null && checkIn.isBefore(checkOut);
    }

    // ==================== Markdown Formatters ====================

    /**
     * Formats text as bold in Markdown.
     * 
     * @param text Text to format
     * @return Bold formatted text
     */
    public String formatBold(String text) {
        return "*" + text + "*";
    }

    /**
     * Formats text as italic in Markdown.
     * 
     * @param text Text to format
     * @return Italic formatted text
     */
    public String formatItalic(String text) {
        return "_" + text + "_";
    }

    /**
     * Formats text as code in Markdown.
     * 
     * @param text Text to format
     * @return Code formatted text
     */
    public String formatCode(String text) {
        return "`" + text + "`";
    }
}
