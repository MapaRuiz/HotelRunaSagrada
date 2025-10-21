package com.runasagrada.hotelapi.model;

import com.runasagrada.hotelapi.repository.*;
import com.runasagrada.hotelapi.service.ServiceScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DatabaseInit implements CommandLineRunner {

        // Repositorios originales
        private final RoleRepository roleRepo;
        private final UserRepository userRepo;
        private final HotelRepository hotels;
        private final AmenityRepository amenities;

        // Nuevos repositorios para servicios y habitaciones
        private final ServiceOfferingRepository serviceRepository;
        private final ServiceScheduleService scheduleService;
        private final RoomTypeRepository roomTypeRepository;
        private final RoomRepository roomRepository;

        // Repositorios para reservas y bloqueos
        private final ReservationRepository reservationRepo;
        private final RoomLockRepository roomLockRepo;

        // Nuevos repositorios para Department, StaffMember y Task
        private final DepartmentRepository departmentRepo;
        private final StaffMemberRepository staffMemberRepo;
        private final TaskRepository taskRepo;

        // Repositorios para Payment y PaymentMethod
        private final PaymentMethodRepository paymentMethodRepo;
        private final PaymentRepository paymentRepo;

        @Override
        public void run(String... args) {
                // Datos originales: roles, usuarios y hoteles
                seedBasicData();

                // Nuevos datos: habitaciones y servicios
                List<Hotel> hotelList = hotels.findAll();
                seedRoomTypesAndRooms(hotelList);
                seedServicesForAllHotels(hotelList);
                seedReservations(hotelList);

                // Datos para Department, StaffMember y Task
                // Los StaffMember son users con rol OPERATOR asociados a hoteles y
                // departamentos
                seedDepartments(hotelList);
                seedStaffMembers(hotelList);
                seedTasks();

                // Datos para PaymentMethod y Payment
                seedPaymentMethodsAndPayments();
        }

        private void seedBasicData() {
                // --- Roles base ---
                Role adminRole = roleRepo.findByName("ADMIN").orElseGet(() -> roleRepo.save(new Role(null, "ADMIN")));
                Role operatorRole = roleRepo.findByName("OPERATOR")
                                .orElseGet(() -> roleRepo.save(new Role(null, "OPERATOR")));
                Role clientRole = roleRepo.findByName("CLIENT")
                                .orElseGet(() -> roleRepo.save(new Role(null, "CLIENT")));

                // --- 1 Admin ---
                userRepo.findByEmail("admin@hotel.com").orElseGet(() -> {
                        User u = new User();
                        u.setEmail("admin@hotel.com");
                        u.setPassword("admin123");
                        u.setFullName("Admin");
                        u.setPhone("3000000000");
                        u.setNationalId("CC-ADMIN-001");
                        u.setSelectedPet("/images/icons/icono1.png");
                        u.setRoles(Set.of(adminRole));
                        return userRepo.save(u);
                });

                // --- 15 Operadores ---
                IntStream.rangeClosed(1, 15).forEach(i -> {
                        String email = "op" + i + "@hotel.com";
                        userRepo.findByEmail(email).orElseGet(() -> {
                                User u = new User();
                                u.setEmail(email);
                                u.setPassword("op123");
                                u.setFullName("Operador Hotel " + i);
                                u.setPhone("301000000" + String.format("%02d", i));
                                u.setNationalId("OP-" + String.format("%03d", i));
                                u.setSelectedPet(pickIcon(i));
                                u.setRoles(Set.of(operatorRole));
                                return userRepo.save(u);
                        });
                });

                // --- 10 Clientes ---
                IntStream.rangeClosed(1, 10).forEach(i -> {
                        String email = "client" + String.format("%02d", i) + "@demo.com";
                        userRepo.findByEmail(email).orElseGet(() -> {
                                User u = new User();
                                u.setEmail(email);
                                u.setPassword("client123");
                                u.setFullName("Cliente " + String.format("%02d", i));
                                u.setPhone("30200000" + String.format("%02d", i));
                                u.setNationalId("CLI-" + String.format("%04d", i));
                                u.setSelectedPet(pickIcon(i));
                                u.setRoles(Set.of(clientRole));
                                return userRepo.save(u);
                        });
                });

                // --- Hoteles + amenities ---
                if (hotels.count() == 0) {
                        Map<String, Amenity> A = amenities.findAll().stream()
                                        .collect(Collectors.toMap(Amenity::getName, a -> a));

                        // Crear amenities de ROOM explícitamente
                        List<String> roomAmenities = List.of(
                                        "TV", "Aire acondicionado", "Minibar", "Caja fuerte", "Secador de pelo",
                                        "Cafetera", "Plancha",
                                        "Balcon", "Cocineta", "Ropa de cama premium");
                        for (String r : roomAmenities) {
                                mustAmenity(A, r);
                        }

                        Hotel cartagena = new Hotel();
                        cartagena.setName("Runa Sagrada Cartagena");
                        cartagena.setLatitude("10.39972");
                        cartagena.setLongitude("-75.51444");
                        cartagena.setDescription(
                                        "Hotel boutique dentro de la Ciudad Amurallada, con terraza rooftop para ver el atardecer, piscina al aire libre y habitaciones con toques coloniales a pasos de las plazas y murallas.");
                        cartagena.setCheckInAfter("15:00");
                        cartagena.setCheckOutBefore("12:00");
                        cartagena.setImage("/images/hotels/cartagena.jpg");
                        cartagena.setAmenities(amenSet(A,
                                        "Restaurante", "Bar", "Wifi gratis", "Parqueadero gratis",
                                        "Traslado aeropuerto", "Gimnasio",
                                        "Spa/Sauna", "Piscina al aire libre", "Aseo diario", "CCTV",
                                        "Terraza", "Salón de eventos"));

                        Hotel eje = new Hotel();
                        eje.setName("Runa Sagrada Eje Cafetero");
                        eje.setLatitude("5.070275");
                        eje.setLongitude("-75.513817");
                        eje.setDescription(
                                        "Retiro estilo hacienda en el corazón del Paisaje Cultural Cafetero: jardines, senderos entre cafetales, catas de café y espacios de descanso con vista a las montañas.");
                        eje.setCheckInAfter("15:00");
                        eje.setCheckOutBefore("12:00");
                        eje.setImage("/images/hotels/ejecafe.webp");
                        eje.setAmenities(amenSet(A,
                                        "Restaurante", "Desayuno incluido", "Wifi gratis", "Traslado aeropuerto",
                                        "Gimnasio", "Salón de eventos", "Jardín", "Alojamiento libre de humo",
                                        "Paqueadero gratis"));

                        Hotel sanandres = new Hotel();
                        sanandres.setName("Runa Sagrada San Andrés");
                        sanandres.setLatitude("12.542499");
                        sanandres.setLongitude("-81.718369");
                        sanandres.setDescription(
                                        "Resort frente al mar de los siete colores con acceso directo a la playa, club de snorkel y piscina con hidromasaje; suites luminosas con balcón y brisa caribeña.");
                        sanandres.setCheckInAfter("15:00");
                        sanandres.setCheckOutBefore("12:00");
                        sanandres.setImage("/images/hotels/sanandres.webp");
                        sanandres.setAmenities(amenSet(A,
                                        "Desayuno incluido", "Wifi gratis", "Parqueadero gratis",
                                        "Piscina al aire libre",
                                        "Jacuzzi", "Frente a la playa", "Spa/Sauna", "Aseo diario"));

                        Hotel santamarta = new Hotel();
                        santamarta.setName("Runa Sagrada Santa Marta");
                        santamarta.setLatitude("11.24079");
                        santamarta.setLongitude("-74.19904");
                        santamarta.setDescription(
                                        "Eco-hotel a minutos del Parque Tayrona: integración selva-mar, piscina rodeada de vegetación, terrazas para relajarse y cocina local con ingredientes frescos.");
                        santamarta.setCheckInAfter("15:00");
                        santamarta.setCheckOutBefore("12:00");
                        santamarta.setImage("/images/hotels/santamarta.jpg");
                        santamarta.setAmenities(amenSet(A,
                                        "Restaurante", "Bar", "Wifi gratis", "Traslado aeropuerto", "Terraza", "Jardín",
                                        "Alojamiento libre de humo", "Spa/Sauna", "Desayuno incluido"));

                        Hotel leyva = new Hotel();
                        leyva.setName("Runa Sagrada Villa de Leyva");
                        leyva.setLatitude("5.6333");
                        leyva.setLongitude("-73.5333");
                        leyva.setDescription(
                                        "Casa colonial restaurada alrededor de un patio empedrado; chimeneas, salones acogedores y gastronomía de autor a pocos pasos de la Plaza Mayor.");
                        leyva.setCheckInAfter("15:00");
                        leyva.setCheckOutBefore("12:00");
                        leyva.setImage("/images/hotels/villaleiva.jpg");
                        leyva.setAmenities(amenSet(A,
                                        "Restaurante", "Wifi gratis", "Parqueadero gratis", "Salón de eventos",
                                        "Se admiten mascotas", "Se habla español", "Se habla inglés", "Bar",
                                        "Traslado aeropuerto"));

                        hotels.saveAll(List.of(cartagena, eje, sanandres, santamarta, leyva));
                }
        }

        /*
         * ============================================================
         * ROOM TYPES & ROOMS
         * ============================================================
         */
        private void seedRoomTypesAndRooms(List<Hotel> hotelList) {
                // Crear tipos de habitación si no existen
                Map<String, RoomType> typesByName = roomTypeRepository.findAll().stream()
                                .collect(Collectors.toMap(rt -> rt.getName().toLowerCase(Locale.ROOT), rt -> rt,
                                                (a, b) -> a, LinkedHashMap::new));

                RoomType rtStd = ensureType(typesByName, "Estándar Regional",
                                "Habitaciones cómodas con decoración típica de cada región colombiana",
                                new BigDecimal("120000"), 2,
                                "https://cdn.pixabay.com/photo/2016/07/08/23/36/beach-house-1505461_1280.jpg");
                RoomType rtDel = ensureType(typesByName, "Deluxe Cultural",
                                "Habitaciones amplias con elementos culturales auténticos de la región",
                                new BigDecimal("180000"), 3,
                                "https://cdn.pixabay.com/photo/2021/12/18/06/00/room-6878004_1280.jpg");
                RoomType rtSuite = ensureType(typesByName, "Suite Ancestral",
                                "Suites de lujo con sala separada y diseño premium colombiano",
                                new BigDecimal("280000"), 4,
                                "https://cdn.pixabay.com/photo/2020/12/24/19/10/hotel-room-5858068_1280.jpg");
                RoomType rtFam = ensureType(typesByName, "Familiar Colombiana",
                                "Habitaciones familiares amplias con espacios conectados y temática local",
                                new BigDecimal("220000"), 6,
                                "https://cdn.pixabay.com/photo/2017/04/28/22/14/room-2269591_1280.jpg");
                RoomType rtEco = ensureType(typesByName, "Eco Boutique",
                                "Habitación eco-friendly con materiales locales y energía renovable",
                                new BigDecimal("200000"), 3,
                                "https://cdn.pixabay.com/photo/2018/02/24/17/17/window-3178666_1280.jpg");

                Map<Integer, RoomType> typeByFloor = Map.of(
                                1, rtStd, 2, rtDel, 3, rtSuite, 4, rtFam, 5, rtEco);

                // Crear habitaciones si no existen
                if (roomRepository.count() == 0L && !hotelList.isEmpty()) {
                        int hotelsToUse = Math.min(5, hotelList.size());
                        for (int idx = 0; idx < hotelsToUse; idx++) {
                                Hotel hotel = hotelList.get(idx);
                                int hotelOrdinal = idx + 1;
                                for (int floor = 1; floor <= 5; floor++) {
                                        RoomType t = typeByFloor.get(floor);
                                        for (int i = 1; i <= 4; i++) {
                                                Room r = new Room();
                                                r.setHotel(hotel);
                                                r.setRoomType(t);
                                                r.setNumber(String.format("%d-%d0%d", hotelOrdinal, floor, i));
                                                r.setFloor(floor);

                                                Room.ReservationStatus res = switch (i) {
                                                        case 2 -> Room.ReservationStatus.BOOKED;
                                                        case 3 -> Room.ReservationStatus.MAINTENANCE;
                                                        default -> Room.ReservationStatus.AVAILABLE;
                                                };
                                                r.setResStatus(res);
                                                r.setCleStatus((i % 2 == 0) ? Room.CleaningStatus.DIRTY
                                                                : Room.CleaningStatus.CLEAN);
                                                r.setThemeName(themeNameFor(hotelOrdinal, floor));
                                                r.getImages().add(
                                                                "https://th.bing.com/th/id/R.6671f22a47fc00ccb37249bf7b7b74ef?rik=8VkhVVuKxibaJw&riu=http%3a%2f%2f1.bp.blogspot.com%2f-AJRd8qwC4RI%2fUnPI66ClGyI%2fAAAAAAAAzsU%2f6mfwCIhN6eQ%2fs1600%2fcasi4.JPG&ehk=c3QsEPM2AY2mfDQpRSFgkONQEThdMuBTWwlcAdaW6yc%3d&risl=&pid=ImgRaw&r=0");

                                                roomRepository.save(r);
                                        }
                                }
                        }
                }
        }

        /*
         * ============================================================
         * SERVICIOS ESPECÍFICOS POR HOTEL
         * ============================================================
         */
        private void seedServicesForAllHotels(List<Hotel> hotelList) {
                if (serviceRepository.count() > 0)
                        return;

                // Servicios base que van a todos los hoteles (comidas y talleres)
                List<ServiceOffering> commonServices = createCommonServices();

                // Servicios específicos por hotel
                for (int i = 0; i < hotelList.size(); i++) {
                        Hotel hotel = hotelList.get(i);
                        List<ServiceOffering> specificServices = createSpecificServicesForHotel(i + 1);

                        // Asignar hotel a todos los servicios
                        commonServices.forEach(s -> {
                                ServiceOffering copy = copyService(s);
                                copy.setHotel(hotel);
                                serviceRepository.save(copy);
                        });

                        specificServices.forEach(s -> {
                                s.setHotel(hotel);
                                serviceRepository.save(s);
                        });

                        createSampleSchedules(specificServices);
                }

                createSampleSchedules(commonServices);
        }

        private List<ServiceOffering> createCommonServices() {
                List<ServiceOffering> services = new ArrayList<>();

                // === COMIDAS TRADICIONALES (24) ===
                // Platos Principales
                // Bandeja Paisa
                ServiceOffering bandejaPaisa = new ServiceOffering();
                bandejaPaisa.setName("Bandeja Paisa Auténtica");
                bandejaPaisa.setCategory("Gastronomía");
                bandejaPaisa.setSubcategory("Antioquia");
                bandejaPaisa.setDescription(
                                "Bandeja paisa tradicional con frijoles, chicharrón, chorizo, morcilla, arepa y huevo");
                bandejaPaisa.setBasePrice(38000);
                bandejaPaisa.setDurationMinutes(60);
                bandejaPaisa.setImageUrls(List.of(
                                "https://th.bing.com/th/id/OIP.AnZh6QS4zdQ4kJugYnBTGgHaEA?w=292&h=180&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                bandejaPaisa.setMaxParticipants(10);
                bandejaPaisa.setLatitude(6.2442);
                bandejaPaisa.setLongitude(-75.5736);
                services.add(bandejaPaisa);

                ServiceOffering ajiacoSantafereño = new ServiceOffering();
                ajiacoSantafereño.setName("Ajiaco Santafereño");
                ajiacoSantafereño.setCategory("Gastronomía");
                ajiacoSantafereño.setSubcategory("Cundinamarca");
                ajiacoSantafereño.setDescription("Sopa de tres papas con pollo, mazorca, alcaparras y crema de leche");
                ajiacoSantafereño.setBasePrice(32000);
                ajiacoSantafereño.setDurationMinutes(60);
                ajiacoSantafereño.setImageUrls(List.of(
                                "https://th.bing.com/th/id/OIP.NQl2s4Eq66Lsnm_NA6lKYgHaEw?w=285&h=183&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                ajiacoSantafereño.setMaxParticipants(10);
                ajiacoSantafereño.setLatitude(4.7109);
                ajiacoSantafereño.setLongitude(-74.0721);
                services.add(ajiacoSantafereño);

                ServiceOffering sancochoCosteño = new ServiceOffering();
                sancochoCosteño.setName("Sancocho Costeño");
                sancochoCosteño.setCategory("Gastronomía");
                sancochoCosteño.setSubcategory("Costa Caribe");
                sancochoCosteño.setDescription("Sancocho de pescado con yuca, ñame, plátano verde y cilantro cimarrón");
                sancochoCosteño.setBasePrice(35000);
                sancochoCosteño.setDurationMinutes(60);
                sancochoCosteño.setImageUrls(
                                List.of("https://th.bing.com/th/id/OIP.0Uh9tgTWLk9rFTrwAUQJqwHaE5?w=236&h=180&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                sancochoCosteño.setMaxParticipants(10);
                sancochoCosteño.setLatitude(10.3910);
                sancochoCosteño.setLongitude(-75.4794);
                services.add(sancochoCosteño);

                ServiceOffering lechonaTolimense = new ServiceOffering();
                lechonaTolimense.setName("Lechona Tolimense");
                lechonaTolimense.setCategory("Gastronomía");
                lechonaTolimense.setSubcategory("Tolima");
                lechonaTolimense.setDescription("Cerdo relleno con arroz, arvejas y especias, asado en horno de barro");
                lechonaTolimense.setBasePrice(42000);
                lechonaTolimense.setDurationMinutes(60);
                lechonaTolimense.setImageUrls(List.of(
                                "https://th.bing.com/th/id/OIP.VXPfgpyO8xYN9VbCh1rfPAHaFS?w=257&h=184&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                lechonaTolimense.setMaxParticipants(10);
                lechonaTolimense.setLatitude(4.4389);
                lechonaTolimense.setLongitude(-75.2322);
                services.add(lechonaTolimense);

                ServiceOffering tamalesBogotanos = new ServiceOffering();
                tamalesBogotanos.setName("Tamales Bogotanos");
                tamalesBogotanos.setCategory("Gastronomía");
                tamalesBogotanos.setSubcategory("Cundinamarca");
                tamalesBogotanos.setDescription(
                                "Masa de maíz rellena de pollo, cerdo y verduras, envuelta en hojas de plátano");
                tamalesBogotanos.setBasePrice(28000);
                tamalesBogotanos.setDurationMinutes(60);
                tamalesBogotanos.setImageUrls(
                                List.of("https://th.bing.com/th/id/OIP.9PBQoDo6ksOa1xEuQfBN8AHaE8?w=295&h=197&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                tamalesBogotanos.setMaxParticipants(10);
                tamalesBogotanos.setLatitude(4.7110);
                tamalesBogotanos.setLongitude(-74.0721);
                services.add(tamalesBogotanos);

                ServiceOffering cazuelaDeMariscos = new ServiceOffering();
                cazuelaDeMariscos.setName("Cazuela de Mariscos");
                cazuelaDeMariscos.setCategory("Gastronomía");
                cazuelaDeMariscos.setSubcategory("Costa Caribe");
                cazuelaDeMariscos.setDescription(
                                "Cazuela con camarones, langostinos, pescado y moluscos en leche de coco");
                cazuelaDeMariscos.setBasePrice(48000);
                cazuelaDeMariscos.setDurationMinutes(60);
                cazuelaDeMariscos.setImageUrls(List.of(
                                "https://th.bing.com/th/id/OIP.gv9EQdQBk1BtmuVkkM5bCwHaE8?w=238&h=180&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                cazuelaDeMariscos.setMaxParticipants(10);
                cazuelaDeMariscos.setLatitude(10.3910);
                cazuelaDeMariscos.setLongitude(-75.4794);
                services.add(cazuelaDeMariscos);

                ServiceOffering moteDeQueso = new ServiceOffering();
                moteDeQueso.setName("Mote de Queso Costeño");
                moteDeQueso.setCategory("Gastronomía");
                moteDeQueso.setSubcategory("Costa Caribe");
                moteDeQueso.setDescription(
                                "Sopa espesa de ñame con queso costeño en cubos y un sofrito de cebolla y ajo");
                moteDeQueso.setBasePrice(30000);
                moteDeQueso.setDurationMinutes(60);
                moteDeQueso.setImageUrls(List.of(
                                "https://www.bing.com/th/id/OIP.ho9_tplOyO3pciMGwqw2ewHaEK?w=247&h=211&c=8&rs=1&qlt=90&o=6&cb=12&dpr=1.5&pid=3.1&rm=2"));
                moteDeQueso.setMaxParticipants(10);
                moteDeQueso.setLatitude(10.3910);
                moteDeQueso.setLongitude(-75.4794);
                services.add(moteDeQueso);

                ServiceOffering changuaBogotana = new ServiceOffering();
                changuaBogotana.setName("Changua Bogotana");
                changuaBogotana.setCategory("Gastronomía");
                changuaBogotana.setSubcategory("Cundinamarca");
                changuaBogotana.setDescription(
                                "Sopa de leche con huevos, cebolla larga y cilantro, servida con pan tostado");
                changuaBogotana.setBasePrice(18000);
                changuaBogotana.setDurationMinutes(30);
                changuaBogotana.setImageUrls(List.of(
                                "https://www.bing.com/th/id/OIP.8j0S2BNHgER7PtWr8N8QKgHaD4?w=245&h=211&c=8&rs=1&qlt=90&o=6&cb=12&dpr=1.5&pid=3.1&rm=2"));
                changuaBogotana.setMaxParticipants(10);
                changuaBogotana.setLatitude(4.7109);
                changuaBogotana.setLongitude(-74.0721);
                services.add(changuaBogotana);

                // Postres (8)
                ServiceOffering tresLechesCosteño = new ServiceOffering();
                tresLechesCosteño.setName("Tres Leches Costeño");
                tresLechesCosteño.setCategory("Gastronomía");
                tresLechesCosteño.setSubcategory("Postre");
                tresLechesCosteño.setDescription("Torta de tres leches con frutas tropicales");
                tresLechesCosteño.setBasePrice(15000);
                tresLechesCosteño.setDurationMinutes(30);
                tresLechesCosteño.setImageUrls(
                                List.of("https://easyways.cl/storage/20211229090337postre-tres-leches.jpg"));
                tresLechesCosteño.setMaxParticipants(10);
                tresLechesCosteño.setLatitude(10.3910);
                tresLechesCosteño.setLongitude(-75.4794);
                services.add(tresLechesCosteño);

                ServiceOffering arequipeConBrevas = new ServiceOffering();
                arequipeConBrevas.setName("Arequipe con Brevas");
                arequipeConBrevas.setCategory("Gastronomía");
                arequipeConBrevas.setSubcategory("Postre");
                arequipeConBrevas.setDescription("Brevas con dulce de leche, especialidad antioqueña");
                arequipeConBrevas.setBasePrice(12000);
                arequipeConBrevas.setDurationMinutes(30);
                arequipeConBrevas.setImageUrls(List

                                .of("https://www.bing.com/th/id/OIP.cbm7jA1ldElG57nuepvIkAHaFX?w=243&h=211&c=8&rs=1&qlt=90&o=6&cb=12&dpr=1.5&pid=3.1&rm=2"));
                arequipeConBrevas.setMaxParticipants(10);
                arequipeConBrevas.setLatitude(6.2442);
                arequipeConBrevas.setLongitude(-75.5736);
                services.add(arequipeConBrevas);

                ServiceOffering cocadasIsleñas = new ServiceOffering();
                cocadasIsleñas.setName("Cocadas Isleñas");
                cocadasIsleñas.setCategory("Gastronomía");
                cocadasIsleñas.setSubcategory("Postre");
                cocadasIsleñas.setDescription("Dulces de coco de la tradición isleña de San Andrés");
                cocadasIsleñas.setBasePrice(8000);
                cocadasIsleñas.setDurationMinutes(20);
                cocadasIsleñas.setImageUrls(List.of(
                                "https://www.bing.com/th/id/OIP.q5e4zFNUpNOE1ZZCdHgkIwHaE8?w=247&h=211&c=8&rs=1&qlt=90&o=6&cb=12&dpr=1.5&pid=3.1&rm=2"));
                cocadasIsleñas.setMaxParticipants(10);
                cocadasIsleñas.setLatitude(12.542499);
                cocadasIsleñas.setLongitude(-81.718369);
                services.add(cocadasIsleñas);

                ServiceOffering buñuelosDeYuca = new ServiceOffering();
                buñuelosDeYuca.setName("Buñuelos de Yuca");
                buñuelosDeYuca.setCategory("Gastronomía");
                buñuelosDeYuca.setSubcategory("Postre");
                buñuelosDeYuca.setDescription(
                                "Buñuelos esponjosos de yuca con queso, tradicionales de temporada navideña");
                buñuelosDeYuca.setBasePrice(12000);
                buñuelosDeYuca.setDurationMinutes(30);
                buñuelosDeYuca.setImageUrls(List.of(
                                "https://th.bing.com/th/id/R.a9df0aa2da8d64ac977dff3f216c7197?rik=vlqK5Om8wLSg9Q&pid=ImgRaw&r=0"));
                buñuelosDeYuca.setMaxParticipants(10);
                buñuelosDeYuca.setLatitude(4.7109);
                buñuelosDeYuca.setLongitude(-74.0721);
                services.add(buñuelosDeYuca);

                ServiceOffering natillaColombiana = new ServiceOffering();
                natillaColombiana.setName("Natilla Colombiana");
                natillaColombiana.setCategory("Gastronomía");
                natillaColombiana.setSubcategory("Postre");
                natillaColombiana.setDescription("Natilla cremosa con canela y pasas, postre tradicional navideño");
                natillaColombiana.setBasePrice(10000);
                natillaColombiana.setDurationMinutes(30);
                natillaColombiana.setImageUrls(List.of(
                                "https://th.bing.com/th/id/R.d1e9d68f55a35586a4a72a50b16e3414?rik=eAzc5K8D%2bL41ew&pid=ImgRaw&r=0"));
                natillaColombiana.setMaxParticipants(10);
                natillaColombiana.setLatitude(4.7109);
                natillaColombiana.setLongitude(-74.0721);
                services.add(natillaColombiana);

                ServiceOffering cuajadaConMelao = new ServiceOffering();
                cuajadaConMelao.setName("Cuajada con Melao");
                cuajadaConMelao.setCategory("Gastronomía");
                cuajadaConMelao.setSubcategory("Postre");
                cuajadaConMelao.setDescription("Queso fresco boyacense con miel de caña y almojábana");
                cuajadaConMelao.setBasePrice(9000);
                cuajadaConMelao.setDurationMinutes(20);
                cuajadaConMelao.setImageUrls(List.of(
                                "https://th.bing.com/th/id/OIP.Mo8nZdbNazOxbHlkGr_mCAHaE8?w=294&h=197&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                cuajadaConMelao.setMaxParticipants(10);
                cuajadaConMelao.setLatitude(5.6333);
                cuajadaConMelao.setLongitude(-73.5333);
                services.add(cuajadaConMelao);

                ServiceOffering bocadilloConQueso = new ServiceOffering();
                bocadilloConQueso.setName("Bocadillo con Queso");
                bocadilloConQueso.setCategory("Gastronomía");
                bocadilloConQueso.setSubcategory("Postre");
                bocadilloConQueso.setDescription(
                                "Dulce de guayaba con queso fresco, combinación tradicional santandereana");
                bocadilloConQueso.setBasePrice(7000);
                bocadilloConQueso.setDurationMinutes(15);
                bocadilloConQueso.setImageUrls(List.of(
                                "https://th.bing.com/th/id/OIP.BitMm62T-WO-D8ZXPe_vcAHaE8?w=255&h=180&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                bocadilloConQueso.setMaxParticipants(10);
                bocadilloConQueso.setLatitude(7.1193);
                bocadilloConQueso.setLongitude(-73.1227);
                services.add(bocadilloConQueso);

                ServiceOffering empanadasVallecaucanas = new ServiceOffering();
                empanadasVallecaucanas.setName("Empanadas Vallecaucanas");
                empanadasVallecaucanas.setCategory("Gastronomía");
                empanadasVallecaucanas.setSubcategory("Aperitivo");
                empanadasVallecaucanas
                                .setDescription("Empanadas de masa de maíz rellenas de papa y carne, fritas en aceite");
                empanadasVallecaucanas.setBasePrice(15000);
                empanadasVallecaucanas.setDurationMinutes(30);
                empanadasVallecaucanas.setImageUrls(
                                List.of("https://th.bing.com/th/id/OIP.1y8cf1VGqqQrkKYj9zC-tAHaE8?w=266&h=180&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                empanadasVallecaucanas.setMaxParticipants(10);
                empanadasVallecaucanas.setLatitude(3.4516);
                empanadasVallecaucanas.setLongitude(-76.5319);
                services.add(empanadasVallecaucanas);

                // Bebidas (8)
                ServiceOffering cafeDeOrigenEspecial = new ServiceOffering();
                cafeDeOrigenEspecial.setName("Café de Origen Especial");
                cafeDeOrigenEspecial.setCategory("Gastronomía");
                cafeDeOrigenEspecial.setSubcategory("Bebida");
                cafeDeOrigenEspecial.setDescription("Café de origen único de fincas locales");
                cafeDeOrigenEspecial.setBasePrice(8000);
                cafeDeOrigenEspecial.setDurationMinutes(15);
                cafeDeOrigenEspecial.setImageUrls(List.of(
                                "https://th.bing.com/th/id/OIP.NAdeTQfhhVDKHJVHgqXrOQEsDh?w=222&h=180&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                cafeDeOrigenEspecial.setMaxParticipants(10);
                cafeDeOrigenEspecial.setLatitude(5.070275);
                cafeDeOrigenEspecial.setLongitude(-75.513817);
                services.add(cafeDeOrigenEspecial);

                ServiceOffering aguaDePanelaConLimon = new ServiceOffering();
                aguaDePanelaConLimon.setName("Agua de Panela con Limón");
                aguaDePanelaConLimon.setCategory("Gastronomía");
                aguaDePanelaConLimon.setSubcategory("Bebida");
                aguaDePanelaConLimon.setDescription("Agua de panela con limón, refresco tradicional");
                aguaDePanelaConLimon.setBasePrice(5000);
                aguaDePanelaConLimon.setDurationMinutes(10);
                aguaDePanelaConLimon.setImageUrls(List.of(
                                "https://th.bing.com/th/id/OIP.pGbnrrumTEM9vM8hnEzHoAHaE7?w=222&h=180&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                aguaDePanelaConLimon.setMaxParticipants(10);
                aguaDePanelaConLimon.setLatitude(4.7109);
                aguaDePanelaConLimon.setLongitude(-74.0721);
                services.add(aguaDePanelaConLimon);

                ServiceOffering luladaCalena = new ServiceOffering();
                luladaCalena.setName("Lulada Caleña");
                luladaCalena.setCategory("Gastronomía");
                luladaCalena.setSubcategory("Bebida");
                luladaCalena.setDescription("Bebida refrescante de lulo con hielo, limón y azúcar");
                luladaCalena.setBasePrice(7000);
                luladaCalena.setDurationMinutes(10);
                luladaCalena.setImageUrls(List.of(
                                "https://th.bing.com/th/id/OIP.HQA5wDMq1W1ZA1inQFWX_gHaD9?w=302&h=180&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                luladaCalena.setMaxParticipants(10);
                luladaCalena.setLatitude(3.4516);
                luladaCalena.setLongitude(-76.5319);
                services.add(luladaCalena);

                ServiceOffering chocolateSantafereño = new ServiceOffering();
                chocolateSantafereño.setName("Chocolate Santafereño");
                chocolateSantafereño.setCategory("Gastronomía");
                chocolateSantafereño.setSubcategory("Bebida");
                chocolateSantafereño.setDescription("Chocolate caliente con queso, tradición bogotana");
                chocolateSantafereño.setBasePrice(9000);
                chocolateSantafereño.setDurationMinutes(20);
                chocolateSantafereño.setImageUrls(List
                                .of("https://th.bing.com/th/id/OIP.XDYpFg4VtS3vlRCwg-SWbAHaFE?w=288&h=196&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                chocolateSantafereño.setMaxParticipants(10);
                chocolateSantafereño.setLatitude(4.7109);
                chocolateSantafereño.setLongitude(-74.0721);
                services.add(chocolateSantafereño);

                ServiceOffering jugoDeCorozo = new ServiceOffering();
                jugoDeCorozo.setName("Jugo de Corozo");
                jugoDeCorozo.setCategory("Gastronomía");
                jugoDeCorozo.setSubcategory("Bebida");
                jugoDeCorozo.setDescription("Jugo de fruta de palma corozo, especialidad caribeña");
                jugoDeCorozo.setBasePrice(7000);
                jugoDeCorozo.setDurationMinutes(10);
                jugoDeCorozo.setImageUrls(
                                List.of("https://th.bing.com/th/id/OIP.H_I1dL60ZkLLBRtmK1j1kgHaGI?w=225&h=186&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                jugoDeCorozo.setMaxParticipants(10);
                jugoDeCorozo.setLatitude(10.3910);
                jugoDeCorozo.setLongitude(-75.4794);
                services.add(jugoDeCorozo);

                ServiceOffering chichaDeMaiz = new ServiceOffering();
                chichaDeMaiz.setName("Chicha de Maíz");
                chichaDeMaiz.setCategory("Gastronomía");
                chichaDeMaiz.setSubcategory("Bebida");
                chichaDeMaiz.setDescription("Bebida tradicional de maíz de cultura indígena");
                chichaDeMaiz.setBasePrice(6000);
                chichaDeMaiz.setDurationMinutes(20);
                chichaDeMaiz.setImageUrls(List.of(
                                "https://th.bing.com/th/id/OIP.gIC0joRsW5PXovRxqzluJQHaFK?w=259&h=180&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                chichaDeMaiz.setMaxParticipants(10);
                chichaDeMaiz.setLatitude(4.7109);
                chichaDeMaiz.setLongitude(-74.0721);
                services.add(chichaDeMaiz);

                ServiceOffering cocoLocoIsleno = new ServiceOffering();
                cocoLocoIsleno.setName("Coco Loco Isleño");
                cocoLocoIsleno.setCategory("Gastronomía");
                cocoLocoIsleno.setSubcategory("Bebida");
                cocoLocoIsleno.setDescription("Cóctel de coco con ron local");
                cocoLocoIsleno.setBasePrice(15000);
                cocoLocoIsleno.setDurationMinutes(15);
                cocoLocoIsleno.setImageUrls(
                                List.of("https://th.bing.com/th/id/OIP.WntsmZx73XvSrHwpKxDAhwHaEy?w=185&h=180&c=7&r=0&o=7&cb=12&dpr=1.5&pid=1.7&rm=3"));
                cocoLocoIsleno.setMaxParticipants(10);
                cocoLocoIsleno.setLatitude(12.542499);
                cocoLocoIsleno.setLongitude(-81.718369);
                services.add(cocoLocoIsleno);

                ServiceOffering cataDeAguardiente = new ServiceOffering();
                cataDeAguardiente.setName("Cata de Aguardiente");
                cataDeAguardiente.setCategory("Gastronomía");
                cataDeAguardiente.setSubcategory("Bebida");
                cataDeAguardiente.setDescription(
                                "Degustación de aguardientes regionales con maridaje de aperitivos típicos");
                cataDeAguardiente.setBasePrice(25000);
                cataDeAguardiente.setDurationMinutes(45);
                cataDeAguardiente.setImageUrls(List.of(
                                "https://tse4.mm.bing.net/th/id/OIP.EW_AK3Y1TmvxtIWB5EGmsgHaDI?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                cataDeAguardiente.setMaxParticipants(10);
                cataDeAguardiente.setLatitude(6.2442);
                cataDeAguardiente.setLongitude(-75.5736);
                services.add(cataDeAguardiente);

                // === TALLERES Y DANZAS CULTURALES (8) ===

                ServiceOffering tallerDeCumbia = new ServiceOffering();
                tallerDeCumbia.setName("Taller de Cumbia");
                tallerDeCumbia.setCategory("Cultural");
                tallerDeCumbia.setSubcategory("Danza");
                tallerDeCumbia.setDescription(
                                "Aprende los pasos tradicionales de cumbia con vestuario y música en vivo");
                tallerDeCumbia.setBasePrice(35000);
                tallerDeCumbia.setDurationMinutes(90);
                tallerDeCumbia.setImageUrls(List.of(
                                "https://tse4.mm.bing.net/th/id/OIP.NB_0k_FAa3gr5aQ727fDuwHaEK?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                tallerDeCumbia.setMaxParticipants(12);
                tallerDeCumbia.setLatitude(10.3910);
                tallerDeCumbia.setLongitude(-75.4794);
                services.add(tallerDeCumbia);

                ServiceOffering tallerDeVallenato = new ServiceOffering();
                tallerDeVallenato.setName("Taller de Vallenato");
                tallerDeVallenato.setCategory("Cultural");
                tallerDeVallenato.setSubcategory("Música");
                tallerDeVallenato.setDescription("Taller de acordeón, caja y guacharaca con maestros vallenatos");
                tallerDeVallenato.setBasePrice(45000);
                tallerDeVallenato.setDurationMinutes(120);
                tallerDeVallenato.setImageUrls(
                                List.of("https://4.bp.blogspot.com/-NB3KxCgsqyA/VZhhMY0ydpI/AAAAAAAAAB4/si9OpsPWOgk/s1600/Ni%25C3%25B1os-del-vallenato.jpg"));
                tallerDeVallenato.setMaxParticipants(10);
                tallerDeVallenato.setLatitude(10.4597);
                tallerDeVallenato.setLongitude(-73.2532);
                services.add(tallerDeVallenato);

                ServiceOffering tallerDeBambuco = new ServiceOffering();
                tallerDeBambuco.setName("Taller de Bambuco");
                tallerDeBambuco.setCategory("Cultural");
                tallerDeBambuco.setSubcategory("Danza");
                tallerDeBambuco.setDescription("Danza tradicional andina con pasos clásicos y vestuario típico");
                tallerDeBambuco.setBasePrice(30000);
                tallerDeBambuco.setDurationMinutes(90);
                tallerDeBambuco.setImageUrls(
                                List.of("https://tse3.mm.bing.net/th/id/OIP.Kg5E_clR9pWZOFj5mVrI2wHaFj?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                tallerDeBambuco.setMaxParticipants(12);
                tallerDeBambuco.setLatitude(4.7109);
                tallerDeBambuco.setLongitude(-74.0721);
                services.add(tallerDeBambuco);

                ServiceOffering tallerDeMapale = new ServiceOffering();
                tallerDeMapale.setName("Taller de Mapalé");
                tallerDeMapale.setCategory("Cultural");
                tallerDeMapale.setSubcategory("Danza");
                tallerDeMapale.setDescription("Danza afrocolombiana con tambores y coreografía ancestral");
                tallerDeMapale.setBasePrice(40000);
                tallerDeMapale.setDurationMinutes(90);
                tallerDeMapale.setImageUrls(List.of(
                                "https://3.bp.blogspot.com/-ijecNVgIdso/T95qn_D3LFI/AAAAAAAAABU/Qi1O-LcnHnQ/s1600/Mapale.jpg"));
                tallerDeMapale.setMaxParticipants(12);
                tallerDeMapale.setLatitude(10.3910);
                tallerDeMapale.setLongitude(-75.4794);
                services.add(tallerDeMapale);

                ServiceOffering tallerDeCurrulao = new ServiceOffering();
                tallerDeCurrulao.setName("Taller de Currulao");
                tallerDeCurrulao.setCategory("Cultural");
                tallerDeCurrulao.setSubcategory("Música");
                tallerDeCurrulao.setDescription("Ritmo del Pacífico con marimba, cununos y guasá");
                tallerDeCurrulao.setBasePrice(50000);
                tallerDeCurrulao.setDurationMinutes(120);
                tallerDeCurrulao.setImageUrls(List.of(
                                "https://tse3.mm.bing.net/th/id/OIP.qfmkbBcyiWgRR49EA-fCHAHaE8?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                tallerDeCurrulao.setMaxParticipants(10);
                tallerDeCurrulao.setLatitude(3.8890);
                tallerDeCurrulao.setLongitude(-77.0316);
                services.add(tallerDeCurrulao);

                ServiceOffering tallerDeCeramica = new ServiceOffering();
                tallerDeCeramica.setName("Taller de Cerámica Precolombina");
                tallerDeCeramica.setCategory("Cultural");
                tallerDeCeramica.setSubcategory("Artesanía");
                tallerDeCeramica.setDescription(
                                "Técnicas ancestrales de alfarería con arcillas locales y motivos indígenas");
                tallerDeCeramica.setBasePrice(55000);
                tallerDeCeramica.setDurationMinutes(180);
                tallerDeCeramica.setImageUrls(
                                List.of("https://tse1.mm.bing.net/th/id/OIP.Y7NqKjRVIDdiqAu-D1H5ygHaE8?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                tallerDeCeramica.setMaxParticipants(8);
                tallerDeCeramica.setLatitude(4.7109);
                tallerDeCeramica.setLongitude(-74.0721);
                services.add(tallerDeCeramica);

                ServiceOffering tallerDeTextiles = new ServiceOffering();
                tallerDeTextiles.setName("Taller de Textiles Wayuu");
                tallerDeTextiles.setCategory("Cultural");
                tallerDeTextiles.setSubcategory("Artesanía");
                tallerDeTextiles.setDescription("Tejido tradicional wayuu con técnicas milenarias y colores naturales");
                tallerDeTextiles.setBasePrice(65000);
                tallerDeTextiles.setDurationMinutes(240);
                tallerDeTextiles.setImageUrls(List
                                .of("https://th.bing.com/th/id/R.22185a7622acdb1113817d4b5824bb0e?rik=QTuvG43LbqtNhg&riu=http%3a%2f%2fartesaniasdecolombia.com.co%2fDocumentos%2fContenido%2f40473_mes-madre-carmen-maria-gonzalez-artesanias-colombia-2021-g.jpg&ehk=HcRSAE3NSPQHz7NBM7Nu3aRr4kmaYx%2fcC3Kgk%2bLshNo%3d&risl=&pid=ImgRaw&r=0"));
                tallerDeTextiles.setMaxParticipants(6);
                tallerDeTextiles.setLatitude(11.5444);
                tallerDeTextiles.setLongitude(-72.9088);
                services.add(tallerDeTextiles);

                ServiceOffering tallerDeJoyeria = new ServiceOffering();
                tallerDeJoyeria.setName("Taller de Joyería Precolombina");
                tallerDeJoyeria.setCategory("Cultural");
                tallerDeJoyeria.setSubcategory("Artesanía");
                tallerDeJoyeria.setDescription(
                                "Técnicas de orfebrería inspiradas en culturas Muisca, Tairona y Quimbaya");
                tallerDeJoyeria.setBasePrice(75000);
                tallerDeJoyeria.setDurationMinutes(180);
                tallerDeJoyeria.setImageUrls(List.of(
                                "https://th.bing.com/th/id/R.43c5848f3eef5405987566c94d9c8301?rik=HWu62g4bKL91YQ&pid=ImgRaw&r=0"));
                tallerDeJoyeria.setMaxParticipants(6);
                tallerDeJoyeria.setLatitude(4.7109);
                tallerDeJoyeria.setLongitude(-74.0721);
                services.add(tallerDeJoyeria);

                return services;
        }

        private List<ServiceOffering> createSpecificServicesForHotel(int hotelId) {
                List<ServiceOffering> services = new ArrayList<>();

                switch (hotelId) {
                        case 1: // Cartagena
                                ServiceOffering tourCiudadAmurallada = new ServiceOffering();
                                tourCiudadAmurallada.setName("Tour Ciudad Amurallada");
                                tourCiudadAmurallada.setCategory("Tours");
                                tourCiudadAmurallada.setSubcategory("Cultural");
                                tourCiudadAmurallada
                                                .setDescription("Recorrido histórico por Cartagena colonial con guía especializado");
                                tourCiudadAmurallada.setBasePrice(65000);
                                tourCiudadAmurallada.setDurationMinutes(180);
                                tourCiudadAmurallada.setImageUrls(
                                                List.of("https://th.bing.com/th/id/R.351262a5a6fefbd1ceaddb024dc05b09?rik=87y9SFzDOd6rBw&pid=ImgRaw&r=0"));
                                tourCiudadAmurallada.setMaxParticipants(15);
                                tourCiudadAmurallada.setLatitude(10.39972);
                                tourCiudadAmurallada.setLongitude(-75.51444);
                                services.add(tourCiudadAmurallada);

                                ServiceOffering islasDelRosario = new ServiceOffering();
                                islasDelRosario.setName("Islas del Rosario");
                                islasDelRosario.setCategory("Tours");
                                islasDelRosario.setSubcategory("Naturaleza");
                                islasDelRosario.setDescription(
                                                "Excursión en bote a islas coralinas con snorkel y tiempo de playa");
                                islasDelRosario.setBasePrice(120000);
                                islasDelRosario.setDurationMinutes(480);
                                islasDelRosario.setImageUrls(List.of(
                                                "https://tse2.mm.bing.net/th/id/OIP.eEdiCwcs03Cza6LRPOzpCwHaDw?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                islasDelRosario.setMaxParticipants(15);
                                islasDelRosario.setLatitude(10.1667);
                                islasDelRosario.setLongitude(-75.7500);
                                services.add(islasDelRosario);

                                ServiceOffering palenqueCultural = new ServiceOffering();
                                palenqueCultural.setName("Palenque Cultural");
                                palenqueCultural.setCategory("Tours");
                                palenqueCultural.setSubcategory("Cultural");
                                palenqueCultural
                                                .setDescription("Visita a San Basilio de Palenque, primer pueblo africano libre en América");
                                palenqueCultural.setBasePrice(85000);
                                palenqueCultural.setDurationMinutes(360);
                                palenqueCultural.setImageUrls(
                                                List.of("https://tse1.mm.bing.net/th/id/OIP.QbC3O3Efl4F4yWe_pFSzcwHaEC?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                palenqueCultural.setMaxParticipants(12);
                                palenqueCultural.setLatitude(10.2484);
                                palenqueCultural.setLongitude(-75.2070);
                                services.add(palenqueCultural);

                                ServiceOffering ceremoniaDelCacaoSagrado = new ServiceOffering();
                                ceremoniaDelCacaoSagrado.setName("Ceremonia del Cacao Sagrado");
                                ceremoniaDelCacaoSagrado.setCategory("Tours");
                                ceremoniaDelCacaoSagrado.setSubcategory("Ritual");
                                ceremoniaDelCacaoSagrado
                                                .setDescription("Ritual ancestral de conexión espiritual con el cacao como medicina sagrada");
                                ceremoniaDelCacaoSagrado.setBasePrice(95000);
                                ceremoniaDelCacaoSagrado.setDurationMinutes(120);
                                ceremoniaDelCacaoSagrado
                                                .setImageUrls(List.of(
                                                                "https://th.bing.com/th/id/R.998044b4e386f97558f2b87bf543b140?rik=FC7OsVnar8MtoQ&pid=ImgRaw&r=0"));
                                ceremoniaDelCacaoSagrado.setMaxParticipants(8);
                                ceremoniaDelCacaoSagrado.setLatitude(10.39972);
                                ceremoniaDelCacaoSagrado.setLongitude(-75.51444);
                                services.add(ceremoniaDelCacaoSagrado);

                                ServiceOffering buceoArqueologico = new ServiceOffering();
                                buceoArqueologico.setName("Buceo Arqueológico");
                                buceoArqueologico.setCategory("Tours");
                                buceoArqueologico.setSubcategory("Aventura");
                                buceoArqueologico
                                                .setDescription("Inmersiones en sitios arqueológicos submarinos con certificación PADI");
                                buceoArqueologico.setBasePrice(180000);
                                buceoArqueologico.setDurationMinutes(240);
                                buceoArqueologico.setImageUrls(List.of(
                                                "https://img.freepik.com/foto-gratis/buzo-explorando-ruinas-edificios-arqueologicos-submarinos_23-2150886858.jpg?t=st=1697268749~exp=1697269349~hmac=4aa0a3356ae6ce331d81ca9c168417a998603a472fd1c4d991d7e7d4ac41fee7"));
                                buceoArqueologico.setMaxParticipants(8);
                                buceoArqueologico.setLatitude(10.39972);
                                buceoArqueologico.setLongitude(-75.51444);
                                services.add(buceoArqueologico);
                                break;

                        case 2: // Eje Cafetero
                                ServiceOffering fincaCafeteraTradicional = new ServiceOffering();
                                fincaCafeteraTradicional.setName("Finca Cafetera Tradicional");
                                fincaCafeteraTradicional.setCategory("Tours");
                                fincaCafeteraTradicional.setSubcategory("Cultural");
                                fincaCafeteraTradicional
                                                .setDescription("Experiencia en finca cafetera con cosecha, procesamiento y degustación");
                                fincaCafeteraTradicional.setBasePrice(75000);
                                fincaCafeteraTradicional.setDurationMinutes(240);
                                fincaCafeteraTradicional.setImageUrls(List.of(
                                                "https://tse3.mm.bing.net/th/id/OIP.7u-FivIq4BMtTmB6ZNW8mQHaFP?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                fincaCafeteraTradicional.setMaxParticipants(15);
                                fincaCafeteraTradicional.setLatitude(4.6370);
                                fincaCafeteraTradicional.setLongitude(-75.5710);
                                services.add(fincaCafeteraTradicional);

                                ServiceOffering valleDeCocoraPremium = new ServiceOffering();
                                valleDeCocoraPremium.setName("Valle de Cocora Premium");
                                valleDeCocoraPremium.setCategory("Tours");
                                valleDeCocoraPremium.setSubcategory("Naturaleza");
                                valleDeCocoraPremium
                                                .setDescription("Trekking privado por bosque de palmas de cera con biólogo especialista");
                                valleDeCocoraPremium.setBasePrice(110000);
                                valleDeCocoraPremium.setDurationMinutes(360);
                                valleDeCocoraPremium.setImageUrls(List.of(
                                                "https://mlqfmr3rpryd.i.optimole.com/cb:Kpwn.a32d/w:auto/h:auto/q:100/ig:avif/https://cartagena-tours.co/wp-content/uploads/2022/12/Capture-decran-2022-12-09-a-15.37.52.png"));
                                valleDeCocoraPremium.setMaxParticipants(12);
                                valleDeCocoraPremium.setLatitude(4.6333);
                                valleDeCocoraPremium.setLongitude(-75.4831);
                                services.add(valleDeCocoraPremium);

                                ServiceOffering puebloPatrimonioSalamina = new ServiceOffering();
                                puebloPatrimonioSalamina.setName("Pueblo Patrimonio Salamina");
                                puebloPatrimonioSalamina.setCategory("Tours");
                                puebloPatrimonioSalamina.setSubcategory("Cultural");
                                puebloPatrimonioSalamina
                                                .setDescription("Tour por pueblo colonial con arquitectura tradicional y artesanías");
                                puebloPatrimonioSalamina.setBasePrice(55000);
                                puebloPatrimonioSalamina.setDurationMinutes(240);
                                puebloPatrimonioSalamina.setImageUrls(List.of(
                                                "https://tse3.mm.bing.net/th/id/OIP.C_oydjw3FRc7bW6aKin7cAHaEK?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                puebloPatrimonioSalamina.setMaxParticipants(15);
                                puebloPatrimonioSalamina.setLatitude(5.4072);
                                puebloPatrimonioSalamina.setLongitude(-75.4881);
                                services.add(puebloPatrimonioSalamina);

                                ServiceOffering cabalgataAndina = new ServiceOffering();
                                cabalgataAndina.setName("Cabalgata Andina");
                                cabalgataAndina.setCategory("Tours");
                                cabalgataAndina.setSubcategory("Aventura");
                                cabalgataAndina
                                                .setDescription("Recorrido a caballo por senderos andinos con caballos criollos colombianos");
                                cabalgataAndina.setBasePrice(100000);
                                cabalgataAndina.setDurationMinutes(240);
                                cabalgataAndina.setImageUrls(List.of(
                                                "https://tse3.mm.bing.net/th/id/OIP.XtCrwGcKfP87xEczt9tWWwHaE8?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                cabalgataAndina.setMaxParticipants(10);
                                cabalgataAndina.setLatitude(5.070275);
                                cabalgataAndina.setLongitude(-75.513817);
                                services.add(cabalgataAndina);

                                ServiceOffering cataDeVinosDeAltura = new ServiceOffering();
                                cataDeVinosDeAltura.setName("Cata de Vinos de Altura");
                                cataDeVinosDeAltura.setCategory("Tours");
                                cataDeVinosDeAltura.setSubcategory("Gastronomía");
                                cataDeVinosDeAltura
                                                .setDescription("Degustación de vinos colombianos de alta montaña con sommelier experto");
                                cataDeVinosDeAltura.setBasePrice(125000);
                                cataDeVinosDeAltura.setDurationMinutes(120);
                                cataDeVinosDeAltura
                                                .setImageUrls(List.of(
                                                                "https://th.bing.com/th/id/OIP.-S7HmvKJEDM5k_7zoZMbVAHaEc?o=7&cb=12rm=3&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                cataDeVinosDeAltura.setMaxParticipants(12);
                                cataDeVinosDeAltura.setLatitude(5.070275);
                                cataDeVinosDeAltura.setLongitude(-75.513817);
                                services.add(cataDeVinosDeAltura);
                                break;

                        case 3: // San Andrés
                                ServiceOffering hoyoSopladorYCuevaMorgan = new ServiceOffering();
                                hoyoSopladorYCuevaMorgan.setName("Hoyo Soplador y Cueva Morgan");
                                hoyoSopladorYCuevaMorgan.setCategory("Tours");
                                hoyoSopladorYCuevaMorgan.setSubcategory("Naturaleza");
                                hoyoSopladorYCuevaMorgan
                                                .setDescription("Exploración de géiser natural y cueva de piratas en San Andrés");
                                hoyoSopladorYCuevaMorgan.setBasePrice(45000);
                                hoyoSopladorYCuevaMorgan.setDurationMinutes(240);
                                hoyoSopladorYCuevaMorgan.setImageUrls(
                                                List.of("https://tse2.mm.bing.net/th/id/OIP.Q3Ut00lpPTbkXkHfA4xr1AHaFj?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                hoyoSopladorYCuevaMorgan.setMaxParticipants(15);
                                hoyoSopladorYCuevaMorgan.setLatitude(12.5847);
                                hoyoSopladorYCuevaMorgan.setLongitude(-81.7005);
                                services.add(hoyoSopladorYCuevaMorgan);

                                ServiceOffering culturaRaizal = new ServiceOffering();
                                culturaRaizal.setName("Cultura Raizal");
                                culturaRaizal.setCategory("Tours");
                                culturaRaizal.setSubcategory("Cultural");
                                culturaRaizal.setDescription(
                                                "Inmersión en cultura raizal con música, danza y gastronomía auténtica");
                                culturaRaizal.setBasePrice(70000);
                                culturaRaizal.setDurationMinutes(240);
                                culturaRaizal.setImageUrls(List.of(
                                                "https://tse4.mm.bing.net/th/id/OIP.1Jzhgqtl_5nENnOTKxsnzQHaFF?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                culturaRaizal.setMaxParticipants(12);
                                culturaRaizal.setLatitude(12.542499);
                                culturaRaizal.setLongitude(-81.718369);
                                services.add(culturaRaizal);

                                ServiceOffering acuarioYJohnnyCay = new ServiceOffering();
                                acuarioYJohnnyCay.setName("Acuario y Johnny Cay");
                                acuarioYJohnnyCay.setCategory("Tours");
                                acuarioYJohnnyCay.setSubcategory("Naturaleza");
                                acuarioYJohnnyCay.setDescription(
                                                "Viaje en bote a acuario natural y playa prístina con snorkel");
                                acuarioYJohnnyCay.setBasePrice(95000);
                                acuarioYJohnnyCay.setDurationMinutes(360);
                                acuarioYJohnnyCay.setImageUrls(
                                                List.of("https://dynamic-media.tacdn.com/media/photo-o/2f/31/9b/4b/caption.jpg?w=1400&h=1000&s=1"));
                                acuarioYJohnnyCay.setMaxParticipants(15);
                                acuarioYJohnnyCay.setLatitude(12.5333);
                                acuarioYJohnnyCay.setLongitude(-81.7167);
                                services.add(acuarioYJohnnyCay);

                                ServiceOffering safariDeAvesMarinas = new ServiceOffering();
                                safariDeAvesMarinas.setName("Safari de Aves Marinas");
                                safariDeAvesMarinas.setCategory("Tours");
                                safariDeAvesMarinas.setSubcategory("Naturaleza");
                                safariDeAvesMarinas
                                                .setDescription("Observación de aves marinas y endémicas del Caribe con ornitólogos");
                                safariDeAvesMarinas.setBasePrice(80000);
                                safariDeAvesMarinas.setDurationMinutes(300);
                                safariDeAvesMarinas.setImageUrls(List.of(
                                                "https://vidamarina.net/wp-content/uploads/aves-marinas-vuelo-vasto.webp"));
                                safariDeAvesMarinas.setMaxParticipants(12);
                                safariDeAvesMarinas.setLatitude(12.542499);
                                safariDeAvesMarinas.setLongitude(-81.718369);
                                services.add(safariDeAvesMarinas);

                                ServiceOffering vueloEnParapente = new ServiceOffering();
                                vueloEnParapente.setName("Vuelo en Parapente");
                                vueloEnParapente.setCategory("Tours");
                                vueloEnParapente.setSubcategory("Aventura");
                                vueloEnParapente.setDescription(
                                                "Vuelo en parapente biplaza sobre el mar de siete colores con instructor certificado");
                                vueloEnParapente.setBasePrice(200000);
                                vueloEnParapente.setDurationMinutes(120);
                                vueloEnParapente.setImageUrls(List.of(
                                                "https://parapenteencolombia.com/wp-content/uploads/2018/01/volar-en-parapente-medellin2-1.jpg"));
                                vueloEnParapente.setMaxParticipants(2);
                                vueloEnParapente.setLatitude(12.542499);
                                vueloEnParapente.setLongitude(-81.718369);
                                services.add(vueloEnParapente);
                                break;

                        case 4: // Santa Marta
                                ServiceOffering tayronaAncestral = new ServiceOffering();
                                tayronaAncestral.setName("Tayrona Ancestral");
                                tayronaAncestral.setCategory("Tours");
                                tayronaAncestral.setSubcategory("Cultural");
                                tayronaAncestral.setDescription(
                                                "Caminata a sitios arqueológicos indígenas Tayrona con guías nativos");
                                tayronaAncestral.setBasePrice(90000);
                                tayronaAncestral.setDurationMinutes(480);
                                tayronaAncestral.setImageUrls(List
                                                .of("https://tse3.mm.bing.net/th/id/OIP.MKV_ldp6VxSwg1wptMuOhQHaD5?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                tayronaAncestral.setMaxParticipants(12);
                                tayronaAncestral.setLatitude(11.3088);
                                tayronaAncestral.setLongitude(-73.9650);
                                services.add(tayronaAncestral);

                                ServiceOffering ciudadPerdidaTeyuna = new ServiceOffering();
                                ciudadPerdidaTeyuna.setName("Ciudad Perdida Teyuna");
                                ciudadPerdidaTeyuna.setCategory("Tours");
                                ciudadPerdidaTeyuna.setSubcategory("Aventura");
                                ciudadPerdidaTeyuna
                                                .setDescription("Expedición de 4 días a la Ciudad Perdida con guías indígenas Kogui");
                                ciudadPerdidaTeyuna.setBasePrice(450000);
                                ciudadPerdidaTeyuna.setDurationMinutes(5760);
                                ciudadPerdidaTeyuna.setImageUrls(List.of(
                                                "https://tse2.mm.bing.net/th/id/OIP.w2Y39OR2kBqZRnD28uEhowHaE6?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                ciudadPerdidaTeyuna.setMaxParticipants(12);
                                ciudadPerdidaTeyuna.setLatitude(11.2442);
                                ciudadPerdidaTeyuna.setLongitude(-73.7256);
                                services.add(ciudadPerdidaTeyuna);

                                ServiceOffering avistamientoAvesSierraNevada = new ServiceOffering();
                                avistamientoAvesSierraNevada.setName("Avistamiento Aves Sierra Nevada");
                                avistamientoAvesSierraNevada.setCategory("Tours");
                                avistamientoAvesSierraNevada.setSubcategory("Naturaleza");
                                avistamientoAvesSierraNevada
                                                .setDescription("Observación de aves en la cordillera costera más alta del mundo");
                                avistamientoAvesSierraNevada.setBasePrice(75000);
                                avistamientoAvesSierraNevada.setDurationMinutes(300);
                                avistamientoAvesSierraNevada.setImageUrls(
                                                List.of("https://tse1.mm.bing.net/th/id/OIP.xcPpaclkV33fOuzzuTVoEgHaHa?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                avistamientoAvesSierraNevada.setMaxParticipants(10);
                                avistamientoAvesSierraNevada.setLatitude(10.8400);
                                avistamientoAvesSierraNevada.setLongitude(-73.7200);
                                services.add(avistamientoAvesSierraNevada);

                                ServiceOffering temazcalAncestral = new ServiceOffering();
                                temazcalAncestral.setName("Temazcal Ancestral");
                                temazcalAncestral.setCategory("Tours");
                                temazcalAncestral.setSubcategory("Ritual");
                                temazcalAncestral.setDescription(
                                                "Ceremonia de purificación en casa de sudor tradicional con plantas medicinales");
                                temazcalAncestral.setBasePrice(115000);
                                temazcalAncestral.setDurationMinutes(180);
                                temazcalAncestral.setImageUrls(List.of(
                                                "https://tse3.mm.bing.net/th/id/OIP.QYfd2kVDqsJ_-8-QVo3yvgHaEK?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                temazcalAncestral.setMaxParticipants(8);
                                temazcalAncestral.setLatitude(11.24079);
                                temazcalAncestral.setLongitude(-74.19904);
                                services.add(temazcalAncestral);

                                ServiceOffering rappelEnCascadas = new ServiceOffering();
                                rappelEnCascadas.setName("Rappel en Cascadas");
                                rappelEnCascadas.setCategory("Tours");
                                rappelEnCascadas.setSubcategory("Aventura");
                                rappelEnCascadas.setDescription(
                                                "Descenso en rappel por cascadas naturales con equipo profesional");
                                rappelEnCascadas.setBasePrice(160000);
                                rappelEnCascadas.setDurationMinutes(240);
                                rappelEnCascadas.setImageUrls(List
                                                .of("https://tse2.mm.bing.net/th/id/OIP.F48ROM88XpjeLo67rL-qJwHaFj?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                rappelEnCascadas.setMaxParticipants(8);
                                rappelEnCascadas.setLatitude(11.24079);
                                rappelEnCascadas.setLongitude(-74.19904);
                                services.add(rappelEnCascadas);
                                break;

                        case 5: // Villa de Leyva
                                ServiceOffering rutaDeLosFosiles = new ServiceOffering();
                                rutaDeLosFosiles.setName("Ruta de los Fósiles");
                                rutaDeLosFosiles.setCategory("Tours");
                                rutaDeLosFosiles.setSubcategory("Educativo");
                                rutaDeLosFosiles
                                                .setDescription("Tour paleontológico con descubrimientos de fósiles y museos especializados");
                                rutaDeLosFosiles.setBasePrice(55000);
                                rutaDeLosFosiles.setDurationMinutes(240);
                                rutaDeLosFosiles.setImageUrls(
                                                List.of("https://th.bing.com/th/id/R.afa8e29958e50c504e6fb3096ca977bb?rik=7ULqdR1pwEhBDQ&pid=ImgRaw&r=0"));
                                rutaDeLosFosiles.setMaxParticipants(15);
                                rutaDeLosFosiles.setLatitude(5.6333);
                                rutaDeLosFosiles.setLongitude(-73.5333);
                                services.add(rutaDeLosFosiles);

                                ServiceOffering observatorioAstronomicoMuisca = new ServiceOffering();
                                observatorioAstronomicoMuisca.setName("Observatorio Astronómico Muisca");
                                observatorioAstronomicoMuisca.setCategory("Tours");
                                observatorioAstronomicoMuisca.setSubcategory("Cultural");
                                observatorioAstronomicoMuisca
                                                .setDescription("Observación estelar combinada con cosmogonía muisca en observatorio");
                                observatorioAstronomicoMuisca.setBasePrice(65000);
                                observatorioAstronomicoMuisca.setDurationMinutes(180);
                                observatorioAstronomicoMuisca.setImageUrls(
                                                List.of("https://th.bing.com/th/id/R.32acd1710c3c0f6e343dec661fcf9e79?rik=%2blwmqcHRzsoatg&pid=ImgRaw&r=0"));
                                observatorioAstronomicoMuisca.setMaxParticipants(15);
                                observatorioAstronomicoMuisca.setLatitude(5.6333);
                                observatorioAstronomicoMuisca.setLongitude(-73.5333);
                                services.add(observatorioAstronomicoMuisca);

                                ServiceOffering vinedosBoyacenses = new ServiceOffering();
                                vinedosBoyacenses.setName("Viñedos Boyacenses");
                                vinedosBoyacenses.setCategory("Tours");
                                vinedosBoyacenses.setSubcategory("Cultural");
                                vinedosBoyacenses.setDescription(
                                                "Tour de degustación de vinos en viñedos de alta altitud de Boyacá");
                                vinedosBoyacenses.setBasePrice(85000);
                                vinedosBoyacenses.setDurationMinutes(240);
                                vinedosBoyacenses
                                                .setImageUrls(List.of(
                                                                "https://tse2.mm.bing.net/th/id/OIP.Vgah6MmQQYE4OO9vmf7Q9AHaCu?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                vinedosBoyacenses.setMaxParticipants(12);
                                vinedosBoyacenses.setLatitude(5.7833);
                                vinedosBoyacenses.setLongitude(-73.0167);
                                services.add(vinedosBoyacenses);

                                ServiceOffering consultaConChaman = new ServiceOffering();
                                consultaConChaman.setName("Consulta con Chamán");
                                consultaConChaman.setCategory("Tours");
                                consultaConChaman.setSubcategory("Sanación");
                                consultaConChaman
                                                .setDescription("Sesión de sanación tradicional con chamán autorizado de comunidades locales");
                                consultaConChaman.setBasePrice(150000);
                                consultaConChaman.setDurationMinutes(90);
                                consultaConChaman.setImageUrls(List.of(
                                                "https://th.bing.com/th/id/R.fe4ae4786929081ad6cfa2efbc4acda9?rik=%2bPSjMI%2blB1ooOQ&riu=http%3a%2f%2fwww.proimagenescolombia.com%2fphotos%2f57150_4118_imagen__.jpg&ehk=MKpJ6vG2500PfrJuUXxy7WFivdhlkA83NDgPowz5HHk%3d&risl=&pid=ImgRaw&r=0"));
                                consultaConChaman.setMaxParticipants(1);
                                consultaConChaman.setLatitude(5.6333);
                                consultaConChaman.setLongitude(-73.5333);
                                services.add(consultaConChaman);

                                ServiceOffering retiroDeContemplacion = new ServiceOffering();
                                retiroDeContemplacion.setName("Retiro de Contemplación");
                                retiroDeContemplacion.setCategory("Tours");
                                retiroDeContemplacion.setSubcategory("Bienestar");
                                retiroDeContemplacion.setDescription(
                                                "Retiro de silencio y meditación en entornos naturales sagrados");
                                retiroDeContemplacion.setBasePrice(95000);
                                retiroDeContemplacion.setDurationMinutes(480);
                                retiroDeContemplacion.setImageUrls(List
                                                .of("https://tse3.mm.bing.net/th/id/OIP.F3Mp_02IN8eCT-I5ByTULgHaE8?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"));
                                retiroDeContemplacion.setMaxParticipants(8);
                                retiroDeContemplacion.setLatitude(5.6333);
                                retiroDeContemplacion.setLongitude(-73.5333);
                                services.add(retiroDeContemplacion);
                                break;
                }

                return services;
        }

        private ServiceOffering copyService(ServiceOffering original) {
                ServiceOffering copy = new ServiceOffering();
                copy.setName(original.getName());
                copy.setCategory(original.getCategory());
                copy.setSubcategory(original.getSubcategory());
                copy.setDescription(original.getDescription());
                copy.setBasePrice(original.getBasePrice());
                copy.setDurationMinutes(original.getDurationMinutes());
                copy.setImageUrls(new ArrayList<>(original.getImageUrls()));
                copy.setMaxParticipants(original.getMaxParticipants());
                copy.setLatitude(original.getLatitude());
                copy.setLongitude(original.getLongitude());
                return copy;
        }

        private void createSampleSchedules(List<ServiceOffering> services) {
                for (ServiceOffering serviceName : services) {
                        createScheduleForService(serviceName, LocalTime.of(9, 0));
                }
        }

        private void createScheduleForService(ServiceOffering service, LocalTime time) {
                String serviceName = service.getName();
                List<ServiceOffering> services = serviceRepository.findAll().stream()
                                .filter(s -> serviceName.equalsIgnoreCase(s.getName()))
                                .toList();

                for (ServiceOffering serv : services) {
                        setScheduleByCategory(serv, time);
                }
        }

        private void setScheduleByCategory(ServiceOffering serv, LocalTime time) {
                int duration = Math.max(30, serv.getDurationMinutes());

                List<ServiceSchedule> schedules = switch (serv.getCategory()) {
                        case "Cultural" -> List.of(
                                        buildSchedule(serv, time, EnumSet.of(
                                                        ServiceSchedule.DayWeek.MONDAY,
                                                        ServiceSchedule.DayWeek.TUESDAY,
                                                        ServiceSchedule.DayWeek.WEDNESDAY,
                                                        ServiceSchedule.DayWeek.THURSDAY,
                                                        ServiceSchedule.DayWeek.FRIDAY), duration),
                                        buildSchedule(serv, time.plusHours(2), EnumSet.of(
                                                        ServiceSchedule.DayWeek.SATURDAY,
                                                        ServiceSchedule.DayWeek.SUNDAY), duration));
                        case "Gastronomía" -> List.of(
                                        buildSchedule(serv, time, EnumSet.of(ServiceSchedule.DayWeek.DAILY), duration),
                                        buildSchedule(serv, time.plusHours(6),
                                                        EnumSet.of(ServiceSchedule.DayWeek.DAILY), duration));
                        case "Tours" -> List.of(
                                        buildSchedule(serv, time, EnumSet.of(
                                                        ServiceSchedule.DayWeek.MONDAY,
                                                        ServiceSchedule.DayWeek.WEDNESDAY,
                                                        ServiceSchedule.DayWeek.FRIDAY), duration),
                                        buildSchedule(serv, time.plusHours(4), EnumSet.of(
                                                        ServiceSchedule.DayWeek.TUESDAY,
                                                        ServiceSchedule.DayWeek.THURSDAY,
                                                        ServiceSchedule.DayWeek.SATURDAY), duration));
                        default -> List.of(
                                        buildSchedule(serv, time, EnumSet.of(ServiceSchedule.DayWeek.DAILY), duration));
                };

                schedules.forEach(scheduleService::save);
        }

        private ServiceSchedule buildSchedule(ServiceOffering service,
                        LocalTime start,
                        EnumSet<ServiceSchedule.DayWeek> days,
                        int durationMinutes) {
                ServiceSchedule schedule = new ServiceSchedule();
                schedule.setService(service);
                schedule.setDaysOfWeek(EnumSet.copyOf(days));
                schedule.setStartTime(start);
                schedule.setEndTime(start.plusMinutes(durationMinutes));
                schedule.setActive(true);
                return schedule;
        }

        // Métodos auxiliares originales
        private RoomType ensureType(Map<String, RoomType> existing,
                        String name, String desc, BigDecimal price, Integer cap, String image) {
                RoomType found = existing.get(name.toLowerCase(Locale.ROOT));
                if (found != null)
                        return found;

                RoomType rt = new RoomType();
                rt.setName(name);
                rt.setDescription(desc);
                rt.setBasePrice(price);
                rt.setCapacity(cap);
                rt.setImage(image);

                rt = roomTypeRepository.save(rt);
                existing.put(name.toLowerCase(Locale.ROOT), rt);
                return rt;
        }

        private String themeNameFor(int hotelId, int floor) {
                return switch (hotelId) {
                        case 1 -> switch (floor) {
                                case 1 -> "Balcones Coloniales";
                                case 2 -> "Brisa Marina";
                                case 3 -> "Palacio Virreinal";
                                case 4 -> "Casa de Familias";
                                default -> "Terraza Tropical";
                        };
                        case 2 -> switch (floor) {
                                case 1 -> "Finca Cafetera";
                                case 2 -> "Valle del Cocora";
                                case 3 -> "Balcón Montañero";
                                case 4 -> "Casa Paisa";
                                default -> "Guadual Eco";
                        };
                        case 3 -> switch (floor) {
                                case 1 -> "Mar de Siete Colores";
                                case 2 -> "Johnny Cay";
                                case 3 -> "Cayo Acuario";
                                case 4 -> "Casa Raizal";
                                default -> "Brisa Caribe";
                        };
                        case 4 -> switch (floor) {
                                case 1 -> "Tayrona Ancestral";
                                case 2 -> "Sierra Nevada";
                                case 3 -> "Ciudad Perdida";
                                case 4 -> "Kogui Sagrado";
                                default -> "Eco Tayrona";
                        };
                        case 5 -> switch (floor) {
                                case 1 -> "Plaza Mayor";
                                case 2 -> "Casa Colonial";
                                case 3 -> "Observatorio Muisca";
                                case 4 -> "Hogar Boyacense";
                                default -> "Viñedos Andinos";
                        };
                        default -> "Tema Regional";
                };
        }

        private Amenity mustAmenity(Map<String, Amenity> map, String name) {
                Amenity a = map.get(name);
                if (a == null) {
                        AmenityType type = determineAmenityType(name);
                        String image = getAmenityImage(name);
                        a = amenities.save(new Amenity(null, name, image, type));
                        map.put(name, a);
                }
                return a;
        }

        private AmenityType determineAmenityType(String name) {
                List<String> roomAmenities = List.of(
                                "TV", "Aire acondicionado", "Minibar",
                                "Caja fuerte", "Secador de pelo", "Cafetera", "Plancha",
                                "Balcon", "Cocineta", "Ropa de cama premium");
                return roomAmenities.contains(name) ? AmenityType.ROOM : AmenityType.HOTEL;
        }

        private String getAmenityImage(String name) {
                return switch (name) {
                        case "Restaurante" ->
                                "https://media.istockphoto.com/id/1428412216/es/foto/un-chef-masculino-vertiendo-salsa-en-la-comida.jpg?s=612x612&w=0&k=20&c=Wze2YwgkFMQOTWoxdiRYsUpa1azCIOm8yRaUEEYOgOU=";
                        case "Bar" ->
                                "https://media.istockphoto.com/id/1479800728/es/foto/grupo-de-amigos-bebiendo-y-brindando-por-un-vaso-de-cerveza-en-el-restaurante-cervecer%C3%ADa.jpg?s=612x612&w=0&k=20&c=DTSh43zs5IufLFoXHrt5-8crVg6N4CW6EszavEK02x4=";
                        case "Wifi gratis" ->
                                "https://media.istockphoto.com/id/1166056171/es/vector/s%C3%ADmbolo-futurista-de-wifi-poligonal-bajo-aislado-en-el-fondo-azul-oscuro.jpg?s=612x612&w=0&k=20&c=-lpeAdQqK7-sjxjq_tn-abKEGqaUXZHeOJ4XiU5yMKQ=";
                        case "Parqueadero gratis" ->
                                "https://media.istockphoto.com/id/1498925162/es/foto/cartel-azul-de-aparcamiento-montado-en-poste-en-el-aparcamiento-urbano-el-d%C3%ADa-de-verano.jpg?s=612x612&w=0&k=20&c=2uaHkrCPODThFSK1GAk8pBFOvR_Y9EFbhYTm1mIn3D0=";
                        case "Traslado aeropuerto" ->
                                "https://media.istockphoto.com/id/1554995991/es/foto/conductor-de-transporte-al-aeropuerto-hispano.jpg?s=612x612&w=0&k=20&c=bCNccohEVKZy93RhGrc8jmCWX7zJHgi2ZVkV9Cii9Rs=";
                        case "Gimnasio" ->
                                "https://media.istockphoto.com/id/1679800838/es/foto/primer-plano-de-los-pies-corredor-deportivo-corriendo-en-cinta-de-correr-en-el-gimnasio.jpg?s=612x612&w=0&k=20&c=7LGOBm4FBTIMdtjpXuPXT93kwvbt12EjnMYc3Hp6hnI=";
                        case "Spa/Sauna" ->
                                "https://media.istockphoto.com/id/2189087345/es/foto/mujer-relajada-en-la-sauna-del-centro-de-bienestar.jpg?s=612x612&w=0&k=20&c=4GV8VKMLxeVGxPETeFgyz1D-eSUTU67DXQu8zRP71CA=";
                        case "Piscina al aire libre" ->
                                "https://media.istockphoto.com/id/525409331/es/foto/padre-nadando-con-sus-dos-hijos-en-la-piscina.jpg?s=612x612&w=0&k=20&c=nh2T3VyKMyyqG_GkqOkto8GIZvOYyNjwPeOhyfJgDvQ=";
                        case "Aseo diario" ->
                                "https://media.istockphoto.com/id/1417833187/es/foto/limpiador-profesional-aspirando-una-alfombra.jpg?s=612x612&w=0&k=20&c=0_Gu2dqS0PMGHnPAhHsIMB4bFOshRakSwKwDxhIq7IE=";
                        case "CCTV" ->
                                "https://media.istockphoto.com/id/1695553956/es/foto/mujer-usando-la-c%C3%A1mara-de-vigilancia-en-su-casa.jpg?s=612x612&w=0&k=20&c=kIy1tDPPE3_88o49J5TziVlr7v72LD96q3pi0UAk0K4=";
                        case "Terraza" ->
                                "https://media.istockphoto.com/id/1132794287/es/foto/patio-con-muebles-de-jard%C3%ADn-y-sombrilla.jpg?s=612x612&w=0&k=20&c=Mg9Y9fcI2QB8Ww3WjH9GWIZjXlhUj8S2F_0fFKz-Oao=";
                        case "Salón de eventos" ->
                                "https://media.istockphoto.com/id/590034882/es/foto/mesa-de-restaurante-con-comida.jpg?s=612x612&w=0&k=20&c=BIQ8FBTlpj47c4OVA6AXkiM0bGXVZZ-EPKd7AuDYs0c=";
                        case "Desayuno incluido" ->
                                "https://media.istockphoto.com/id/1630504080/es/foto/desayuno-en-la-cama.jpg?s=612x612&w=0&k=20&c=Zr4TpaIxsLBlZz9aOPP8u6glIFRLpqf7tXq-8zD96GE=";
                        case "Jardín" ->
                                "https://media.istockphoto.com/id/964395046/es/foto/plantaci%C3%B3n-de-flores-en-flores-jard%C3%ADn-patio-trasero-de-la-mujer.jpg?s=612x612&w=0&k=20&c=JoUDn_9ESQ-Z0N-EUYJBk_tK3_lodouEzkAPXHKS96M=";
                        case "Jacuzzi" ->
                                "https://media.istockphoto.com/id/471177791/es/foto/mujer-en-el-spa.jpg?s=612x612&w=0&k=20&c=s3NsQRQRHFlvfXr5a2ub9EglzwBif1UxuPyo0e6573o=";
                        case "Frente a la playa" ->
                                "https://media.istockphoto.com/id/590069010/es/foto/descalzos-en-la-playa-caminando-hacia-la-luz-del-sol.jpg?s=612x612&w=0&k=20&c=auZbBBOSGLYhXcd4rWGgNwrUWYXCPqrnSU2KobENMxE=";
                        case "Alojamiento libre de humo" ->
                                "https://media.istockphoto.com/id/1441675063/es/foto/cartel-de-no-fumar-en-el-parque.jpg?s=612x612&w=0&k=20&c=Pq73fb3WPO_PlE5Ho0xpN6houGzujAh2NEHOg0jJBfY=";
                        case "Se admiten mascotas" ->
                                "https://media.istockphoto.com/id/1516239450/es/foto/amor-retrato-y-familia-con-perro-en-refugio-de-animales-para-adopci%C3%B3n-en-perrera.jpg?s=612x612&w=0&k=20&c=krBe-Pt0NC27qzf6upVuryyBvslI_EUlL6XrjwAr3hw=";
                        case "Se habla español" ->
                                "https://media.istockphoto.com/id/1084045650/es/foto/pregunta-hablas-espa%C3%B1ol-escrito-en-espa%C3%B1ol.jpg?s=612x612&w=0&k=20&c=58lS_KOKoM3fxJzfCPPlYTDkPRFMD56AlpBj2w9YKxk=";
                        case "Se habla inglés" ->
                                "https://media.istockphoto.com/id/528632533/es/foto/ingl%C3%A9s-espa%C3%B1ol-habla.jpg?s=612x612&w=0&k=20&c=yjqZjA4lgAH7yQNTgsncQ2CTgFhsnnEQuhAczuLu_jQ=";
                        case "TV" ->
                                "https://media.istockphoto.com/id/1563409200/es/foto/hombre-viendo-la-televisi%C3%B3n-con-el-mando-a-distancia-en-la-mano.jpg?s=612x612&w=0&k=20&c=-cV_CW__WqmqQ7W1tmX0yycRNmD0skEUbEnfFdxettA=";
                        case "Aire acondicionado" ->
                                "https://media.istockphoto.com/id/1368514998/es/foto/ajuste-manual-de-la-temperatura-en-el-aire-acondicionado.jpg?s=612x612&w=0&k=20&c=d67UDnq3Kqo6dmNw3YwxAaWuhMxm_yBAXtWkcHVEBCI=";
                        case "Minibar" ->
                                "https://media.istockphoto.com/id/1254741480/es/foto/mini-nevera.jpg?s=612x612&w=0&k=20&c=IF_88Ur4i35DLP3fD3adsE6QsG0OJBLd6fpo8fQTRgg=";
                        case "Caja fuerte" ->
                                "https://media.istockphoto.com/id/1282606903/es/foto/b%C3%B3veda-bancaria-cerrada-en-el-armario-en-casa-o-en-la-habitaci%C3%B3n-del-hotel.jpg?s=612x612&w=0&k=20&c=XUkBd3JpznvQGaoeSRWN5eJBlzpwT5sC_GJg2m1kRKQ=";
                        case "Secador de pelo" ->
                                "https://media.istockphoto.com/id/1281532877/es/foto/mujer-joven-en-una-peluquer%C3%ADa-peluquero-usando-secador-de-pelo.jpg?s=612x612&w=0&k=20&c=bIRlPa-MpI4Bir_pWGqoX2WSm4oqOk808egcUjepBbY=";
                        case "Cafetera" ->
                                "https://media.istockphoto.com/id/1033432408/es/foto/filtro-de-caf%C3%A9.jpg?s=612x612&w=0&k=20&c=Nf7qPxgALfsqlrm1VLG-SyN9wH_Q-2locst_h7ekUc0=";
                        case "Plancha" ->
                                "https://media.istockphoto.com/id/1368091437/es/foto/mujer-joven-planchando-de-cerca.jpg?s=612x612&w=0&k=20&c=UaZ_vCXJqSo2kuLDnpbAMHjMj2jGDBjvrmPebrYECiQ=";
                        case "Balcon" ->
                                "https://media.istockphoto.com/id/1086723866/es/foto/coloridas-flores-creciendo-en-macetas-en-el-balc%C3%B3n.jpg?s=612x612&w=0&k=20&c=b0UW7hjtAo8VYbX1-Wg6pKRoPOchx3H2dVgQvfdnQuU=";
                        case "Cocineta" ->
                                "https://media.istockphoto.com/id/1477430966/es/foto/mujer-preparando-mezcla-de-verduras-de-quinua-cocinada-en-una-sart%C3%A9n.jpg?s=612x612&w=0&k=20&c=Zo-7Tq2vhj2Pg-9NyTtX4YaIRW3EAQaB6BedsXMo-ww=";
                        case "Ropa de cama premium" ->
                                "https://media.istockphoto.com/id/1303630250/es/foto/toallas-de-ba%C3%B1o-blancas-limpias-en-el-dormitorio-perfectamente-limpio-comodidad-y-concepto.jpg?s=612x612&w=0&k=20&c=7A9zfaFNHdV9DdxS_0ZtjD_qcil5zeOJKeEJcPR4g2g=";
                        default ->
                                "https://media.istockphoto.com/id/1303630250/es/foto/toallas-de-ba%C3%B1o-blancas-limpias-en-el-dormitorio-perfectamente-limpio-comodidad-y-concepto.jpg?s=612x612&w=0&k=20&c=7A9zfaFNHdV9DdxS_0ZtjD_qcil5zeOJKeEJcPR4g2g=";
                };
        }

        private Set<Amenity> amenSet(Map<String, Amenity> map, String... names) {
                Set<Amenity> set = new HashSet<>();
                for (String n : names)
                        set.add(mustAmenity(map, n));
                return set;
        }

        private void seedReservations(List<Hotel> hotelList) {
                if (reservationRepo.count() > 0)
                        return; // no duplicar

                List<User> clients = userRepo.findAll().stream()
                                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("CLIENT")))
                                .toList();

                List<Room> rooms = roomRepository.findAll();

                Random random = new Random();
                LocalDate base = LocalDate.of(2025, 1, 1);
                int diasDelAnio = base.lengthOfYear(); // 365 días

                // Crear 15 reservas de ejemplo
                for (int i = 0; i < 15; i++) {
                        User user = clients.get(random.nextInt(clients.size()));
                        Room room = rooms.get(random.nextInt(rooms.size()));
                        Hotel hotel = room.getHotel();

                        // checkIn aleatorio dentro del año y checkOut 2 a 4 noches después
                        LocalDate checkIn = base.plusDays(random.nextInt(diasDelAnio));
                        LocalDate checkOut = checkIn.plusDays(random.nextInt(3) + 2);

                        // Asegurar que no se pase del año
                        if (checkOut.getYear() > 2025) {
                                checkOut = LocalDate.of(2025, 12, 31);
                        }

                        Reservation res = new Reservation();
                        res.setUser(user);
                        res.setHotel(hotel);
                        res.setRoom(room);
                        res.setCheckIn(checkIn);
                        res.setCheckOut(checkOut);
                        res.setStatus(Reservation.Status.CONFIRMED);

                        Reservation saved = reservationRepo.save(res);

                        // Crear locks por cada día
                        LocalDate d = checkIn;
                        while (d.isBefore(checkOut)) {
                                RoomLock lock = new RoomLock(room.getRoomId(), d, saved);
                                roomLockRepo.save(lock);
                                d = d.plusDays(1);
                        }
                }

        }

        private String pickIcon(int i) {
                int mod = i % 3;
                return switch (mod) {
                        case 1 -> "/images/icons/icono1.png";
                        case 2 -> "/images/icons/icono2.png";
                        default -> "/images/icons/icono3.png";
                };
        }

        private void seedDepartments(List<Hotel> hotelList) {
                if (departmentRepo.count() > 0)
                        return;

                String[] departmentNames = {
                                "Recepción", "Limpieza", "Mantenimiento", "Cocina",
                                "Servicio al Cliente", "Seguridad", "Recursos Humanos"
                };

                for (Hotel hotel : hotelList) {
                        for (String deptName : departmentNames) {
                                Department dept = new Department();
                                dept.setHotelId(hotel.getHotelId());
                                dept.setName(deptName);
                                departmentRepo.save(dept);
                        }
                }
        }

        private void seedStaffMembers(List<Hotel> hotelList) {
                if (staffMemberRepo.count() > 0)
                        return; // no duplicar

                // Obtener todos los users con rol OPERATOR
                List<User> operators = userRepo.findAll().stream()
                                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("OPERATOR")))
                                .toList();

                if (operators.isEmpty()) {
                        return;
                }

                List<Department> allDepartments = departmentRepo.findAll();
                Random random = new Random();

                // Índice para distribuir operadores de manera equitativa
                int operatorIndex = 0;

                for (Hotel hotel : hotelList) {
                        List<Department> hotelDepts = allDepartments.stream()
                                        .filter(d -> d.getHotelId().equals(hotel.getHotelId()))
                                        .toList();

                        // Asignar 1-2 staff members por departamento de cada hotel
                        for (Department dept : hotelDepts) {
                                int staffCount = random.nextInt(2) + 1; // 1-2 staff members por departamento

                                for (int i = 0; i < staffCount && operatorIndex < operators.size(); i++) {
                                        User user = operators.get(operatorIndex % operators.size());

                                        // Verificar que este user no esté ya asignado como staff member en este hotel
                                        if (!staffMemberRepo.existsByUserIdAndHotelId(user.getUserId(),
                                                        hotel.getHotelId())) {
                                                StaffMember staff = new StaffMember();
                                                staff.setUserId(user.getUserId());
                                                staff.setHotelId(hotel.getHotelId());
                                                staff.setDepartmentId(dept.getDepartmentId());

                                                staffMemberRepo.save(staff);
                                        }

                                        operatorIndex++;
                                }
                        }
                }
        }

        private void seedTasks() {
                if (taskRepo.count() > 0)
                        return;

                List<StaffMember> staffMembers = staffMemberRepo.findAll();
                List<Room> rooms = roomRepository.findAll();

                if (staffMembers.isEmpty() || rooms.isEmpty()) {
                        return;
                }

                // Crear exactamente 20 tareas específicas y variadas
                createSpecificTasks(staffMembers, rooms);
        }

        private void createSpecificTasks(List<StaffMember> staffMembers, List<Room> rooms) {
                // DELIVERY tasks - 7 tareas
                createDeliveryTask(staffMembers.get(0 % staffMembers.size()), rooms.get(0 % rooms.size()),
                                Task.TaskStatus.PENDING);
                createDeliveryTask(staffMembers.get(1 % staffMembers.size()), rooms.get(1 % rooms.size()),
                                Task.TaskStatus.PENDING);
                createDeliveryTask(staffMembers.get(2 % staffMembers.size()), rooms.get(2 % rooms.size()),
                                Task.TaskStatus.IN_PROGRESS);
                createDeliveryTask(staffMembers.get(3 % staffMembers.size()), rooms.get(3 % rooms.size()),
                                Task.TaskStatus.PENDING);
                createDeliveryTask(staffMembers.get(4 % staffMembers.size()), rooms.get(4 % rooms.size()),
                                Task.TaskStatus.DONE);
                createDeliveryTask(staffMembers.get(5 % staffMembers.size()), rooms.get(5 % rooms.size()),
                                Task.TaskStatus.PENDING);
                createDeliveryTask(staffMembers.get(6 % staffMembers.size()), rooms.get(6 % rooms.size()),
                                Task.TaskStatus.IN_PROGRESS);

                // GUIDING tasks - 6 tareas
                createGuidingTask(staffMembers.get(7 % staffMembers.size()), Task.TaskStatus.PENDING);
                createGuidingTask(staffMembers.get(8 % staffMembers.size()), Task.TaskStatus.IN_PROGRESS);
                createGuidingTask(staffMembers.get(9 % staffMembers.size()), Task.TaskStatus.PENDING);
                createGuidingTask(staffMembers.get(10 % staffMembers.size()), Task.TaskStatus.DONE);
                createGuidingTask(staffMembers.get(11 % staffMembers.size()), Task.TaskStatus.PENDING);
                createGuidingTask(staffMembers.get(12 % staffMembers.size()), Task.TaskStatus.CANCELED);

                // TO-DO tasks - 7 tareas
                createToDoTask(staffMembers.get(13 % staffMembers.size()), rooms.get(7 % rooms.size()),
                                Task.TaskStatus.PENDING);
                createToDoTask(staffMembers.get(14 % staffMembers.size()), rooms.get(8 % rooms.size()),
                                Task.TaskStatus.PENDING);
                createToDoTask(staffMembers.get(0 % staffMembers.size()), rooms.get(9 % rooms.size()),
                                Task.TaskStatus.IN_PROGRESS);
                createToDoTask(staffMembers.get(1 % staffMembers.size()), rooms.get(10 % rooms.size()),
                                Task.TaskStatus.PENDING);
                createToDoTask(staffMembers.get(2 % staffMembers.size()), rooms.get(11 % rooms.size()),
                                Task.TaskStatus.DONE);
                createToDoTask(staffMembers.get(3 % staffMembers.size()), null, Task.TaskStatus.PENDING);
                createToDoTask(staffMembers.get(4 % staffMembers.size()), null, Task.TaskStatus.IN_PROGRESS);
        }

        private void createDeliveryTask(StaffMember staff, Room room, Task.TaskStatus status) {
                Task task = new Task();
                task.setStaffId(staff.getStaffId());
                task.setRoomId(room.getRoomId());
                task.setType(Task.TaskType.DELIVERY);
                task.setStatus(status);
                taskRepo.save(task);
        }

        private void createGuidingTask(StaffMember staff, Task.TaskStatus status) {
                Task task = new Task();
                task.setStaffId(staff.getStaffId());
                task.setType(Task.TaskType.GUIDING);
                task.setStatus(status);
                taskRepo.save(task);
        }

        private void createToDoTask(StaffMember staff, Room room, Task.TaskStatus status) {
                Task task = new Task();
                task.setStaffId(staff.getStaffId());
                if (room != null) {
                        task.setRoomId(room.getRoomId());
                }
                task.setType(Task.TaskType.TO_DO);
                task.setStatus(status);
                taskRepo.save(task);
        }

        private void seedPaymentMethodsAndPayments() {
                if (paymentMethodRepo.count() > 0)
                        return; // No duplicar

                // Obtener algunos clientes
                List<User> clients = userRepo.findAll().stream()
                                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("CLIENT")))
                                .limit(3)
                                .toList();

                if (clients.isEmpty())
                        return;

                // Crear 3 métodos de pago
                PaymentMethod pm1 = new PaymentMethod();
                pm1.setUserId(clients.get(0));
                pm1.setType("TARJETA");
                pm1.setLastfour("4532");
                pm1.setHolderName(clients.get(0).getFullName());
                pm1.setBillingAddress("Calle 123 #45-67, Bogotá");
                paymentMethodRepo.save(pm1);

                PaymentMethod pm2 = new PaymentMethod();
                pm2.setUserId(clients.get(1 % clients.size()));
                pm2.setType("TARJETA");
                pm2.setLastfour("8765");
                pm2.setHolderName(clients.get(1 % clients.size()).getFullName());
                pm2.setBillingAddress("Carrera 10 #20-30, Medellín");
                paymentMethodRepo.save(pm2);

                PaymentMethod pm3 = new PaymentMethod();
                pm3.setUserId(clients.get(2 % clients.size()));
                pm3.setType("TARJETA");
                pm3.setLastfour("9012");
                pm3.setHolderName(clients.get(2 % clients.size()).getFullName());
                pm3.setBillingAddress("Avenida 5 #12-34, Cali");
                paymentMethodRepo.save(pm3);

                // Obtener algunas reservaciones
                List<Reservation> reservations = reservationRepo.findAll().stream()
                                .limit(10)
                                .toList();

                if (reservations.isEmpty())
                        return;

                // Crear 10 pagos con diferentes estados
                Payment payment1 = new Payment();
                payment1.setReservationId(reservations.get(0));
                payment1.setPaymentMethodId(pm1);
                payment1.setAmount(450000.00);
                payment1.setStatus("COMPLETED");
                paymentRepo.save(payment1);

                Payment payment2 = new Payment();
                payment2.setReservationId(reservations.get(1 % reservations.size()));
                payment2.setPaymentMethodId(pm2);
                payment2.setAmount(680000.00);
                payment2.setStatus("PENDING");
                paymentRepo.save(payment2);

                Payment payment3 = new Payment();
                payment3.setReservationId(reservations.get(2 % reservations.size()));
                payment3.setPaymentMethodId(pm3);
                payment3.setAmount(320000.00);
                payment3.setStatus("COMPLETED");
                paymentRepo.save(payment3);

                Payment payment4 = new Payment();
                payment4.setReservationId(reservations.get(3 % reservations.size()));
                payment4.setPaymentMethodId(pm1);
                payment4.setAmount(550000.00);
                payment4.setStatus("FAILED");
                paymentRepo.save(payment4);

                Payment payment5 = new Payment();
                payment5.setReservationId(reservations.get(4 % reservations.size()));
                payment5.setPaymentMethodId(pm2);
                payment5.setAmount(890000.00);
                payment5.setStatus("COMPLETED");
                paymentRepo.save(payment5);

                Payment payment6 = new Payment();
                payment6.setReservationId(reservations.get(5 % reservations.size()));
                payment6.setPaymentMethodId(pm3);
                payment6.setAmount(420000.00);
                payment6.setStatus("PENDING");
                paymentRepo.save(payment6);

                Payment payment7 = new Payment();
                payment7.setReservationId(reservations.get(6 % reservations.size()));
                payment7.setPaymentMethodId(pm1);
                payment7.setAmount(760000.00);
                payment7.setStatus("COMPLETED");
                paymentRepo.save(payment7);

                Payment payment8 = new Payment();
                payment8.setReservationId(reservations.get(7 % reservations.size()));
                payment8.setPaymentMethodId(pm2);
                payment8.setAmount(290000.00);
                payment8.setStatus("REFUNDED");
                paymentRepo.save(payment8);

                Payment payment9 = new Payment();
                payment9.setReservationId(reservations.get(8 % reservations.size()));
                payment9.setPaymentMethodId(pm3);
                payment9.setAmount(1250000.00);
                payment9.setStatus("COMPLETED");
                paymentRepo.save(payment9);

                Payment payment10 = new Payment();
                payment10.setReservationId(reservations.get(9 % reservations.size()));
                payment10.setPaymentMethodId(pm1);
                payment10.setAmount(510000.00);
                payment10.setStatus("PENDING");
                paymentRepo.save(payment10);
        }
}