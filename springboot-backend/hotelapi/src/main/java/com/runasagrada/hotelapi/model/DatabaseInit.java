package com.runasagrada.hotelapi.model;

import com.runasagrada.hotelapi.repository.*;
import com.runasagrada.hotelapi.service.ServiceScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.security.Provider.Service;
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

    @Override
    public void run(String... args) {
        // Datos originales: roles, usuarios y hoteles
        seedBasicData();

        // Nuevos datos: habitaciones y servicios
        List<Hotel> hotelList = hotels.findAll();
        seedRoomTypesAndRooms(hotelList);
        seedServicesForAllHotels(hotelList);
    }

    private void seedBasicData() {
        // --- Roles base ---
        Role adminRole = roleRepo.findByName("ADMIN").orElseGet(() -> roleRepo.save(new Role(null, "ADMIN")));
        Role operatorRole = roleRepo.findByName("OPERATOR").orElseGet(() -> roleRepo.save(new Role(null, "OPERATOR")));
        Role clientRole = roleRepo.findByName("CLIENT").orElseGet(() -> roleRepo.save(new Role(null, "CLIENT")));

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

        // --- 5 Operadores ---
        IntStream.rangeClosed(1, 5).forEach(i -> {
            String email = "op" + i + "@hotel.com";
            userRepo.findByEmail(email).orElseGet(() -> {
                User u = new User();
                u.setEmail(email);
                u.setPassword("op123");
                u.setFullName("Operador Hotel " + i);
                u.setPhone("301000000" + i);
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
                    "TV", "Aire acondicionado", "Minibar", "Caja fuerte", "Secador de pelo", "Cafetera", "Plancha",
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
                    "Restaurante", "Bar", "Wifi gratis", "Parqueadero gratis", "Traslado aeropuerto", "Gimnasio",
                    "Spa/Sauna", "Piscina al aire libre", "Aseo diario", "CCTV en zonas comunes",
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
                    "Gimnasio", "Salón de eventos", "Jardín"));

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
                    "Desayuno incluido", "Wifi gratis", "Parqueadero gratis", "Piscina al aire libre",
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
                    "Alojamiento libre de humo"));

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
                    "Se admiten mascotas", "Se habla español", "Se habla inglés"));

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
                new BigDecimal("120000"), 2, "https://picsum.photos/seed/rt_std/640/420");
        RoomType rtDel = ensureType(typesByName, "Deluxe Cultural",
                "Habitaciones amplias con elementos culturales auténticos de la región",
                new BigDecimal("180000"), 3, "https://picsum.photos/seed/rt_del/640/420");
        RoomType rtSuite = ensureType(typesByName, "Suite Ancestral",
                "Suites de lujo con sala separada y diseño premium colombiano",
                new BigDecimal("280000"), 4, "https://picsum.photos/seed/rt_suite/640/420");
        RoomType rtFam = ensureType(typesByName, "Familiar Colombiana",
                "Habitaciones familiares amplias con espacios conectados y temática local",
                new BigDecimal("220000"), 6, "https://picsum.photos/seed/rt_fam/640/420");
        RoomType rtEco = ensureType(typesByName, "Eco Boutique",
                "Habitación eco-friendly con materiales locales y energía renovable",
                new BigDecimal("200000"), 3, "https://picsum.photos/seed/rt_eco/640/420");

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
                        r.setCleStatus((i % 2 == 0) ? Room.CleaningStatus.DIRTY : Room.CleaningStatus.CLEAN);
                        r.setThemeName(themeNameFor(hotelOrdinal, floor));
                        r.getImages().add(
                                "https://picsum.photos/seed/room" + hotelOrdinal + "-" + floor + "-" + i + "/800/600");

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
        bandejaPaisa
                .setDescription("Bandeja paisa tradicional con frijoles, chicharrón, chorizo, morcilla, arepa y huevo");
        bandejaPaisa.setBasePrice(38000);
        bandejaPaisa.setDurationMinutes(60);
        bandejaPaisa.setImageUrls(List.of("https://i.blogs.es/bb0cca/bandeja_paisa/1200_900.jpg"));
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
                "https://www.semana.com/resizer/v2/GBBYJH5YMZC6PEINHE3HZZH4TY.jpg?auth=f21d7fbf15c15316b80dd213fb2c635e4445db8e08133172d69a4956d7f417db&smart=true&quality=75&width=1920&height=1080&fitfill=false"));
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
                List.of("https://www.cheekyfoods.com.au/cdn/shop/articles/Untitled_design_87.jpg?v=1698649815"));
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
                "https://media.istockphoto.com/id/1442283646/photo/lechona-with-rice-arepa-and-potato-on-a-white-plate-and-a-background-with-plants.jpg"));
        lechonaTolimense.setMaxParticipants(10);
        lechonaTolimense.setLatitude(4.4389);
        lechonaTolimense.setLongitude(-75.2322);
        services.add(lechonaTolimense);

        ServiceOffering tamalesBogotanos = new ServiceOffering();
        tamalesBogotanos.setName("Tamales Bogotanos");
        tamalesBogotanos.setCategory("Gastronomía");
        tamalesBogotanos.setSubcategory("Cundinamarca");
        tamalesBogotanos
                .setDescription("Masa de maíz rellena de pollo, cerdo y verduras, envuelta en hojas de plátano");
        tamalesBogotanos.setBasePrice(28000);
        tamalesBogotanos.setDurationMinutes(60);
        tamalesBogotanos.setImageUrls(
                List.of("https://www.eltiempo.com/files/image_1200_600/uploads/2023/11/23/655f995f17c49.jpeg"));
        tamalesBogotanos.setMaxParticipants(10);
        tamalesBogotanos.setLatitude(4.7110);
        tamalesBogotanos.setLongitude(-74.0721);
        services.add(tamalesBogotanos);

        ServiceOffering cazuelaDeMariscos = new ServiceOffering();
        cazuelaDeMariscos.setName("Cazuela de Mariscos");
        cazuelaDeMariscos.setCategory("Gastronomía");
        cazuelaDeMariscos.setSubcategory("Costa Caribe");
        cazuelaDeMariscos.setDescription("Cazuela con camarones, langostinos, pescado y moluscos en leche de coco");
        cazuelaDeMariscos.setBasePrice(48000);
        cazuelaDeMariscos.setDurationMinutes(60);
        cazuelaDeMariscos.setImageUrls(List.of(
                "https://media.istockphoto.com/id/607991782/es/foto/paella-tradicional-espa%C3%B1ola-con-marisco-y-pollo.jpg"));
        cazuelaDeMariscos.setMaxParticipants(10);
        cazuelaDeMariscos.setLatitude(10.3910);
        cazuelaDeMariscos.setLongitude(-75.4794);
        services.add(cazuelaDeMariscos);

        ServiceOffering moteDeQueso = new ServiceOffering();
        moteDeQueso.setName("Mote de Queso Costeño");
        moteDeQueso.setCategory("Gastronomía");
        moteDeQueso.setSubcategory("Costa Caribe");
        moteDeQueso.setDescription("Sopa espesa de ñame con queso costeño en cubos y un sofrito de cebolla y ajo");
        moteDeQueso.setBasePrice(30000);
        moteDeQueso.setDurationMinutes(60);
        moteDeQueso.setImageUrls(List.of("https://i.ytimg.com/vi/h5a-fB9s3fA/maxresdefault.jpg"));
        moteDeQueso.setMaxParticipants(10);
        moteDeQueso.setLatitude(10.3910);
        moteDeQueso.setLongitude(-75.4794);
        services.add(moteDeQueso);

        ServiceOffering changuaBogotana = new ServiceOffering();
        changuaBogotana.setName("Changua Bogotana");
        changuaBogotana.setCategory("Gastronomía");
        changuaBogotana.setSubcategory("Cundinamarca");
        changuaBogotana.setDescription("Sopa de leche con huevos, cebolla larga y cilantro, servida con pan tostado");
        changuaBogotana.setBasePrice(18000);
        changuaBogotana.setDurationMinutes(30);
        changuaBogotana.setImageUrls(List.of("https://i.ytimg.com/vi/r4FgfmO3zLg/maxresdefault.jpg"));
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
        tresLechesCosteño.setImageUrls(List.of("https://easyways.cl/storage/20211229090337postre-tres-leches.jpg"));
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
                .of("https://elrinconcolombiano.com/wp-content/uploads/2023/04/Manjar-blanco-receta-colombiana.jpg"));
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
                "https://www.shutterstock.com/image-photo/peruvian-cocadas-traditional-coconut-dessert-600nw-380640118.jpg"));
        cocadasIsleñas.setMaxParticipants(10);
        cocadasIsleñas.setLatitude(12.542499);
        cocadasIsleñas.setLongitude(-81.718369);
        services.add(cocadasIsleñas);

        ServiceOffering buñuelosDeYuca = new ServiceOffering();
        buñuelosDeYuca.setName("Buñuelos de Yuca");
        buñuelosDeYuca.setCategory("Gastronomía");
        buñuelosDeYuca.setSubcategory("Postre");
        buñuelosDeYuca.setDescription("Buñuelos esponjosos de yuca con queso, tradicionales de temporada navideña");
        buñuelosDeYuca.setBasePrice(12000);
        buñuelosDeYuca.setDurationMinutes(30);
        buñuelosDeYuca.setImageUrls(List.of("https://cdn.colombia.com/gastronomia/2011/08/03/chicha-1604.gif"));
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
                "https://www.elespectador.com/resizer/VQS-41ig6YKYg4qcH5zr5B1XXBw=/arc-anglerfish-arc2-prod-elespectador/public/GTELHVJGBZARLL3GLVUEGRCMJY.JPG"));
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
                "https://static.bainet.es/clip/315db07b-3610-42cc-9c94-8abe9baef742_source-aspect-ratio_1600w_0.jpg"));
        cuajadaConMelao.setMaxParticipants(10);
        cuajadaConMelao.setLatitude(5.6333);
        cuajadaConMelao.setLongitude(-73.5333);
        services.add(cuajadaConMelao);

        ServiceOffering bocadilloConQueso = new ServiceOffering();
        bocadilloConQueso.setName("Bocadillo con Queso");
        bocadilloConQueso.setCategory("Gastronomía");
        bocadilloConQueso.setSubcategory("Postre");
        bocadilloConQueso.setDescription("Dulce de guayaba con queso fresco, combinación tradicional santandereana");
        bocadilloConQueso.setBasePrice(7000);
        bocadilloConQueso.setDurationMinutes(15);
        bocadilloConQueso.setImageUrls(List.of(
                "https://api.photon.aremedia.net.au/wp-content/uploads/sites/4/2021/07/23/12909/HL1121E15-scaled.jpg"));
        bocadilloConQueso.setMaxParticipants(10);
        bocadilloConQueso.setLatitude(7.1193);
        bocadilloConQueso.setLongitude(-73.1227);
        services.add(bocadilloConQueso);

        ServiceOffering empanadasVallecaucanas = new ServiceOffering();
        empanadasVallecaucanas.setName("Empanadas Vallecaucanas");
        empanadasVallecaucanas.setCategory("Gastronomía");
        empanadasVallecaucanas.setSubcategory("Aperitivo");
        empanadasVallecaucanas.setDescription("Empanadas de masa de maíz rellenas de papa y carne, fritas en aceite");
        empanadasVallecaucanas.setBasePrice(15000);
        empanadasVallecaucanas.setDurationMinutes(30);
        empanadasVallecaucanas.setImageUrls(
                List.of("https://imagenes.eltiempo.com/files/image_1200_535/uploads/2024/02/20/65d4e89c2c395.jpeg"));
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
                "https://st2.depositphotos.com/1773130/7605/i/450/depositphotos_76054953-stock-photo-iced-coffee-in-a-tall.jpg"));
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
                "https://media.istockphoto.com/id/1181234339/es/foto/aguapanela-casera-fresca-agua-de-panela-o-aguadulce-una-popular-bebida-dulce-latinoamericana.jpg"));
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
                "https://www.elespectador.com/resizer/VQS-41ig6YKYg4qcH5zr5B1XXBw=/arc-anglerfish-arc2-prod-elespectador/public/GTELHVJGBZARLL3GLVUEGRCMJY.JPG"));
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
                .of("https://sabor.eluniverso.com/wp-content/uploads/2023/12/shutterstock_1665115558-1024x683.jpg"));
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
                List.of("https://imagenes.eltiempo.com/files/image_1200_535/uploads/2024/02/20/65d4e89c2c395.jpeg"));
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
        chichaDeMaiz.setImageUrls(List.of("https://cdn.colombia.com/gastronomia/2011/08/03/chicha-1604.gif"));
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
        cocoLocoIsleno.setImageUrls(List.of("https://jappi.com.co/wp-content/uploads/2023/03/Jappi-Final.webp"));
        cocoLocoIsleno.setMaxParticipants(10);
        cocoLocoIsleno.setLatitude(12.542499);
        cocoLocoIsleno.setLongitude(-81.718369);
        services.add(cocoLocoIsleno);

        ServiceOffering cataDeAguardiente = new ServiceOffering();
        cataDeAguardiente.setName("Cata de Aguardiente");
        cataDeAguardiente.setCategory("Gastronomía");
        cataDeAguardiente.setSubcategory("Bebida");
        cataDeAguardiente.setDescription("Degustación de aguardientes regionales con maridaje de aperitivos típicos");
        cataDeAguardiente.setBasePrice(25000);
        cataDeAguardiente.setDurationMinutes(45);
        cataDeAguardiente.setImageUrls(List.of(
                "https://desquite.com/en/wp-content/uploads/2025/03/Desquite-Tradicion-Artisanal-Authentic-Colombian-Aguardiente-m.webp"));
        cataDeAguardiente.setMaxParticipants(10);
        cataDeAguardiente.setLatitude(6.2442);
        cataDeAguardiente.setLongitude(-75.5736);
        services.add(cataDeAguardiente);

        // === TALLERES Y DANZAS CULTURALES (8) ===

        ServiceOffering tallerDeCumbia = new ServiceOffering();
        tallerDeCumbia.setName("Taller de Cumbia");
        tallerDeCumbia.setCategory("Cultural");
        tallerDeCumbia.setSubcategory("Danza");
        tallerDeCumbia.setDescription("Aprende los pasos tradicionales de cumbia con vestuario y música en vivo");
        tallerDeCumbia.setBasePrice(35000);
        tallerDeCumbia.setDurationMinutes(90);
        tallerDeCumbia.setImageUrls(List.of(
                "https://www.infobae.com/resizer/v2/H4BSBL5F7JEH7ELIPDGLKO5OBQ.jpg?auth=da6890b5ced46d170fe76fcc186b721e5495c108b33bec0fff4cfd53e527e538&smart=true&width=1200&height=900&quality=85"));
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
        tallerDeVallenato.setImageUrls(List.of("https://live.staticflickr.com/4136/4925539026_db69e6ec6e_b.jpg"));
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
                List.of("https://visitvalle.travel/wp-content/uploads/2024/08/festival-de-la-bandola-sevilla.webp"));
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
                "https://regionesnaturalescolombia.com/wp-content/uploads/2023/03/Traje-tipico-de-la-region-insular.png"));
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
        tallerDeCurrulao.setImageUrls(List.of("https://pbs.twimg.com/media/DUa0PLFUQAAlYJl.jpg"));
        tallerDeCurrulao.setMaxParticipants(10);
        tallerDeCurrulao.setLatitude(3.8890);
        tallerDeCurrulao.setLongitude(-77.0316);
        services.add(tallerDeCurrulao);

        ServiceOffering tallerDeCeramica = new ServiceOffering();
        tallerDeCeramica.setName("Taller de Cerámica Precolombina");
        tallerDeCeramica.setCategory("Cultural");
        tallerDeCeramica.setSubcategory("Artesanía");
        tallerDeCeramica.setDescription("Técnicas ancestrales de alfarería con arcillas locales y motivos indígenas");
        tallerDeCeramica.setBasePrice(55000);
        tallerDeCeramica.setDurationMinutes(180);
        tallerDeCeramica.setImageUrls(
                List.of("https://media-cdn.tripadvisor.com/media/photo-s/10/c7/82/f1/getlstd-property-photo.jpg"));
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
                .of("https://educafes.com/wp-content/uploads/2018/06/whatsapp-image-2018-06-25-at-4-59-55-pm3.jpeg"));
        tallerDeTextiles.setMaxParticipants(6);
        tallerDeTextiles.setLatitude(11.5444);
        tallerDeTextiles.setLongitude(-72.9088);
        services.add(tallerDeTextiles);

        ServiceOffering tallerDeJoyeria = new ServiceOffering();
        tallerDeJoyeria.setName("Taller de Joyería Precolombina");
        tallerDeJoyeria.setCategory("Cultural");
        tallerDeJoyeria.setSubcategory("Artesanía");
        tallerDeJoyeria.setDescription("Técnicas de orfebrería inspiradas en culturas Muisca, Tairona y Quimbaya");
        tallerDeJoyeria.setBasePrice(75000);
        tallerDeJoyeria.setDurationMinutes(180);
        tallerDeJoyeria.setImageUrls(List.of(
                "https://cafedecolombia.us/wp-content/uploads/2024/10/WhatsApp-Image-2024-10-14-at-6.19.32-PM-scaled.jpeg"));
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
                        List.of("https://viajerofacil.com/wp-content/uploads/2019/07/Webp.net-resizeimage-11-min.jpg"));
                tourCiudadAmurallada.setMaxParticipants(15);
                tourCiudadAmurallada.setLatitude(10.39972);
                tourCiudadAmurallada.setLongitude(-75.51444);
                services.add(tourCiudadAmurallada);

                ServiceOffering islasDelRosario = new ServiceOffering();
                islasDelRosario.setName("Islas del Rosario");
                islasDelRosario.setCategory("Tours");
                islasDelRosario.setSubcategory("Naturaleza");
                islasDelRosario.setDescription("Excursión en bote a islas coralinas con snorkel y tiempo de playa");
                islasDelRosario.setBasePrice(120000);
                islasDelRosario.setDurationMinutes(480);
                islasDelRosario.setImageUrls(List.of(
                        "https://www.cartagenaexplorer.com/wp-content/uploads/2020/07/Depositphotos_156273740_xl-2015-scaled.jpg"));
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
                        List.of("https://turismo.encolombia.com/wp-content/uploads/2019/09/Cartagena-de-Indias.jpg"));
                palenqueCultural.setMaxParticipants(12);
                palenqueCultural.setLatitude(10.2484);
                palenqueCultural.setLongitude(-75.2070);
                services.add(palenqueCultural);

                ServiceOffering ceremoniaDelCacaoSagrado = new ServiceOffering();
                ceremoniaDelCacaoSagrado.setName("Ceremonia del Cacao Sagrado");
                ceremoniaDelCacaoSagrado.setCategory("Experiencia");
                ceremoniaDelCacaoSagrado.setSubcategory("Ritual");
                ceremoniaDelCacaoSagrado
                        .setDescription("Ritual ancestral de conexión espiritual con el cacao como medicina sagrada");
                ceremoniaDelCacaoSagrado.setBasePrice(95000);
                ceremoniaDelCacaoSagrado.setDurationMinutes(120);
                ceremoniaDelCacaoSagrado
                        .setImageUrls(List.of("https://wakana.es/wp-content/uploads/2019/01/M-OF-W-YogaDSCF0152w.jpg"));
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
                        "https://tutourencartagena.com/wp-content/uploads/2017/01/buceo-en-cartagena-cartagena-colombia-tutourencartagena.jpg"));
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
                        "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/07/19/08/27/finca-el-ocaso-salento.jpg"));
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
                        "https://content-viajes.nationalgeographic.com.es/medio/2020/04/03/y-por-fin-el-valle_a092a848_1257x835.jpg"));
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
                        "https://www.infobae.com/new-resizer/GTDQWXVcyONBZkezz8NbuyrMMa4=/arc-anglerfish-arc2-prod-infobae/public/3WMFVPC5OFBF3LI652Z6V4LS2Q.jpg"));
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
                        "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTgxMTg3OTI=/original/318d3435-c2ea-4b59-94e9-fba4f10b99cd.jpeg"));
                cabalgataAndina.setMaxParticipants(10);
                cabalgataAndina.setLatitude(5.070275);
                cabalgataAndina.setLongitude(-75.513817);
                services.add(cabalgataAndina);

                ServiceOffering cataDeVinosDeAltura = new ServiceOffering();
                cataDeVinosDeAltura.setName("Cata de Vinos de Altura");
                cataDeVinosDeAltura.setCategory("Experiencia");
                cataDeVinosDeAltura.setSubcategory("Gastronomía");
                cataDeVinosDeAltura
                        .setDescription("Degustación de vinos colombianos de alta montaña con sommelier experto");
                cataDeVinosDeAltura.setBasePrice(125000);
                cataDeVinosDeAltura.setDurationMinutes(120);
                cataDeVinosDeAltura
                        .setImageUrls(List.of("https://raizdeguzman.com/wp-content/uploads/2019/05/vinedos-raiz.png"));
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
                        List.of("https://www.regiocantabrorum.es/img/publicaciones/441/cueva_los_tornillos_index.jpg"));
                hoyoSopladorYCuevaMorgan.setMaxParticipants(15);
                hoyoSopladorYCuevaMorgan.setLatitude(12.5847);
                hoyoSopladorYCuevaMorgan.setLongitude(-81.7005);
                services.add(hoyoSopladorYCuevaMorgan);

                ServiceOffering culturaRaizal = new ServiceOffering();
                culturaRaizal.setName("Cultura Raizal");
                culturaRaizal.setCategory("Tours");
                culturaRaizal.setSubcategory("Cultural");
                culturaRaizal.setDescription("Inmersión en cultura raizal con música, danza y gastronomía auténtica");
                culturaRaizal.setBasePrice(70000);
                culturaRaizal.setDurationMinutes(240);
                culturaRaizal.setImageUrls(List.of(
                        "https://regionesnaturalescolombia.com/wp-content/uploads/2023/03/Traje-tipico-de-la-region-insular.png"));
                culturaRaizal.setMaxParticipants(12);
                culturaRaizal.setLatitude(12.542499);
                culturaRaizal.setLongitude(-81.718369);
                services.add(culturaRaizal);

                ServiceOffering acuarioYJohnnyCay = new ServiceOffering();
                acuarioYJohnnyCay.setName("Acuario y Johnny Cay");
                acuarioYJohnnyCay.setCategory("Tours");
                acuarioYJohnnyCay.setSubcategory("Naturaleza");
                acuarioYJohnnyCay.setDescription("Viaje en bote a acuario natural y playa prístina con snorkel");
                acuarioYJohnnyCay.setBasePrice(95000);
                acuarioYJohnnyCay.setDurationMinutes(360);
                acuarioYJohnnyCay.setImageUrls(
                        List.of("https://www.arserver.info/img/excursions/40/acuario-rio-de-janeiro-aquario-16.jpg"));
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
                        "https://cdn.prod.website-files.com/64df6dd37ac6a0dbb9d03cb3/659bfb376102d36e421df403_6-resultado.jpeg"));
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
                        "https://www.esariri.com/wp-content/uploads/2022/09/296122789_3527452994148567_1098327290177545856_n.jpg"));
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
                tayronaAncestral.setDescription("Caminata a sitios arqueológicos indígenas Tayrona con guías nativos");
                tayronaAncestral.setBasePrice(90000);
                tayronaAncestral.setDurationMinutes(480);
                tayronaAncestral.setImageUrls(List
                        .of("https://ciudadperdidacolombia.com/wp-content/uploads/2023/12/todo-sobre-los-tairona.jpg"));
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
                        "https://content-viajes.nationalgeographic.com.es/medio/2019/09/16/istock-501625632_0eac7a9a_1200x630.jpg"));
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
                        List.of("https://media.istockphoto.com/id/153187546/es/foto/p%C3%A1jaro-watcher-silueta.jpg"));
                avistamientoAvesSierraNevada.setMaxParticipants(10);
                avistamientoAvesSierraNevada.setLatitude(10.8400);
                avistamientoAvesSierraNevada.setLongitude(-73.7200);
                services.add(avistamientoAvesSierraNevada);

                ServiceOffering temazcalAncestral = new ServiceOffering();
                temazcalAncestral.setName("Temazcal Ancestral");
                temazcalAncestral.setCategory("Experiencia");
                temazcalAncestral.setSubcategory("Ritual");
                temazcalAncestral.setDescription(
                        "Ceremonia de purificación en casa de sudor tradicional con plantas medicinales");
                temazcalAncestral.setBasePrice(115000);
                temazcalAncestral.setDurationMinutes(180);
                temazcalAncestral.setImageUrls(List.of(
                        "https://blumont.org/wp-content/uploads/2020/02/Apagada-del-fuego_17_VPeretti-1024x683.jpg"));
                temazcalAncestral.setMaxParticipants(8);
                temazcalAncestral.setLatitude(11.24079);
                temazcalAncestral.setLongitude(-74.19904);
                services.add(temazcalAncestral);

                ServiceOffering rappelEnCascadas = new ServiceOffering();
                rappelEnCascadas.setName("Rappel en Cascadas");
                rappelEnCascadas.setCategory("Tours");
                rappelEnCascadas.setSubcategory("Aventura");
                rappelEnCascadas.setDescription("Descenso en rappel por cascadas naturales con equipo profesional");
                rappelEnCascadas.setBasePrice(160000);
                rappelEnCascadas.setDurationMinutes(240);
                rappelEnCascadas.setImageUrls(List
                        .of("https://colombiavisible.com/wp-content/uploads/2023/04/Senderismo-Bogota-1-1024x576.jpg"));
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
                        List.of("https://humanidades.com/wp-content/uploads/2018/09/fosiles-e1579375905679.jpg"));
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
                observatorioAstronomicoMuisca.setImageUrls(List.of("https://pbs.twimg.com/media/DUa0PLFUQAAlYJl.jpg"));
                observatorioAstronomicoMuisca.setMaxParticipants(15);
                observatorioAstronomicoMuisca.setLatitude(5.6333);
                observatorioAstronomicoMuisca.setLongitude(-73.5333);
                services.add(observatorioAstronomicoMuisca);

                ServiceOffering vinedosBoyacenses = new ServiceOffering();
                vinedosBoyacenses.setName("Viñedos Boyacenses");
                vinedosBoyacenses.setCategory("Tours");
                vinedosBoyacenses.setSubcategory("Cultural");
                vinedosBoyacenses.setDescription("Tour de degustación de vinos en viñedos de alta altitud de Boyacá");
                vinedosBoyacenses.setBasePrice(85000);
                vinedosBoyacenses.setDurationMinutes(240);
                vinedosBoyacenses
                        .setImageUrls(List.of("https://raizdeguzman.com/wp-content/uploads/2019/05/vinedos-raiz.png"));
                vinedosBoyacenses.setMaxParticipants(12);
                vinedosBoyacenses.setLatitude(5.7833);
                vinedosBoyacenses.setLongitude(-73.0167);
                services.add(vinedosBoyacenses);

                ServiceOffering consultaConChaman = new ServiceOffering();
                consultaConChaman.setName("Consulta con Chamán");
                consultaConChaman.setCategory("Experiencia");
                consultaConChaman.setSubcategory("Sanación");
                consultaConChaman
                        .setDescription("Sesión de sanación tradicional con chamán autorizado de comunidades locales");
                consultaConChaman.setBasePrice(150000);
                consultaConChaman.setDurationMinutes(90);
                consultaConChaman.setImageUrls(List.of(
                        "https://www.cric-colombia.org/portal/wp-content/uploads/2024/06/IMG-20240621-WA0120-scaled.jpg"));
                consultaConChaman.setMaxParticipants(1);
                consultaConChaman.setLatitude(5.6333);
                consultaConChaman.setLongitude(-73.5333);
                services.add(consultaConChaman);

                ServiceOffering retiroDeContemplacion = new ServiceOffering();
                retiroDeContemplacion.setName("Retiro de Contemplación");
                retiroDeContemplacion.setCategory("Experiencia");
                retiroDeContemplacion.setSubcategory("Bienestar");
                retiroDeContemplacion.setDescription("Retiro de silencio y meditación en entornos naturales sagrados");
                retiroDeContemplacion.setBasePrice(95000);
                retiroDeContemplacion.setDurationMinutes(480);
                retiroDeContemplacion.setImageUrls(List
                        .of("https://elsolazsuites.com/wp-content/uploads/2022/06/ecoturismo-en-villa-de-leyva.jpg"));
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
        LocalDate baseDate = LocalDate.now();
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
            case "Experiencia" -> List.of(
                    buildSchedule(serv, time.plusHours(1), EnumSet.of(
                            ServiceSchedule.DayWeek.THURSDAY,
                            ServiceSchedule.DayWeek.FRIDAY), duration),
                    buildSchedule(serv, time.plusHours(3), EnumSet.of(
                            ServiceSchedule.DayWeek.SATURDAY), duration));
            case "Gastronomía" -> List.of(
                    buildSchedule(serv, time, EnumSet.of(ServiceSchedule.DayWeek.DAILY), duration),
                    buildSchedule(serv, time.plusHours(6), EnumSet.of(ServiceSchedule.DayWeek.DAILY), duration));
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
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80";
            case "Bar" ->
                "https://images.unsplash.com/photo-1514361892635-cebbd6b7a2c4?auto=format&fit=crop&w=400&q=80";
            case "Wifi gratis" ->
                "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80";
            case "Parqueadero gratis" ->
                "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80";
            case "Traslado aeropuerto" ->
                "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=400&q=80";
            case "Gimnasio" ->
                "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80";
            case "Spa/Sauna" ->
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80";
            case "Piscina al aire libre" ->
                "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80";
            case "Aseo diario" ->
                "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80";
            case "CCTV en zonas comunes" ->
                "https://images.unsplash.com/photo-1465101178521-c1a4c8a0a8c7?auto=format&fit=crop&w=400&q=80";
            case "Terraza" ->
                "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80";
            case "Salón de eventos" ->
                "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80";
            case "Desayuno incluido" ->
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80";
            case "Jardín" ->
                "https://images.unsplash.com/photo-1465101178521-c1a4c8a0a8c7?auto=format&fit=crop&w=400&q=80";
            case "Jacuzzi" ->
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80";
            case "Frente a la playa" ->
                "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80";
            case "Alojamiento libre de humo" ->
                "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80";
            case "Se admiten mascotas" ->
                "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80";
            case "Se habla español" ->
                "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=400&q=80";
            case "Se habla inglés" ->
                "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80";
            case "TV" -> "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80";
            case "Aire acondicionado" ->
                "https://images.unsplash.com/photo-1465101178521-c1a4c8a0a8c7?auto=format&fit=crop&w=400&q=80";
            case "Minibar" ->
                "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80";
            case "Caja fuerte" ->
                "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=400&q=80";
            case "Secador de pelo" ->
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80";
            case "Cafetera" ->
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80";
            case "Plancha" ->
                "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80";
            case "Balcon" ->
                "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80";
            case "Cocineta" ->
                "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80";
            case "Ropa de cama premium" ->
                "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80";
            default -> "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80";
        };
    }

    private Set<Amenity> amenSet(Map<String, Amenity> map, String... names) {
        Set<Amenity> set = new HashSet<>();
        for (String n : names)
            set.add(mustAmenity(map, n));
        return set;
    }

    private String pickIcon(int i) {
        int mod = i % 3;
        return switch (mod) {
            case 1 -> "/images/icons/icono1.png";
            case 2 -> "/images/icons/icono2.png";
            default -> "/images/icons/icono3.png";
        };
    }
}