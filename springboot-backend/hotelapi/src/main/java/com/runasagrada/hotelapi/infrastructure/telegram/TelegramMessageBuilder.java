package com.runasagrada.hotelapi.infrastructure.telegram;

import com.runasagrada.hotelapi.model.*;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * Builder class responsible for constructing formatted Telegram messages.
 * Separates message formatting logic from business logic.
 */
@Component
public class TelegramMessageBuilder {

    private static final String ERROR_PREFIX = "❌ ";
    private static final String SUCCESS_PREFIX = "✅ ";
    private static final String INFO_PREFIX = "ℹ️ ";
    private static final int MAX_DISPLAYED_SERVICES = 6;

    public String buildWelcomeMessage(String fullName) {
        return "¡Bienvenido al Bot de Hotel Runa Sagrada! 🏨\n\n" +
                "Para comenzar, por favor envíame tu *National ID* (cédula) para vincular tu cuenta.";
    }

    public String buildSuccessfulLinkMessage(User user, String roleName) {
        return SUCCESS_PREFIX + "¡Vinculación exitosa!\n\n" +
                "📋 *Perfil:*\n" +
                "Nombre: " + user.getFullName() + "\n" +
                "Email: " + user.getEmail() + "\n" +
                "Rol: " + roleName + "\n\n" +
                "Usa /help para ver los comandos disponibles.";
    }

    public String buildLinkFailureMessage() {
        return ERROR_PREFIX + "No encontré tu National ID en nuestro sistema.\n\n" +
                "Por favor verifica e intenta de nuevo, o contacta con recepción.";
    }

    public String buildGreetingMessage(String fullName, String roleName) {
        return "¡Hola " + fullName + "! 👋\n\n" +
                "Tu rol es: *" + roleName + "*\n\n" +
                "Usa /help para ver todos los comandos disponibles.";
    }

    public String buildHelpMessage(User user, String roleName) {
        StringBuilder help = new StringBuilder();

        help.append("📖 *Ayuda - Hotel Runa Sagrada Bot*\n\n");
        help.append("Tu rol: ").append(roleName).append("\n\n");
        help.append("*Comandos disponibles:*\n\n");

        appendRoleSpecificCommands(help, user);
        appendCommonCommands(help);

        return help.toString();
    }

    private void appendRoleSpecificCommands(StringBuilder help, User user) {
        if (hasRole(user, "CLIENT")) {
            help.append("🏨 `/mis_reservas` - Ver tus reservas\n\n");
        }

        if (hasRole(user, "ADMIN")) {
            help.append("🏨 `/reservas` - Ver todas las reservas\n\n");
        } else if (hasRole(user, "OPERATOR")) {
            help.append("🏨 `/reservas` - Ver reservas de tu hotel\n\n");
        }
    }

    private void appendCommonCommands(StringBuilder help) {
        help.append("📅 `/disponibilidad <fecha-in> <fecha-out>`\n");
        help.append("   Consulta habitaciones disponibles entre fechas\n");
        help.append("   Ejemplo: `/disponibilidad 2025-11-12 2025-11-14`\n\n");

        help.append("🏢 `/hotel <id>` - Ver información completa de un hotel\n");
        help.append("   Muestra amenidades, tipos de habitación disponibles y servicios\n");
        help.append("   Ejemplo: `/hotel 1`\n\n");

        help.append("🛏️ `/tipo_habitacion <tipo_id> <hotel_id>`\n");
        help.append("   Ver habitaciones de un tipo específico en un hotel\n");
        help.append("   Ejemplo: `/tipo_habitacion 1 1`\n\n");

        help.append("🚪 `/habitacion <id>` - Ver detalles y disponibilidad\n");
        help.append("   Muestra info completa, reservas futuras y disponibilidad\n");
        help.append("   Ejemplo: `/habitacion 5`\n\n");

        help.append("🎯 `/servicio <id>` - Ver detalles de un servicio\n");
        help.append("   Muestra categoría, precio, duración y más\n");
        help.append("   Ejemplo: `/servicio 3`\n\n");

        help.append("📋 `/servicios [hotel_id]` - Listar servicios\n");
        help.append("   Sin hotel_id: todos los servicios\n");
        help.append("   Con hotel_id: servicios del hotel específico\n");
        help.append("   Ejemplos: `/servicios` o `/servicios 1`\n\n");

        help.append("❓ `/help` - Mostrar esta ayuda");
    }

    public String buildReservationsList(List<Reservation> reservations, String title) {
        if (reservations.isEmpty()) {
            return "📭 No hay reservas registradas.";
        }

        StringBuilder msg = new StringBuilder();
        msg.append("🏨 *").append(title).append("*\n\n");

        reservations.forEach(res -> msg.append(formatReservation(res)).append("\n"));

        return msg.toString();
    }

    public String buildAvailabilityMessage(LocalDate checkIn, LocalDate checkOut, Map<String, Integer> availability) {
        StringBuilder msg = new StringBuilder();
        msg.append("📅 *Disponibilidad*\n");
        msg.append("Check-in: ").append(checkIn).append("\n");
        msg.append("Check-out: ").append(checkOut).append("\n\n");

        if (availability.isEmpty()) {
            msg.append(ERROR_PREFIX).append("No hay habitaciones disponibles para estas fechas.");
        } else {
            msg.append(SUCCESS_PREFIX).append("*Habitaciones disponibles por tipo:*\n\n");
            availability.forEach(
                    (roomType, count) -> msg.append("• ").append(roomType).append(": ").append(count).append("\n"));
        }

        return msg.toString();
    }

    public String buildHotelDetailsMessage(Hotel hotel, Map<Integer, RoomType> roomTypeMap,
            Map<Integer, List<Room>> roomsByTypeId,
            List<ServiceOffering> hotelServices,
            long totalServices) {
        StringBuilder msg = new StringBuilder();

        appendHotelBasicInfo(msg, hotel);
        appendHotelAmenities(msg, hotel);
        appendRoomTypes(msg, roomTypeMap, roomsByTypeId, hotel.getHotelId());
        appendHotelServices(msg, hotelServices, totalServices, hotel.getHotelId());

        return msg.toString();
    }

    private void appendHotelBasicInfo(StringBuilder msg, Hotel hotel) {
        msg.append("🏨 *").append(hotel.getName()).append("*\n\n");

        if (hotel.getDescription() != null) {
            msg.append("📝 ").append(hotel.getDescription()).append("\n\n");
        }

        if (hotel.getCheckInAfter() != null) {
            msg.append("🕐 Check-in: después de ").append(hotel.getCheckInAfter()).append("\n");
        }
        if (hotel.getCheckOutBefore() != null) {
            msg.append("🕐 Check-out: antes de ").append(hotel.getCheckOutBefore()).append("\n\n");
        }
    }

    private void appendHotelAmenities(StringBuilder msg, Hotel hotel) {
        if (hotel.getAmenities() != null && !hotel.getAmenities().isEmpty()) {
            msg.append("✨ *Amenidades del Hotel:*\n");
            hotel.getAmenities().forEach(amenity -> msg.append("• ").append(amenity.getName()).append("\n"));
            msg.append("\n");
        }
    }

    private void appendRoomTypes(StringBuilder msg, Map<Integer, RoomType> roomTypeMap,
            Map<Integer, List<Room>> roomsByTypeId, Long hotelId) {
        if (roomTypeMap.isEmpty()) {
            return;
        }

        msg.append("🛏️ *Tipos de Habitación:*\n\n");

        roomTypeMap.values().forEach(roomType -> {
            List<Room> rooms = roomsByTypeId.getOrDefault(roomType.getRoomTypeId(), List.of());
            if (rooms.isEmpty())
                return;

            long availableCount = rooms.stream()
                    .filter(r -> r.getResStatus() == Room.ReservationStatus.AVAILABLE)
                    .count();

            msg.append("📌 *").append(roomType.getName()).append("*\n");
            msg.append("   💰 Desde $").append(String.format("%,.0f", roomType.getBasePrice())).append(" COP/noche\n");
            msg.append("   👥 Capacidad: ").append(roomType.getCapacity()).append(" personas\n");
            msg.append("   🏠 Total: ").append(rooms.size())
                    .append(" habitaciones (").append(availableCount).append(" disponibles)\n");
            msg.append("   👉 Ver habitaciones: `/tipo\\_habitacion ").append(roomType.getRoomTypeId())
                    .append(" ").append(hotelId).append("`\n\n");
        });
    }

    private void appendHotelServices(StringBuilder msg, List<ServiceOffering> services,
            long totalServices, Long hotelId) {
        if (services.isEmpty()) {
            return;
        }

        msg.append("🎯 *Servicios Destacados:*\n\n");

        services.forEach(service -> {
            msg.append("📌 *").append(service.getName()).append("*\n");
            msg.append("   📂 ").append(service.getCategory());

            if (service.getSubcategory() != null && !service.getSubcategory().isEmpty()) {
                msg.append(" › ").append(service.getSubcategory());
            }

            msg.append("\n");
            msg.append("   💰 $").append(String.format("%,.0f", service.getBasePrice())).append(" COP\n");
            msg.append("   ⏱️ Duración: ").append(service.getDurationMinutes()).append(" min\n");
            msg.append("   👉 Ver detalles: `/servicio ").append(service.getId()).append("`\n\n");
        });

        if (totalServices > MAX_DISPLAYED_SERVICES) {
            msg.append("💡 ").append(totalServices - MAX_DISPLAYED_SERVICES).append(" servicios más disponibles.\n");
            msg.append("📋 Usa `/servicios ").append(hotelId).append("` para ver todos\n");
        }
    }

    public String buildRoomDetailsMessage(Room room, List<RoomLock> futureLocks) {
        StringBuilder msg = new StringBuilder();

        appendRoomBasicInfo(msg, room);
        appendRoomStatus(msg, room);
        appendRoomAvailability(msg, room.getRoomId(), futureLocks);

        return msg.toString();
    }

    private void appendRoomBasicInfo(StringBuilder msg, Room room) {
        msg.append("🛏️ *Habitación #").append(room.getNumber()).append("*\n\n");

        if (room.getHotel() != null) {
            msg.append("🏨 Hotel: ").append(room.getHotel().getName()).append("\n\n");
        }

        RoomType roomType = room.getRoomType();
        if (roomType != null) {
            msg.append("📋 *Tipo:* ").append(roomType.getName()).append("\n");
            msg.append("👥 Capacidad: ").append(roomType.getCapacity()).append(" personas\n");
            msg.append("💰 Precio base: $").append(String.format("%,.0f", roomType.getBasePrice()))
                    .append(" COP/noche\n\n");

            if (roomType.getDescription() != null && !roomType.getDescription().isEmpty()) {
                msg.append("📝 ").append(roomType.getDescription()).append("\n\n");
            }
        }

        msg.append("📍 Piso: ").append(room.getFloor()).append("\n");

        if (room.getThemeName() != null && !room.getThemeName().isEmpty()) {
            msg.append("🎨 Tema: ").append(room.getThemeName()).append("\n");
        }
    }

    private void appendRoomStatus(StringBuilder msg, Room room) {
        RoomStatusInfo statusInfo = getRoomStatusInfo(room.getResStatus());

        msg.append("📊 Estado: ").append(statusInfo.icon()).append(" ").append(statusInfo.text()).append("\n");
        msg.append("🧹 Limpieza: ").append(
                room.getCleStatus() == Room.CleaningStatus.CLEAN ? "Limpia ✨" : "Por limpiar 🧺").append("\n\n");
    }

    private void appendRoomAvailability(StringBuilder msg, Integer roomId, List<RoomLock> futureLocks) {
        if (futureLocks.isEmpty()) {
            msg.append("📅 *Disponibilidad:*\n");
            msg.append(SUCCESS_PREFIX).append("¡Disponible para reservar! No hay reservas futuras.\n\n");
            return;
        }

        msg.append("📅 *Reservas Futuras:*\n\n");

        futureLocks.stream()
                .filter(lock -> lock.getReservation() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        lock -> lock.getReservation().getReservationId(),
                        java.util.LinkedHashMap::new,
                        java.util.stream.Collectors.toList()))
                .forEach((reservationId, locks) -> {
                    Reservation res = locks.get(0).getReservation();
                    appendReservationDetails(msg, res);
                });

        msg.append("💡 Días ocupados: ").append(futureLocks.size()).append("\n\n");
        msg.append("📊 *Consultar disponibilidad específica:*\n");
        msg.append("`/disponibilidad `_`YYYY-MM-DD YYYY-MM-DD`_\n");
        msg.append("Ejemplo: `/disponibilidad 2025-11-10 2025-11-15`");
    }

    private void appendReservationDetails(StringBuilder msg, Reservation res) {
        msg.append("🔒 *Reserva #").append(res.getReservationId()).append("*\n");
        msg.append("   📆 Check-in: ").append(res.getCheckIn()).append("\n");
        msg.append("   📆 Check-out: ").append(res.getCheckOut()).append("\n");
        msg.append("   📊 Estado: ").append(getReservationStatusText(res.getStatus())).append("\n");

        long nights = ChronoUnit.DAYS.between(res.getCheckIn(), res.getCheckOut());
        msg.append("   🌙 Noches: ").append(nights).append("\n\n");
    }

    public String buildServiceDetailsMessage(ServiceOffering service) {
        StringBuilder msg = new StringBuilder();

        msg.append("🎯 *").append(service.getName()).append("*\n\n");
        msg.append("📂 Categoría: ").append(service.getCategory()).append("\n");
        msg.append("📌 Subcategoría: ").append(service.getSubcategory()).append("\n\n");
        msg.append("📝 ").append(service.getDescription()).append("\n\n");
        msg.append("💰 Precio: $").append(service.getBasePrice()).append("\n");
        msg.append("⏱️ Duración: ").append(service.getDurationMinutes()).append(" minutos\n");
        msg.append("👥 Max participantes: ").append(service.getMaxParticipants()).append("\n");

        return msg.toString();
    }

    public String buildErrorMessage(String message) {
        return ERROR_PREFIX + message;
    }

    public String buildFormatErrorMessage(String usage, String example) {
        return buildErrorMessage("Formato incorrecto.\n\n" +
                "Uso: " + usage + "\n" +
                "Ejemplo: " + example);
    }

    private String formatReservation(Reservation res) {
        StringBuilder sb = new StringBuilder();

        sb.append("━━━━━━━━━━━━━━━\n");
        sb.append("🆔 ID: ").append(res.getReservationId()).append("\n");
        sb.append("🏨 Hotel: ").append(res.getHotel().getName()).append("\n");
        sb.append("🛏️ Habitación: ").append(res.getRoom().getNumber()).append("\n");
        sb.append("📅 Check-in: ").append(res.getCheckIn()).append("\n");
        sb.append("📅 Check-out: ").append(res.getCheckOut()).append("\n");
        sb.append("📊 Estado: ").append(res.getStatus()).append("\n");

        return sb.toString();
    }

    private RoomStatusInfo getRoomStatusInfo(Room.ReservationStatus status) {
        return switch (status) {
            case AVAILABLE -> new RoomStatusInfo("✅", "Disponible");
            case BOOKED -> new RoomStatusInfo("🔒", "Reservada");
            case MAINTENANCE -> new RoomStatusInfo("🔧", "En mantenimiento");
            default -> new RoomStatusInfo("❓", "Desconocido");
        };
    }

    private String getReservationStatusText(Reservation.Status status) {
        return switch (status) {
            case PENDING -> "⏳ Pendiente";
            case CONFIRMED -> "✅ Confirmada";
            case CHECKIN -> "🏨 Check-in realizado";
            case FINISHED -> "✔️ Finalizada";
        };
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().equals(roleName));
    }

    private record RoomStatusInfo(String icon, String text) {
    }
}
