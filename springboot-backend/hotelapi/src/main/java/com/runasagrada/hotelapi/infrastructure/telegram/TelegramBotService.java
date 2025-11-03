package com.runasagrada.hotelapi.infrastructure.telegram;

import com.runasagrada.hotelapi.model.*;
import com.runasagrada.hotelapi.repository.RoomLockRepository;
import com.runasagrada.hotelapi.repository.StaffMemberRepository;
import com.runasagrada.hotelapi.repository.UserRepository;
import com.runasagrada.hotelapi.service.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Main Telegram Bot Service for Hotel Runa Sagrada.
 * Handles all incoming messages and commands from Telegram users.
 * 
 * This service coordinates between Telegram API and business logic services,
 * providing a user-friendly interface for hotel management operations.
 * 
 * @author Hotel Runa Sagrada Team
 * @version 2.0
 */
@Service
@Slf4j
public class TelegramBotService extends TelegramLongPollingBot {

    // Configuration
    private final String botToken;
    private final String botUsername;

    // Services
    private final TelegramLinkService telegramLinkService;
    private final UserRepository userRepository;
    private final ReservationService reservationService;
    private final HotelService hotelService;
    private final RoomService roomService;
    private final ServiceOfferingService serviceOfferingService;
    private final StaffMemberRepository staffMemberRepository;
    private final RoomLockRepository roomLockRepository;
    private final TelegramMessageParser parser;

    public TelegramBotService(
            @Value("${telegram.bot-token}") String botToken,
            @Value("${telegram.bot-username}") String botUsername,
            TelegramLinkService telegramLinkService,
            UserRepository userRepository,
            ReservationService reservationService,
            HotelService hotelService,
            RoomService roomService,
            ServiceOfferingService serviceOfferingService,
            StaffMemberRepository staffMemberRepository,
            RoomLockRepository roomLockRepository,
            TelegramMessageParser parser) {
        super(botToken);
        this.botToken = botToken;
        this.botUsername = botUsername;
        this.telegramLinkService = telegramLinkService;
        this.userRepository = userRepository;
        this.reservationService = reservationService;
        this.hotelService = hotelService;
        this.roomService = roomService;
        this.serviceOfferingService = serviceOfferingService;
        this.staffMemberRepository = staffMemberRepository;
        this.roomLockRepository = roomLockRepository;
        this.parser = parser;
    }

    @Override
    public String getBotUsername() {
        return botUsername;
    }

    @Override
    public String getBotToken() {
        return botToken;
    }

    // ==================== Constants ====================

    private static final String ERROR_GENERIC = "❌ Ocurrió un error. Por favor intenta de nuevo.";
    private static final String ERROR_COMMAND_UNKNOWN = "Comando no reconocido. Usa /help para ver los comandos disponibles.";
    private static final String INFO_NO_UNDERSTAND = "No entiendo ese mensaje. Usa /help para ver los comandos disponibles.";
    private static final int MAX_MESSAGE_LENGTH = 4000;
    private static final int MAX_SERVICES_DISPLAYED = 6;

    // ==================== Bot Configuration ====================

    @Override
    public void onUpdateReceived(Update update) {
        if (update.hasMessage() && update.getMessage().hasText()) {
            handleTextMessage(update);
        } else if (update.hasCallbackQuery()) {
            handleCallbackQuery(update);
        }
    }

    private void handleTextMessage(Update update) {
        Long chatId = update.getMessage().getChatId();
        String text = update.getMessage().getText().trim();

        log.info("Received message from chatId {}: {}", chatId, text);

        try {
            handleMessage(chatId, text);
        } catch (Exception e) {
            log.error("Error handling message from chatId {}: {}", chatId, e.getMessage(), e);
            sendMessage(chatId, ERROR_GENERIC);
        }
    }

    private void handleCallbackQuery(Update update) {
        Long chatId = update.getCallbackQuery().getMessage().getChatId();
        String data = update.getCallbackQuery().getData();

        log.info("Received callback from chatId {}: {}", chatId, data);

        try {
            handleCallback(chatId, data);
        } catch (Exception e) {
            log.error("Error handling callback from chatId {}: {}", chatId, e.getMessage(), e);
            sendMessage(chatId, ERROR_GENERIC);
        }
    }

    // ==================== Main Message Handler ====================

    private void handleMessage(Long chatId, String text) {
        telegramLinkService.updateLastSeen(chatId);

        Optional<TelegramLink> linkOpt = telegramLinkService.findByChatId(chatId);

        if (linkOpt.isEmpty()) {
            handleUnlinkedUser(chatId, text);
            return;
        }

        User user = linkOpt.get().getUser();

        if (text.startsWith("/")) {
            handleCommand(chatId, text, user);
        } else {
            sendMessage(chatId, INFO_NO_UNDERSTAND);
        }
    }

    private void handleUnlinkedUser(Long chatId, String text) {
        if (text.equals("/start")) {
            sendMessage(chatId,
                    "¡Bienvenido al Bot de Hotel Runa Sagrada! 🏨\n\n" +
                            "Para comenzar, por favor envíame tu *National ID* (cédula) para vincular tu cuenta.");
            return;
        }

        // Intentar vincular por National ID
        Optional<User> userOpt = userRepository.findByNationalId(text.trim());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            telegramLinkService.createLink(chatId, user.getUserId());

            String roleName = getRoleName(user);

            sendMessage(chatId,
                    "✅ ¡Vinculación exitosa!\n\n" +
                            "📋 *Perfil:*\n" +
                            "Nombre: " + user.getFullName() + "\n" +
                            "Email: " + user.getEmail() + "\n" +
                            "Rol: " + roleName + "\n\n" +
                            "Usa /help para ver los comandos disponibles.");

            sendMainMenu(chatId, user);
        } else {
            sendMessage(chatId,
                    "❌ No encontré tu National ID en nuestro sistema.\n\n" +
                            "Por favor verifica e intenta de nuevo, o contacta con recepción.");
        }
    }

    // ==================== Command Router ====================

    private void handleCommand(Long chatId, String text, User user) {
        String command = parser.extractCommand(text);

        switch (command) {
            case "/start" -> handleStartCommand(chatId, user);
            case "/help" -> handleHelpCommand(chatId, user);
            case "/mis_reservas" -> handleMisReservas(chatId, user);
            case "/reservas" -> handleReservas(chatId, user);
            case "/disponibilidad" -> handleDisponibilidad(chatId, text);
            case "/hotel" -> handleHotel(chatId, text);
            case "/tipo_habitacion" -> handleTipoHabitacion(chatId, text);
            case "/habitacion" -> handleHabitacion(chatId, text);
            case "/servicio" -> handleServicio(chatId, text);
            case "/servicios" -> handleServiciosList(chatId, text);
            default -> sendMessage(chatId, ERROR_COMMAND_UNKNOWN);
        }
    }

    private void handleCallback(Long chatId, String data) {
        Optional<TelegramLink> linkOpt = telegramLinkService.findByChatId(chatId);
        if (!linkOpt.isPresent()) {
            sendMessage(chatId, "Por favor vincula tu cuenta primero con /start");
            return;
        }

        User user = linkOpt.get().getUser();

        if (data.equals("mis_reservas")) {
            if (hasRole(user, "ADMIN") || hasRole(user, "OPERATOR")) {
                handleReservas(chatId, user);
            } else {
                handleMisReservas(chatId, user);
            }
        } else if (data.equals("hoteles")) {
            handleHotelesList(chatId);
        }
    }

    // ==================== Command Handlers ====================

    /**
     * Handles /start command - Greets the user and shows main menu.
     */
    private void handleStartCommand(Long chatId, User user) {
        String roleName = getRoleName(user);

        sendMessage(chatId,
                "¡Hola " + user.getFullName() + "! 👋\n\n" +
                        "Tu rol es: *" + roleName + "*\n\n" +
                        "Usa /help para ver todos los comandos disponibles.");

        sendMainMenu(chatId, user);
    }

    private void handleHelpCommand(Long chatId, User user) {
        String roleName = getRoleName(user);
        StringBuilder help = new StringBuilder();

        help.append("📖 *Ayuda - Hotel Runa Sagrada Bot*\n\n");
        help.append("Tu rol: ").append(roleName).append("\n\n");
        help.append("*Comandos disponibles:*\n\n");

        if (hasRole(user, "CLIENT")) {
            help.append("🏨 `/mis_reservas` - Ver tus reservas\n\n");
        }

        if (hasRole(user, "ADMIN")) {
            help.append("🏨 `/reservas` - Ver todas las reservas\n\n");
        } else if (hasRole(user, "OPERATOR")) {
            help.append("🏨 `/reservas` - Ver reservas de tu hotel\n\n");
        }

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

        sendMessage(chatId, help.toString());
    }

    @Transactional(readOnly = true)
    private void handleMisReservas(Long chatId, User user) {
        List<Reservation> reservations = reservationService.findByUserOrdered(user.getUserId());

        if (reservations.isEmpty()) {
            sendMessage(chatId, "📭 No tienes reservas registradas.");
            return;
        }

        StringBuilder msg = new StringBuilder();
        msg.append("🏨 *Tus Reservas:*\n\n");

        for (Reservation res : reservations) {
            msg.append(formatReservation(res)).append("\n");
        }

        // Paginar si es muy largo
        String message = msg.toString();
        if (message.length() > 4000) {
            sendPaginatedMessage(chatId, message);
        } else {
            sendMessage(chatId, message);
        }
    }

    @Transactional(readOnly = true)
    private void handleReservas(Long chatId, User user) {
        List<Reservation> reservations;

        if (hasRole(user, "ADMIN")) {
            // ADMIN: ver todas las reservas
            reservations = reservationService.findAll();
        } else if (hasRole(user, "OPERATOR")) {
            // OPERATOR: ver solo reservas de su hotel asignado
            // Buscar el StaffMember asociado a este user
            StaffMember staff = staffMemberRepository.findByUserId(Long.valueOf(user.getUserId()));
            if (staff != null && staff.getHotelId() != null) {
                Long hotelId = staff.getHotelId();
                reservations = reservationService.findByHotelId(hotelId);
                log.info("Operador {} consultando reservas del hotel {}", user.getNationalId(), hotelId);
            } else {
                sendMessage(chatId, "❌ No se encontró tu asignación de hotel. Contacta al administrador.");
                log.warn("Operador {} sin hotel asignado", user.getNationalId());
                return;
            }
        } else {
            sendMessage(chatId, "❌ No tienes permisos para este comando. Solo ADMIN y OPERADORES.");
            return;
        }

        if (reservations.isEmpty()) {
            sendMessage(chatId, "📭 No hay reservas registradas.");
            return;
        }

        StringBuilder msg = new StringBuilder();
        msg.append("🏨 *Reservas ");
        if (hasRole(user, "ADMIN")) {
            msg.append("(Todas - " + reservations.size() + " total)*\n\n");
        } else {
            // Para operadores, obtener el nombre del hotel de manera segura
            StaffMember staff = staffMemberRepository.findByUserId(Long.valueOf(user.getUserId()));
            if (staff != null && staff.getHotelId() != null) {
                // Buscar hotel por ID en lugar de usar proxy lazy
                Hotel hotel = hotelService.get(staff.getHotelId());
                if (hotel != null) {
                    msg.append("(" + hotel.getName() + " - " + reservations.size() + " reservas)*\n\n");
                } else {
                    msg.append("(Hotel ID " + staff.getHotelId() + " - " + reservations.size() + " reservas)*\n\n");
                }
            } else {
                msg.append("(Tu Hotel - " + reservations.size() + " reservas)*\n\n");
            }
        }

        for (Reservation res : reservations) {
            msg.append(formatReservation(res)).append("\n");
        }

        // Paginar si es muy largo
        String message = msg.toString();
        if (message.length() > 4000) {
            sendPaginatedMessage(chatId, message);
        } else {
            sendMessage(chatId, message);
        }
    }

    @Transactional(readOnly = true)
    private void handleDisponibilidad(Long chatId, String text) {
        Map<String, String> params = parser.parseDisponibilidadCommand(text);

        if (params == null) {
            sendMessage(chatId,
                    "❌ Formato incorrecto.\n\n" +
                            "Uso: `/disponibilidad YYYY-MM-DD YYYY-MM-DD`\n" +
                            "Ejemplo: `/disponibilidad 2025-11-12 2025-11-14`");
            return;
        }

        LocalDate checkIn = parser.parseDate(params.get("checkIn"));
        LocalDate checkOut = parser.parseDate(params.get("checkOut"));

        if (!parser.isValidDateRange(checkIn, checkOut)) {
            sendMessage(chatId, "❌ Las fechas son inválidas. La fecha de check-in debe ser anterior al check-out.");
            return;
        }

        // Consultar disponibilidad
        Map<String, Integer> availability = checkAvailability(checkIn, checkOut);

        StringBuilder msg = new StringBuilder();
        msg.append("📅 *Disponibilidad*\n");
        msg.append("Check-in: ").append(checkIn).append("\n");
        msg.append("Check-out: ").append(checkOut).append("\n\n");

        if (availability.isEmpty()) {
            msg.append("❌ No hay habitaciones disponibles para estas fechas.");
        } else {
            msg.append("✅ *Habitaciones disponibles por tipo:*\n\n");
            availability.forEach((roomType, count) -> {
                msg.append("• ").append(roomType).append(": ").append(count).append("\n");
            });
        }

        sendMessage(chatId, msg.toString());
    }

    @Transactional(readOnly = true)
    private void handleHotel(Long chatId, String text) {
        Long hotelId = parser.parseHotelCommand(text);

        if (hotelId == null) {
            sendMessage(chatId,
                    "❌ Formato incorrecto.\n\n" +
                            "Uso: `/hotel <id>`\n" +
                            "Ejemplo: `/hotel 1`");
            return;
        }

        try {
            Hotel hotel = hotelService.get(hotelId);

            if (hotel == null) {
                sendMessage(chatId, "❌ Hotel no encontrado.");
                return;
            }

            StringBuilder msg = new StringBuilder();

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

            if (!hotel.getAmenities().isEmpty()) {
                msg.append("✨ *Amenidades del Hotel:*\n");
                hotel.getAmenities().forEach(amenity -> {
                    msg.append("• ").append(amenity.getName()).append("\n");
                });
                msg.append("\n");
            }

            // Obtener todas las habitaciones del hotel con RoomType cargado (eager fetch)
            List<Room> hotelRooms = roomService.findByHotelWithRoomType(hotelId);

            // Agrupar habitaciones por tipo
            Map<Integer, RoomType> roomTypeMap = new HashMap<>();
            Map<Integer, List<Room>> roomsByTypeId = new HashMap<>();

            // Procesar todas las habitaciones y agrupar por tipo
            for (Room room : hotelRooms) {
                if (room.getRoomType() != null) {
                    Integer typeId = room.getRoomType().getRoomTypeId();
                    RoomType roomType = room.getRoomType();

                    // Guardar RoomType en el mapa si no está presente
                    roomTypeMap.putIfAbsent(typeId, roomType);

                    // Agrupar habitaciones por tipo
                    roomsByTypeId.computeIfAbsent(typeId, k -> new ArrayList<>()).add(room);
                }
            }

            if (!roomTypeMap.isEmpty()) {
                msg.append("🛏️ *Tipos de Habitación:*\n\n");

                // Iterar sobre los RoomType ya cargados
                roomTypeMap.values().forEach(roomType -> {
                    List<Room> rooms = roomsByTypeId.getOrDefault(roomType.getRoomTypeId(), Collections.emptyList());
                    if (rooms.isEmpty())
                        return;

                    long availableCount = rooms.stream()
                            .filter(r -> r.getResStatus() == Room.ReservationStatus.AVAILABLE)
                            .count();

                    msg.append("📌 *").append(roomType.getName()).append("*\n");
                    msg.append("   💰 Desde $").append(String.format("%,.0f", roomType.getBasePrice()))
                            .append(" COP/noche\n");
                    msg.append("   👥 Capacidad: ").append(roomType.getCapacity()).append(" personas\n");
                    msg.append("   🏠 Total: ").append(rooms.size())
                            .append(" habitaciones (").append(availableCount).append(" disponibles)\n");
                    msg.append("   👉 Ver habitaciones: `/tipo_habitacion ").append(roomType.getRoomTypeId())
                            .append(" ").append(hotelId).append("`\n\n");
                });
            }

            // Obtener servicios del hotel específico (ServiceOffering.hotel == hotel)
            List<ServiceOffering> allServices = serviceOfferingService.getAllServiceOfferings();
            List<ServiceOffering> hotelServices = allServices.stream()
                    .filter(s -> s.getHotel() != null && s.getHotel().getHotelId().equals(hotelId))
                    .limit(6)
                    .toList();

            if (!hotelServices.isEmpty()) {
                msg.append("🎯 *Servicios Destacados:*\n\n");
                hotelServices.forEach(service -> {
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

                long totalServices = allServices.stream()
                        .filter(s -> s.getHotel() != null && s.getHotel().getHotelId().equals(hotelId))
                        .count();

                if (totalServices > 6) {
                    msg.append("💡 ").append(totalServices - 6).append(" servicios más disponibles.\n");
                    msg.append("📋 Usa `/servicios ").append(hotelId).append("` para ver todos\n");
                }
            }

            sendPaginatedMessage(chatId, msg.toString());
        } catch (Exception e) {
            log.error("Error en /hotel " + hotelId, e);
            sendMessage(chatId, "❌ Hotel no encontrado.");
        }
    }

    @Transactional(readOnly = true)
    private void handleHabitacion(Long chatId, String text) {
        Integer roomId = parser.parseHabitacionCommand(text);

        if (roomId == null) {
            sendMessage(chatId,
                    "❌ Formato incorrecto.\n\n" +
                            "Uso: `/habitacion <id>`\n" +
                            "Ejemplo: `/habitacion 5`");
            return;
        }

        // Cargar habitación con RoomType y Hotel (eager fetch)
        Optional<Room> roomOpt = roomService.findByIdWithDetails(roomId);

        if (!roomOpt.isPresent()) {
            sendMessage(chatId, "❌ Habitación no encontrada.");
            return;
        }

        Room room = roomOpt.get();
        RoomType roomType = room.getRoomType();
        Hotel hotel = room.getHotel();

        StringBuilder msg = new StringBuilder();
        msg.append("🛏️ *Habitación #").append(room.getNumber()).append("*\n\n");

        if (hotel != null) {
            msg.append("🏨 Hotel: ").append(hotel.getName()).append("\n\n");
        }

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

        String statusText;
        String statusIcon;
        switch (room.getResStatus()) {
            case AVAILABLE:
                statusIcon = "✅";
                statusText = "Disponible";
                break;
            case BOOKED:
                statusIcon = "🔒";
                statusText = "Reservada";
                break;
            case MAINTENANCE:
                statusIcon = "🔧";
                statusText = "En mantenimiento";
                break;
            default:
                statusIcon = "❓";
                statusText = "Desconocido";
        }

        msg.append("� Estado: ").append(statusIcon).append(" ").append(statusText).append("\n");
        msg.append("🧹 Limpieza: ")
                .append(room.getCleStatus() == Room.CleaningStatus.CLEAN ? "Limpia ✨" : "Por limpiar 🧺")
                .append("\n\n");

        // Obtener todas las reservas futuras de esta habitación mediante RoomLock
        LocalDate today = LocalDate.now();
        List<RoomLock> futureLocks = roomLockRepository.findNextLocksForRoom(roomId, today);

        msg.append("📅 *Disponibilidad:*\n");

        // Si la habitación está reservada o en mantenimiento, mostrar información
        // correspondiente
        if (room.getResStatus() == Room.ReservationStatus.BOOKED && !futureLocks.isEmpty()) {
            msg.append("� Actualmente reservada. Ver detalles de reservas a continuación.\n\n");
        } else if (room.getResStatus() == Room.ReservationStatus.MAINTENANCE) {
            msg.append("🔧 Actualmente en mantenimiento.\n\n");
        } else if (futureLocks.isEmpty()) {
            msg.append("✅ ¡Disponible para reservar! No hay reservas futuras.\n\n");
        }

        if (!futureLocks.isEmpty()) {
            // Agrupar locks por reserva para mostrar períodos completos
            Map<Integer, List<RoomLock>> locksByReservation = futureLocks.stream()
                    .filter(lock -> lock.getReservation() != null)
                    .collect(Collectors.groupingBy(
                            lock -> lock.getReservation().getReservationId(),
                            LinkedHashMap::new,
                            Collectors.toList()));

            msg.append("📅 *Reservas Futuras:*\n\n");

            locksByReservation.forEach((reservationId, locks) -> {
                Reservation res = locks.get(0).getReservation();

                msg.append("🔒 *Reserva #").append(reservationId).append("*\n");
                msg.append("   📆 Check-in: ").append(res.getCheckIn()).append("\n");
                msg.append("   📆 Check-out: ").append(res.getCheckOut()).append("\n");
                msg.append("   📊 Estado: ").append(getReservationStatusText(res.getStatus())).append("\n");

                long nights = java.time.temporal.ChronoUnit.DAYS.between(res.getCheckIn(), res.getCheckOut());
                msg.append("   🌙 Noches: ").append(nights).append("\n\n");
            });

            msg.append("💡 Días ocupados: ").append(futureLocks.size()).append("\n\n");
        }

        msg.append("� *Consultar disponibilidad específica:*\n");
        msg.append("`/disponibilidad `_`YYYY-MM-DD YYYY-MM-DD`_\n");
        msg.append("Ejemplo: `/disponibilidad 2025-11-10 2025-11-15`");

        sendPaginatedMessage(chatId, msg.toString());
    }

    private String getReservationStatusText(Reservation.Status status) {
        return switch (status) {
            case PENDING -> "⏳ Pendiente";
            case CONFIRMED -> "✅ Confirmada";
            case CHECKIN -> "🏨 Check-in realizado";
            case FINISHED -> "✔️ Finalizada";
        };
    }

    private void handleServicio(Long chatId, String text) {
        Long serviceId = parser.parseServicioCommand(text);

        if (serviceId == null) {
            sendMessage(chatId,
                    "❌ Formato incorrecto.\n\n" +
                            "Uso: `/servicio <id>`\n" +
                            "Ejemplo: `/servicio 3`");
            return;
        }

        Optional<ServiceOffering> serviceOpt = serviceOfferingService.searchById(serviceId);

        if (!serviceOpt.isPresent()) {
            sendMessage(chatId, "❌ Servicio no encontrado.");
            return;
        }

        ServiceOffering service = serviceOpt.get();
        StringBuilder msg = new StringBuilder();

        msg.append("🎯 *").append(service.getName()).append("*\n\n");
        msg.append("📂 Categoría: ").append(service.getCategory()).append("\n");
        msg.append("📌 Subcategoría: ").append(service.getSubcategory()).append("\n\n");

        msg.append("📝 ").append(service.getDescription()).append("\n\n");

        msg.append("💰 Precio: $").append(service.getBasePrice()).append("\n");
        msg.append("⏱️ Duración: ").append(service.getDurationMinutes()).append(" minutos\n");
        msg.append("👥 Max participantes: ").append(service.getMaxParticipants()).append("\n");

        sendMessage(chatId, msg.toString());
    }

    @Transactional(readOnly = true)
    private void handleTipoHabitacion(Long chatId, String text) {
        // Parsear: /tipo_habitacion <roomTypeId> <hotelId>
        String[] parts = text.trim().split("\\s+");
        if (parts.length < 3) {
            sendMessage(chatId,
                    "❌ Formato incorrecto.\n\n" +
                            "Uso: `/tipo_habitacion <tipo_id> <hotel_id>`\n" +
                            "Ejemplo: `/tipo_habitacion 1 1`");
            return;
        }

        Integer roomTypeId;
        Long hotelId;
        try {
            roomTypeId = Integer.parseInt(parts[1]);
            hotelId = Long.parseLong(parts[2]);
        } catch (NumberFormatException e) {
            sendMessage(chatId, "❌ Los IDs deben ser números válidos.");
            return;
        }

        try {
            // Obtener hotel para verificar que existe
            Hotel hotel = hotelService.get(hotelId);

            // Buscar habitaciones de este tipo EN ESTE HOTEL específico (con RoomType
            // cargado)
            List<Room> roomsOfType = roomService.findByHotelWithRoomType(hotelId).stream()
                    .filter(r -> r.getRoomType() != null && r.getRoomType().getRoomTypeId().equals(roomTypeId))
                    .collect(Collectors.toList());

            if (roomsOfType.isEmpty()) {
                sendMessage(chatId, "❌ No hay habitaciones de este tipo en el hotel seleccionado.");
                return;
            }

            RoomType roomType = roomsOfType.get(0).getRoomType();
            StringBuilder msg = new StringBuilder();

            msg.append("🛏️ *").append(roomType.getName()).append("*\n");
            msg.append("🏨 Hotel: ").append(hotel.getName()).append("\n\n");
            msg.append("📝 ").append(roomType.getDescription()).append("\n\n");
            msg.append("💰 Precio base: $").append(String.format("%,.0f", roomType.getBasePrice()))
                    .append(" COP/noche\n");
            msg.append("👥 Capacidad: ").append(roomType.getCapacity()).append(" personas\n\n");

            // Mostrar amenidades de ROOM del hotel (filtrar por tipo ROOM)
            List<Amenity> roomAmenities = hotel.getAmenities().stream()
                    .filter(a -> a.getType() == AmenityType.ROOM)
                    .toList();

            if (!roomAmenities.isEmpty()) {
                msg.append("✨ *Amenidades de la Habitación:*\n");
                roomAmenities.forEach(amenity -> {
                    msg.append("• ").append(amenity.getName()).append("\n");
                });
                msg.append("\n");
            }

            // Listar todas las habitaciones de este tipo en este hotel
            msg.append("🏠 *Habitaciones de este tipo:*\n\n");

            LocalDate today = LocalDate.now();

            for (Room room : roomsOfType) {
                String statusIcon;
                String statusText;

                // Verificar si la habitación está realmente reservada HOY
                boolean isReservedToday = roomLockRepository.existsByRoomIdAndLockDate(room.getRoomId(), today);

                // Determinar el estado basado en la fecha actual
                if (room.getResStatus() == Room.ReservationStatus.MAINTENANCE) {
                    statusIcon = "⚠️";
                    statusText = "En mantenimiento";
                } else if (isReservedToday) {
                    statusIcon = "🔒";
                    statusText = "Reservada";
                } else {
                    statusIcon = "✅";
                    statusText = "Disponible";
                }

                msg.append(statusIcon).append(" *#").append(room.getNumber()).append("*");
                msg.append(" - Piso ").append(room.getFloor());

                if (room.getThemeName() != null && !room.getThemeName().isEmpty()) {
                    msg.append("\n   🎨 Tema: ").append(room.getThemeName());
                }

                msg.append("\n   📊 Estado: ").append(statusText);
                msg.append("\n   🧹 Limpieza: ");
                msg.append(room.getCleStatus() == Room.CleaningStatus.CLEAN ? "Limpia" : "Por limpiar");

                msg.append("\n   👉 Ver disponibilidad: `/habitacion ").append(room.getRoomId()).append("`\n\n");
            }

            sendPaginatedMessage(chatId, msg.toString());

        } catch (Exception e) {
            log.error("Error en /tipo_habitacion " + roomTypeId + " " + hotelId, e);
            sendMessage(chatId, "❌ Error al consultar el tipo de habitación.");
        }
    }

    @Transactional(readOnly = true)
    private void handleServiciosList(Long chatId, String text) {
        // Parsear: /servicios <hotelId> (opcional)
        String[] parts = text.trim().split("\\s+");
        Long hotelId = null;

        if (parts.length >= 2) {
            try {
                hotelId = Long.parseLong(parts[1]);
            } catch (NumberFormatException e) {
                sendMessage(chatId, "❌ El ID del hotel debe ser un número válido.");
                return;
            }
        }

        List<ServiceOffering> services = serviceOfferingService.getAllServiceOfferings();

        // Filtrar por hotel si se especificó
        if (hotelId != null) {
            final Long finalHotelId = hotelId;
            services = services.stream()
                    .filter(s -> s.getHotel() != null && s.getHotel().getHotelId().equals(finalHotelId))
                    .collect(Collectors.toList());
        }

        if (services.isEmpty()) {
            sendMessage(chatId, hotelId != null
                    ? "📭 Este hotel no tiene servicios registrados."
                    : "📭 No hay servicios registrados.");
            return;
        }

        StringBuilder msg = new StringBuilder();
        if (hotelId != null) {
            try {
                Hotel hotel = hotelService.get(hotelId);
                msg.append("🏨 *Servicios de ").append(hotel.getName()).append("*\n\n");
            } catch (Exception e) {
                msg.append("🎯 *Servicios del Hotel*\n\n");
            }
        } else {
            msg.append("🎯 *Todos los Servicios Disponibles*\n\n");
        }

        // Agrupar por categoría y subcategoría
        Map<String, Map<String, List<ServiceOffering>>> servicesByCategory = new LinkedHashMap<>();
        for (ServiceOffering service : services) {
            String category = service.getCategory() != null ? service.getCategory() : "Sin categoría";
            String subcategory = service.getSubcategory() != null ? service.getSubcategory() : "General";

            servicesByCategory
                    .computeIfAbsent(category, k -> new LinkedHashMap<>())
                    .computeIfAbsent(subcategory, k -> new ArrayList<>())
                    .add(service);
        }

        servicesByCategory.forEach((category, subcategories) -> {
            msg.append("📂 *").append(category).append("*\n");

            subcategories.forEach((subcategory, categoryServices) -> {
                if (subcategories.size() > 1 || !subcategory.equals("General")) {
                    msg.append("   � ").append(subcategory).append("\n");
                }

                categoryServices.forEach(service -> {
                    msg.append("   • *").append(service.getName()).append("*\n");
                    msg.append("      💰 $").append(String.format("%,.0f", service.getBasePrice())).append(" COP");
                    msg.append(" | ⏱️ ").append(service.getDurationMinutes()).append(" min\n");
                    msg.append("      👉 `/servicio ").append(service.getId()).append("`\n");
                });
            });

            msg.append("\n");
        });

        sendPaginatedMessage(chatId, msg.toString());
    }

    private void handleHotelesList(Long chatId) {
        List<Hotel> hotels = hotelService.list();

        if (hotels.isEmpty()) {
            sendMessage(chatId, "📭 No hay hoteles registrados.");
            return;
        }

        StringBuilder msg = new StringBuilder();
        msg.append("🏨 *Hoteles Disponibles:*\n\n");

        for (Hotel hotel : hotels) {
            msg.append("*").append(hotel.getName()).append("* (ID: ").append(hotel.getHotelId()).append(")\n");
            if (hotel.getDescription() != null) {
                msg.append("   ").append(hotel.getDescription()).append("\n");
            }
            msg.append("   Usa `/hotel ").append(hotel.getHotelId()).append("` para más detalles\n\n");
        }

        sendMessage(chatId, msg.toString());
    }

    // ==================== Business Logic - Availability ====================

    /**
     * Checks room availability for a date range.
     * Returns a map of room type names to available count.
     * 
     * @param checkIn  Check-in date
     * @param checkOut Check-out date (exclusive)
     * @return Map of room type to available count
     */
    @Transactional(readOnly = true)
    private Map<String, Integer> checkAvailability(LocalDate checkIn, LocalDate checkOut) {
        // Obtener todas las habitaciones con RoomType cargado (eager fetch)
        List<Room> allRooms = roomService.findAllWithRoomType();

        // Crear mapa de tipos de habitación
        Map<String, List<Room>> roomsByType = new HashMap<>();
        for (Room room : allRooms) {
            if (room.getRoomType() != null) {
                String typeName = room.getRoomType().getName();
                roomsByType.computeIfAbsent(typeName, k -> new ArrayList<>()).add(room);
            }
        }

        Map<String, Integer> availability = new HashMap<>();

        for (Map.Entry<String, List<Room>> entry : roomsByType.entrySet()) {
            String typeName = entry.getKey();
            List<Room> rooms = entry.getValue();

            int availableCount = 0;

            for (Room room : rooms) {
                if (isRoomAvailable(room.getRoomId(), checkIn, checkOut)) {
                    availableCount++;
                }
            }

            if (availableCount > 0) {
                availability.put(typeName, availableCount);
            }
        }

        return availability;
    }

    private boolean isRoomAvailable(Integer roomId, LocalDate checkIn, LocalDate checkOut) {
        LocalDate current = checkIn;

        // Check-out exclusivo: revisar hasta checkOut - 1
        while (!current.isAfter(checkOut.minusDays(1))) {
            if (roomLockRepository.existsByRoomIdAndLockDate(roomId, current)) {
                return false;
            }
            current = current.plusDays(1);
        }

        return true;
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

        if (hasRole(res.getUser(), "ADMIN") || hasRole(res.getUser(), "OPERATOR")) {
            sb.append("👤 Cliente: ").append(res.getUser().getFullName()).append("\n");
        }

        return sb.toString();
    }

    // ==================== UI Components ====================

    /**
     * Sends the main menu with inline keyboard based on user role.
     */
    private void sendMainMenu(Long chatId, User user) {
        InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
        List<List<InlineKeyboardButton>> keyboard = new ArrayList<>();

        if (hasRole(user, "CLIENT")) {
            keyboard.add(Collections.singletonList(
                    InlineKeyboardButton.builder()
                            .text("🏨 Mis Reservas")
                            .callbackData("mis_reservas")
                            .build()));
        }

        if (hasRole(user, "ADMIN") || hasRole(user, "OPERATOR")) {
            keyboard.add(Collections.singletonList(
                    InlineKeyboardButton.builder()
                            .text("📋 Ver Reservas")
                            .callbackData("mis_reservas")
                            .build()));
        }

        // Eliminado botón de Disponibilidad - se consulta desde habitaciones
        // específicas

        keyboard.add(Collections.singletonList(
                InlineKeyboardButton.builder()
                        .text("🏢 Ver Hoteles")
                        .callbackData("hoteles")
                        .build()));

        markup.setKeyboard(keyboard);

        SendMessage message = new SendMessage();
        message.setChatId(chatId.toString());
        message.setText("Selecciona una opción:");
        message.setReplyMarkup(markup);

        try {
            execute(message);
        } catch (TelegramApiException e) {
            log.error("Error sending main menu", e);
        }
    }

    // ==================== Messaging Utilities ====================

    /**
     * Sends a text message to a chat with Markdown formatting.
     * 
     * @param chatId The target chat ID
     * @param text   The message text (supports Markdown)
     */
    private void sendMessage(Long chatId, String text) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId.toString());
        message.setText(text);
        message.setParseMode("Markdown");

        try {
            execute(message);
        } catch (TelegramApiException e) {
            log.error("Error sending message to chatId {}: {}", chatId, e.getMessage(), e);
        }
    }

    private void sendPaginatedMessage(Long chatId, String text) {
        int maxLength = 4000;
        List<String> chunks = new ArrayList<>();

        while (text.length() > maxLength) {
            int splitIndex = text.lastIndexOf("\n\n", maxLength);
            if (splitIndex == -1) {
                splitIndex = maxLength;
            }

            chunks.add(text.substring(0, splitIndex));
            text = text.substring(splitIndex).trim();
        }

        if (!text.isEmpty()) {
            chunks.add(text);
        }

        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            if (chunks.size() > 1) {
                chunk = String.format("📄 Página %d/%d\n\n%s", i + 1, chunks.size(), chunk);
            }
            sendMessage(chatId, chunk);
        }
    }

    // ==================== Helper Methods - Roles ====================

    /**
     * Checks if user has the specified role.
     * 
     * @param user     The user to check
     * @param roleName The role name to verify
     * @return true if user has the role, false otherwise
     */
    private boolean hasRole(User user, String roleName) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().equals(roleName));
    }

    /**
     * Gets the display name for the user's role.
     * Returns the highest privilege role if user has multiple roles.
     * 
     * @param user The user whose role name to get
     * @return Human-readable role name
     */
    private String getRoleName(User user) {
        if (hasRole(user, "ADMIN"))
            return "Administrador";
        if (hasRole(user, "OPERATOR"))
            return "Operador";
        if (hasRole(user, "CLIENT"))
            return "Cliente";
        return "Usuario";
    }

    /**
     * Checks if user can view all reservations (admin or operator).
     * 
     * @param user The user to check
     * @return true if user can view reservations, false otherwise
     */
    private boolean canViewReservations(User user) {
        return hasRole(user, "ADMIN") || hasRole(user, "OPERATOR");
    }
}
