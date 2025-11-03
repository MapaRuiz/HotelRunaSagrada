package com.runasagrada.hotelapi.infrastructure.telegram;

/**
 * Constants for Telegram Bot Service.
 * Centralizes all magic strings and configuration values.
 */
public final class TelegramBotConstants {

    private TelegramBotConstants() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    // Message limits
    public static final int MAX_MESSAGE_LENGTH = 4000;
    public static final int MAX_SERVICES_DISPLAYED = 6;

    // Commands
    public static final String CMD_START = "/start";
    public static final String CMD_HELP = "/help";
    public static final String CMD_MIS_RESERVAS = "/mis_reservas";
    public static final String CMD_RESERVAS = "/reservas";
    public static final String CMD_DISPONIBILIDAD = "/disponibilidad";
    public static final String CMD_HOTEL = "/hotel";
    public static final String CMD_TIPO_HABITACION = "/tipo_habitacion";
    public static final String CMD_HABITACION = "/habitacion";
    public static final String CMD_SERVICIO = "/servicio";
    public static final String CMD_SERVICIOS = "/servicios";

    // Callback data
    public static final String CALLBACK_MIS_RESERVAS = "mis_reservas";
    public static final String CALLBACK_HOTELES = "hoteles";

    // Roles
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_OPERATOR = "OPERATOR";
    public static final String ROLE_CLIENT = "CLIENT";

    // Role display names
    public static final String ROLE_DISPLAY_ADMIN = "Administrador";
    public static final String ROLE_DISPLAY_OPERATOR = "Operador";
    public static final String ROLE_DISPLAY_CLIENT = "Cliente";
    public static final String ROLE_DISPLAY_USER = "Usuario";

    // Error messages
    public static final String ERROR_GENERIC = "❌ Ocurrió un error. Por favor intenta de nuevo.";
    public static final String ERROR_COMMAND_UNKNOWN = "Comando no reconocido. Usa /help para ver los comandos disponibles.";
    public static final String ERROR_LINK_REQUIRED = "Por favor vincula tu cuenta primero con /start";
    public static final String ERROR_NO_PERMISSIONS = "❌ No tienes permisos para este comando.";
    public static final String ERROR_HOTEL_NOT_FOUND = "❌ Hotel no encontrado.";
    public static final String ERROR_ROOM_NOT_FOUND = "❌ Habitación no encontrada.";
    public static final String ERROR_SERVICE_NOT_FOUND = "❌ Servicio no encontrado.";
    public static final String ERROR_INVALID_DATES = "❌ Las fechas son inválidas. La fecha de check-in debe ser anterior al check-out.";
    public static final String ERROR_INVALID_NUMBER = "❌ Los IDs deben ser números válidos.";
    public static final String ERROR_NO_HOTEL_ASSIGNMENT = "❌ No se encontró tu asignación de hotel. Contacta al administrador.";

    // Info messages
    public static final String INFO_NO_MESSAGE_UNDERSTAND = "No entiendo ese mensaje. Usa /help para ver los comandos disponibles.";
    public static final String INFO_NO_RESERVATIONS = "📭 No hay reservas registradas.";
    public static final String INFO_NO_HOTELS = "📭 No hay hoteles registrados.";
    public static final String INFO_NO_SERVICES = "📭 No hay servicios registrados.";
}
