package com.runasagrada.hotelapi.model;

import com.runasagrada.hotelapi.repository.AmenityRepository;
import com.runasagrada.hotelapi.repository.HotelRepository;
import com.runasagrada.hotelapi.repository.RoleRepository;
import com.runasagrada.hotelapi.repository.ServiceOfferingRepository;
import com.runasagrada.hotelapi.repository.ServiceScheduleRepository;
import com.runasagrada.hotelapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.runasagrada.hotelapi.model.ServiceSchedule.DayWeek;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
@RequiredArgsConstructor
public class DatabaseInit implements CommandLineRunner {

    private final RoleRepository roleRepo;
    private final UserRepository userRepo;
    private final HotelRepository hotels;
    private final AmenityRepository amenities;
    private final ServiceOfferingRepository serviceRepository;
    private final ServiceScheduleRepository serviceScheduleRepository;
    private List<Hotel> hotelCache;

    @Override
    public void run(String... args) {

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

        // --- 5 Operadores (op1…op5) ---
        IntStream.rangeClosed(1, 5).forEach(i -> {
            String email = "op" + i + "@hotel.com";
            userRepo.findByEmail(email).orElseGet(() -> {
                User u = new User();
                u.setEmail(email);
                u.setPassword("op123");
                u.setFullName("Operador Hotel " + i);
                u.setPhone("301000000" + i);
                u.setNationalId("OP-" + String.format("%03d", i));
                u.setSelectedPet(pickIcon(i)); // solo 3 íconos
                u.setRoles(Set.of(operatorRole));
                return userRepo.save(u);
            });
        });

        // --- 10 Clientes (client01…client10) ---
        IntStream.rangeClosed(1, 10).forEach(i -> {
            String email = "client" + String.format("%02d", i) + "@demo.com";
            userRepo.findByEmail(email).orElseGet(() -> {
                User u = new User();
                u.setEmail(email);
                u.setPassword("client123");
                u.setFullName("Cliente " + String.format("%02d", i));
                u.setPhone("30200000" + String.format("%02d", i));
                u.setNationalId("CLI-" + String.format("%04d", i));
                u.setSelectedPet(pickIcon(i)); // solo 3 íconos
                u.setRoles(Set.of(clientRole));
                return userRepo.save(u);
            });
        });

        // --- Hoteles + amenities (auto-creación de amenities faltantes) ---
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
            cartagena.setLatitude("10.39972"); // verificado
            cartagena.setLongitude("-75.51444"); // verificado
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
            eje.setLatitude("5.070275"); // Manizales como referencia
            eje.setLongitude("-75.513817"); // verificado
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
            sanandres.setLatitude("12.542499"); // verificado
            sanandres.setLongitude("-81.718369"); // verificado
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
            santamarta.setLatitude("11.24079"); // verificado
            santamarta.setLongitude("-74.19904"); // verificado
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
            leyva.setLatitude("5.6333"); // verificado
            leyva.setLongitude("-73.5333"); // verificado
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

        seedServiceOfferings();
    }

    private void seedServiceOfferings() {
        if (serviceRepository.count() > 0) {
            return;
        }

        // Experiencias principales
        createDefaultSchedules(createService(
                "Gastronomía Ancestral",
                "Comida",
                "",
                "Sabores auténticos de la cocina tradicional colombiana, preparados con ingredientes locales y técnicas ancestrales.",
                45900,
                60,
                List.of(ImageUrls.GASTRONOMIA_1, ImageUrls.GASTRONOMIA_2, ImageUrls.GASTRONOMIA_3),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Tours Sagrados",
                "Tours",
                "",
                "Expediciones guiadas por lugares místicos y sitios arqueológicos, conectando con la sabiduría ancestral.",
                65500,
                60,
                List.of(ImageUrls.TOURS_ARQUEOLOGICOS_1, ImageUrls.TOURS_ARQUEOLOGICOS_2,
                        ImageUrls.TOURS_ARQUEOLOGICOS_3),
                10,
                5.6333,
                -73.5333));

        createDefaultSchedules(createService(
                "Rituales de Bienestar",
                "Hotel",
                "",
                "Terapias tradicionales y ceremonias de sanación inspiradas en las prácticas indígenas colombianas.",
                75000,
                60,
                List.of(ImageUrls.RITUALES_1, ImageUrls.RITUALES_2, ImageUrls.RITUALES_3),
                10,
                4.7109,
                -74.0721));

        createDefaultSchedules(createService(
                "Hospedaje Boutique",
                "Hotel",
                "",
                "Habitaciones únicas diseñadas con elementos artesanales y decoración inspirada en culturas precolombinas.",
                120000,
                60,
                List.of(ImageUrls.HOSPEDAJE_BOUTIQUE_1, ImageUrls.HOSPEDAJE_BOUTIQUE_2, ImageUrls.HOSPEDAJE_BOUTIQUE_3),
                10,
                4.6370,
                -75.5710));

        createDefaultSchedules(createService(
                "Ecoturismo",
                "Tours",
                "",
                "Experiencias sostenibles que preservan y celebran la biodiversidad única de los ecosistemas colombianos.",
                55750,
                60,
                List.of(ImageUrls.ECOTURISMO_1, ImageUrls.ECOTURISMO_2, ImageUrls.ECOTURISMO_3),
                10,
                12.5847,
                -81.7005));

        createDefaultSchedules(createService(
                "Cultura Viva",
                "Tours",
                "",
                "Talleres de artesanías, música tradicional y danzas folclóricas con maestros de comunidades locales.",
                35000,
                60,
                List.of(ImageUrls.CULTURA_1, ImageUrls.CULTURA_2, ImageUrls.CULTURA_3),
                10,
                11.2408,
                -74.1990));

        createDefaultSchedules(createService(
                "Ceremonia del Cacao Sagrado",
                "Tours",
                "",
                "Participa en un ritual ancestral de conexión espiritual con el cacao como elemento sagrado.",
                85000,
                60,
                List.of(ImageUrls.CACAO_1, ImageUrls.CACAO_2, ImageUrls.CACAO_3),
                10,
                5.6333,
                -73.5333));

        createDefaultSchedules(createService(
                "Avistamiento de Aves",
                "Tours",
                "",
                "Descubre la biodiversidad de Colombia a través de sus especies de aves más representativas.",
                40000,
                60,
                List.of(ImageUrls.AVES_1, ImageUrls.AVES_2, ImageUrls.AVES_3),
                10,
                4.7109,
                -74.0721));

        createDefaultSchedules(createService(
                "Senderismo Místico",
                "Tours",
                "",
                "Explora caminos ancestrales y conecta con la naturaleza en rutas llenas de energía y tradición.",
                50000,
                60,
                List.of(ImageUrls.SENDERISMO_1, ImageUrls.SENDERISMO_2, ImageUrls.SENDERISMO_3),
                10,
                11.2408,
                -74.1990));

        createDefaultSchedules(createService(
                "Suite Presidencial",
                "Hotel",
                "",
                "La experiencia más exclusiva con vista panorámica, jacuzzi privado y servicio de mayordomo 24/7.",
                350.00,
                60,
                List.of(ImageUrls.SUITE_PRESIDENCIAL_1, ImageUrls.SUITE_PRESIDENCIAL_2, ImageUrls.SUITE_PRESIDENCIAL_3),
                2,
                4.6014,
                -74.0661));

        createDefaultSchedules(createService(
                "Cabañas Ecológicas",
                "Hotel",
                "",
                "Alojamiento sostenible en medio de la naturaleza, construido con materiales autóctonos y energía solar.",
                95.00,
                60,
                List.of(ImageUrls.CABANAS_1, ImageUrls.CABANAS_2, ImageUrls.CABANAS_3),
                4,
                6.2442,
                -75.5736));

        createDefaultSchedules(createService(
                "Taller de Café Premium",
                "Comida",
                "",
                "Aprende sobre el proceso del café colombiano desde el grano hasta la taza, con cata guiada.",
                30.00,
                60,
                List.of(ImageUrls.CAFE_1, ImageUrls.CAFE_2, ImageUrls.CAFE_3),
                10,
                5.0689,
                -75.5174));

        createDefaultSchedules(createService(
                "Cena con Chef Estrella",
                "Comida",
                "",
                "Menú degustación de 7 platos con maridaje de vinos, preparado por nuestro chef galardonado.",
                120.00,
                60,
                List.of(ImageUrls.CHEF_1, ImageUrls.CHEF_2, ImageUrls.CHEF_3),
                10,
                6.2518,
                -75.5636));

        createDefaultSchedules(createService(
                "Desayuno Tradicional",
                "Comida",
                "",
                "Desayuno completo con arepas, huevos pericos, chocolate caliente y frutas tropicales.",
                15.50,
                60,
                List.of(ImageUrls.DESAYUNO_1, ImageUrls.DESAYUNO_2, ImageUrls.DESAYUNO_3),
                10,
                10.9639,
                -74.7964));

        // Amenidades
        createDefaultSchedules(createService(
                "Piscina Infinity",
                "Hotel",
                "Piscina",
                "Piscina infinita con vistas panorámicas",
                49900,
                60,
                List.of(ImageUrls.PISCINA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Spa Ancestral",
                "Hotel",
                "Spa",
                "Terapias de sanación tradicional con técnicas indígenas",
                52900,
                60,
                List.of(ImageUrls.SPA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Restaurante Gourmet",
                "Hotel",
                "Restaurante",
                "Gastronomía fina con cocina regional colombiana",
                57900,
                60,
                List.of(ImageUrls.RESTAURANTE),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Bar de Cócteles",
                "Hotel",
                "Bar",
                "Cócteles artesanales con frutas y licores locales",
                45900,
                60,
                List.of(ImageUrls.BAR),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Taller de Artesanías",
                "Hotel",
                "Taller",
                "Talleres prácticos con artesanos locales",
                48900,
                90,
                List.of(ImageUrls.ARTESANIAS),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Biblioteca Cultural",
                "Hotel",
                "Biblioteca",
                "Colección de literatura e historia colombiana",
                41900,
                60,
                List.of(ImageUrls.BIBLIOTECA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Gimnasio Eco",
                "Hotel",
                "Gimnasio",
                "Centro de fitness con equipos sostenibles",
                39900,
                60,
                List.of(ImageUrls.GIMNASIO),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Jardín Botánico",
                "Hotel",
                "Jardín",
                "Jardín de plantas nativas con hierbas medicinales",
                44900,
                60,
                List.of(ImageUrls.JARDIN),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Salón de Eventos",
                "Hotel",
                "Eventos",
                "Espacio versátil para celebraciones y reuniones",
                55900,
                120,
                List.of(ImageUrls.SALON),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Terraza Mirador",
                "Hotel",
                "Terraza",
                "Terraza en azotea con vistas regionales",
                42900,
                60,
                List.of(ImageUrls.TERRAZA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Centro de Negocios",
                "Hotel",
                "Negocios",
                "Centro de negocios con tecnología moderna",
                53900,
                60,
                List.of(ImageUrls.NEGOSCIOS),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Servicio de Concierge",
                "Hotel",
                "Concierge",
                "Asistencia personalizada al huésped 24/7",
                46900,
                30,
                List.of(ImageUrls.CONCIERGE),
                10,
                10.3910,
                -75.4794));

        // Comida - Platos principales
        createDefaultSchedules(createService(
                "Bandeja Paisa Tradicional",
                "Comida",
                "Plato Principal",
                "Plato paisa completo con frijoles, arroz, chicharrón y arepa",
                35000,
                60,
                List.of(ImageUrls.BANDEJA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Sancocho Costeño",
                "Comida",
                "Plato Principal",
                "Guiso tradicional costeño con pescado, yuca y plátano",
                32000,
                60,
                List.of(ImageUrls.SANCOCHO),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Ajiaco Santafereño",
                "Comida",
                "Plato Principal",
                "Sopa de pollo y papa estilo Bogotá con mazorca y alcaparras",
                28000,
                60,
                List.of(ImageUrls.AJIACO),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Pescado Frito Isleño",
                "Comida",
                "Plato Principal",
                "Pescado frito con arroz de coco y patacones, estilo San Andrés",
                38000,
                60,
                List.of(ImageUrls.PESCADO),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Lechona Tolimense",
                "Comida",
                "Plato Principal",
                "Cerdo relleno asado con arroz y arvejas, tradición tolimense",
                42000,
                60,
                List.of(ImageUrls.LECHONA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Mondongo Antioqueño",
                "Comida",
                "Plato Principal",
                "Sopa tradicional de mondongo con verduras y hierbas",
                30000,
                60,
                List.of(ImageUrls.MONDONGO),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Cazuela de Mariscos",
                "Comida",
                "Plato Principal",
                "Cazuela de mariscos con leche de coco, estilo caribeño",
                45000,
                60,
                List.of(ImageUrls.CAZUELA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Trucha a la Plancha",
                "Comida",
                "Plato Principal",
                "Trucha a la plancha con hierbas de los Andes",
                36000,
                60,
                List.of(ImageUrls.TRUCHA),
                10,
                10.3910,
                -75.4794));

        // Postres
        createDefaultSchedules(createService(
                "Tres Leches Costeño",
                "Comida",
                "Postre",
                "Torta de tres leches con frutas tropicales",
                15000,
                30,
                List.of(ImageUrls.TRELECHES),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Arequipe con Brevas",
                "Comida",
                "Postre",
                "Brevas con dulce de leche, especialidad antioqueña",
                12000,
                30,
                List.of(ImageUrls.AREQUIPE),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Cocadas Isleñas",
                "Comida",
                "Postre",
                "Dulces de coco de la tradición isleña de San Andrés",
                8000,
                20,
                List.of(ImageUrls.COCADAS),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Cuajada con Melao",
                "Comida",
                "Postre",
                "Queso fresco con miel de caña, estilo boyacense",
                10000,
                20,
                List.of(ImageUrls.CUAJADA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Torta de Natas",
                "Comida",
                "Postre",
                "Torta de natas de la costa caribeña",
                14000,
                30,
                List.of(ImageUrls.TORTA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Manjar Blanco",
                "Comida",
                "Postre",
                "Delicia blanca del Valle del Cauca",
                11000,
                20,
                List.of(ImageUrls.MANJAR),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Postre de Níspero",
                "Comida",
                "Postre",
                "Postre de níspero de la región cafetera",
                13000,
                20,
                List.of(ImageUrls.NISPERO),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Dulce de Papayuela",
                "Comida",
                "Postre",
                "Conserva dulce de papayuela de montaña",
                9000,
                20,
                List.of(ImageUrls.PAPAYUELA),
                10,
                10.3910,
                -75.4794));

        // Bebidas
        createDefaultSchedules(createService(
                "Café de Origen Especial",
                "Comida",
                "Bebida",
                "Café de origen único de fincas locales",
                8000,
                15,
                List.of(ImageUrls.BEBIDACAFE),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Agua de Panela con Limón",
                "Comida",
                "Bebida",
                "Agua de panela con limón, refresco tradicional",
                5000,
                10,
                List.of(ImageUrls.AGUAPANELA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Jugo de Corozo",
                "Comida",
                "Bebida",
                "Jugo de fruta de palma corozo, especialidad caribeña",
                7000,
                10,
                List.of(ImageUrls.COROZO),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Chicha de Maíz",
                "Comida",
                "Bebida",
                "Bebida tradicional de maíz de cultura indígena",
                6000,
                20,
                List.of(ImageUrls.CHICHA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Lulada Vallecaucana",
                "Comida",
                "Bebida",
                "Bebida de lulo con hielo y limón",
                8000,
                15,
                List.of(ImageUrls.LULADA),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Chocolate Santafereño",
                "Comida",
                "Bebida",
                "Chocolate caliente con queso, tradición bogotana",
                9000,
                20,
                List.of(ImageUrls.CHOCOLATE),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Coco Loco Isleño",
                "Comida",
                "Bebida",
                "Cóctel de coco con ron local",
                15000,
                15,
                List.of(ImageUrls.COCO),
                10,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Aguardiente Antioqueño",
                "Comida",
                "Bebida",
                "Experiencia de degustación de licor de anís tradicional",
                12000,
                30,
                List.of(ImageUrls.AGUARDIENTE),
                10,
                10.3910,
                -75.4794));

        // Tours Cartagena
        createDefaultSchedules(createService(
                "Tour Ciudad Amurallada",
                "Tours",
                "Cultural",
                "Tour caminando por la Cartagena colonial con perspectivas históricas",
                45000,
                180,
                List.of(ImageUrls.AMURALLADA),
                15,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Islas del Rosario",
                "Tours",
                "Naturaleza",
                "Excursión en bote a islas coralinas con snorkel y tiempo de playa",
                85000,
                480,
                List.of(ImageUrls.ISLAS),
                15,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Palenque Cultural",
                "Tours",
                "Cultural",
                "Visita a San Basilio de Palenque, primer pueblo africano libre en América",
                65000,
                360,
                List.of(ImageUrls.PALENQUE),
                15,
                10.3910,
                -75.4794));

        // Tours Eje Cafetero
        createDefaultSchedules(createService(
                "Finca Cafetera Tradicional",
                "Tours",
                "Cultural",
                "Experiencia en finca cafetera con cosecha y degustación",
                55000,
                240,
                List.of(ImageUrls.FINCA),
                15,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Valle de Cocora",
                "Tours",
                "Naturaleza",
                "Caminata por bosque de palmas de cera, árbol nacional de Colombia",
                70000,
                300,
                List.of(ImageUrls.COCORA),
                15,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Pueblo Patrimonio Salamina",
                "Tours",
                "Cultural",
                "Tour por pueblo colonial con arquitectura tradicional y artesanías",
                40000,
                240,
                List.of(ImageUrls.PUEBLO),
                15,
                10.3910,
                -75.4794));

        // Tours San Andrés
        createDefaultSchedules(createService(
                "Hoyo Soplador y Cueva Morgan",
                "Tours",
                "Naturaleza",
                "Exploración de géiser natural y cueva de piratas",
                35000,
                240,
                List.of(ImageUrls.CUEVA),
                15,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Cultura Raizal",
                "Tours",
                "Cultural",
                "Inmersión en cultura raizal con música, danza y gastronomía",
                50000,
                240,
                List.of(ImageUrls.RAIZAL),
                15,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Acuario y Johnny Cay",
                "Tours",
                "Naturaleza",
                "Viaje en bote a acuario natural y playa prístina",
                75000,
                360,
                List.of(ImageUrls.ACUARIO),
                15,
                10.3910,
                -75.4794));

        // Tours Santa Marta
        createDefaultSchedules(createService(
                "Tayrona Ancestral",
                "Tours",
                "Cultural",
                "Caminata a sitios arqueológicos indígenas Tayrona",
                80000,
                480,
                List.of(ImageUrls.TAYRONA),
                15,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Ciudad Perdida Teyuna",
                "Tours",
                "Aventura",
                "Caminata de varios días a la Ciudad Perdida de la civilización Tayrona",
                450000,
                4320,
                List.of(ImageUrls.TEYUNA),
                12,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Avistamiento de Aves Sierra Nevada",
                "Tours",
                "Naturaleza",
                "Observación de aves en la cordillera costera más alta del mundo",
                60000,
                300,
                List.of(ImageUrls.AVES),
                12,
                10.3910,
                -75.4794));

        // Tours Villa de Leyva
        createDefaultSchedules(createService(
                "Ruta de los Fósiles",
                "Tours",
                "Educativo",
                "Tour paleontológico con descubrimientos de fósiles y museos",
                35000,
                240,
                List.of(ImageUrls.FOSILES),
                15,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Observatorio Astronómico",
                "Tours",
                "Educativo",
                "Experiencia de observación estelar con perspectivas astronómicas precolombinas",
                45000,
                180,
                List.of(ImageUrls.OBSERVATORIO),
                15,
                10.3910,
                -75.4794));

        createDefaultSchedules(createService(
                "Viñedos Boyacenses",
                "Tours",
                "Cultural",
                "Tour de degustación de vinos en viñedos de alta altitud de Boyacá",
                65000,
                240,
                List.of(ImageUrls.VINO),
                15,
                10.3910,
                -75.4794));
    }

    private ServiceOffering createService(String name,
            String category,
            String subcategory,
            String description,
            double basePrice,
            int durationMinutes,
            List<String> imageUrls,
            int maxParticipants,
            double latitude,
            double longitude) {
        ServiceOffering service = new ServiceOffering();
        service.setName(name);
        service.setCategory(category);
        service.setSubcategory(subcategory == null ? "" : subcategory);
        service.setDescription(description);
        service.setBasePrice(basePrice);
        service.setDurationMinutes(durationMinutes);
        service.setImageUrls(imageUrls == null ? new ArrayList<>() : new ArrayList<>(imageUrls));
        service.setMaxParticipants(maxParticipants);
        service.setLatitude(latitude);
        service.setLongitude(longitude);
        Hotel hotel = findNearestHotel(latitude, longitude);
        if (hotel != null) {
            service.setHotel(hotel);
        }
        service.setSchedules(new ArrayList<>());
        return serviceRepository.save(service);
    }

    private void createDefaultSchedules(ServiceOffering service) {
        List<ServiceSchedule> schedules = new ArrayList<>();
        if ("Comida".equalsIgnoreCase(service.getCategory()) || "Hotel".equalsIgnoreCase(service.getCategory())) {
            schedules.add(schedule(service, LocalTime.of(8, 0), DayWeek.DAILY));
            schedules.add(schedule(service, LocalTime.of(12, 0), DayWeek.DAILY));
            schedules.add(schedule(service, LocalTime.of(18, 0), DayWeek.DAILY));
        } else if ("Tours".equalsIgnoreCase(service.getCategory())) {
            schedules.add(schedule(service, LocalTime.of(8, 0), DayWeek.MONDAY));
            schedules.add(schedule(service, LocalTime.of(8, 0), DayWeek.WEDNESDAY));
            schedules.add(schedule(service, LocalTime.of(6, 30), DayWeek.SATURDAY));
        } else {
            schedules.add(schedule(service, LocalTime.of(15, 0), DayWeek.FRIDAY));
            schedules.add(schedule(service, LocalTime.of(10, 0), DayWeek.SUNDAY));
        }

        List<ServiceSchedule> saved = serviceScheduleRepository.saveAll(schedules);
        service.setSchedules(new ArrayList<>(saved));
        serviceRepository.save(service);
    }

    private ServiceSchedule schedule(ServiceOffering service, LocalTime startTime, DayWeek... days) {
        if (days == null || days.length == 0) {
            throw new IllegalArgumentException("At least one day must be provided");
        }
        ServiceSchedule schedule = new ServiceSchedule();
        schedule.setService(service);
        schedule.setDaysOfWeek(EnumSet.copyOf(Arrays.asList(days)));
        schedule.setStartTime(startTime);
        schedule.setEndTime(calculateEnd(startTime, service.getDurationMinutes()));
        schedule.setActive(true);
        return schedule;
    }

    private LocalTime calculateEnd(LocalTime startTime, int durationMinutes) {
        int clamped = Math.max(30, Math.min(durationMinutes, 480));
        return startTime.plusMinutes(clamped);
    }

    private Hotel findNearestHotel(double latitude, double longitude) {
        if (hotelCache == null || hotelCache.isEmpty()) {
            hotelCache = hotels.findAll();
        }

        Hotel nearest = null;
        double bestDistance = Double.MAX_VALUE;

        for (Hotel hotel : hotelCache) {
            Double lat = parseCoordinate(hotel.getLatitude());
            Double lon = parseCoordinate(hotel.getLongitude());
            if (lat == null || lon == null) {
                continue;
            }

            double distance = distanceSquared(latitude, longitude, lat, lon);
            if (distance < bestDistance) {
                bestDistance = distance;
                nearest = hotel;
            }
        }

        return nearest;
    }

    private Double parseCoordinate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private double distanceSquared(double lat1, double lon1, Double lat2, Double lon2) {
        if (lat2 == null || lon2 == null) {
            return Double.MAX_VALUE;
        }
        double dLat = lat1 - lat2;
        double dLon = lon1 - lon2;
        return dLat * dLat + dLon * dLon;
    }

    // --- Helpers para la Opción B ---
    private Amenity mustAmenity(Map<String, Amenity> map, String name) {
        Amenity a = map.get(name);
        if (a == null) {
            AmenityType type = determineAmenityType(name);
            // Imagen real de Unsplash o similar para cada amenity
            String image = switch (name) {
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
                // Amenities de habitación
                case "TV" ->
                    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80";
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
                default -> type == AmenityType.HOTEL
                        ? "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80"
                        : "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80";
            };
            a = amenities.save(new Amenity(null, name, image, type));
            map.put(name, a);
        }
        return a;
    }

    // Determina el tipo de amenity basado en su nombre
    private AmenityType determineAmenityType(String name) {
        // Lista de amenities típicas de habitación
        List<String> roomAmenities = List.of(
                "TV", "Aire acondicionado", "Minibar",
                "Caja fuerte", "Secador de pelo", "Cafetera", "Plancha",
                "Balcon", "Cocineta", "Ropa de cama premium");

        return roomAmenities.contains(name) ? AmenityType.ROOM : AmenityType.HOTEL;
    }

    private Set<Amenity> amenSet(Map<String, Amenity> map, String... names) {
        Set<Amenity> set = new HashSet<>();
        for (String n : names)
            set.add(mustAmenity(map, n));
        return set;
    }

    private String pickIcon(int i) {
        // rota entre 3 íconos disponibles
        int mod = i % 3;
        return switch (mod) {
            case 1 -> "/images/icons/icono1.png";
            case 2 -> "/images/icons/icono2.png";
            default -> "/images/icons/icono3.png";
        };
    }

    private static final class ImageUrls {
        private static final String GASTRONOMIA_1 = "https://www.paulinacocina.net/wp-content/uploads/2024/01/arepas-de-huevo-Paulina-Cocina-Recetas-1722251878.jpg";
        private static final String GASTRONOMIA_2 = "https://i.blogs.es/bb0cca/bandeja_paisa/1200_900.jpg";
        private static final String GASTRONOMIA_3 = "https://www.semana.com/resizer/v2/GBBYJH5YMZC6PEINHE3HZZH4TY.jpg?auth=f21d7fbf15c15316b80dd213fb2c635e4445db8e08133172d69a4956d7f417db&smart=true&quality=75&width=1920&height=1080&fitfill=false";
        private static final String TOURS_ARQUEOLOGICOS_1 = "https://paseovallenato.com/wp-content/uploads/nabusimake-y-espiritualidad-top.jpg";
        private static final String TOURS_ARQUEOLOGICOS_2 = "https://www.semana.com/resizer/v2/ZRKLGUHQV5GSTLO2SQSLNE7VGI.jpeg?auth=ca2d608992531b9ea91c1cd67c8f03d457ab55a7fae3299013a2a4b23c9baa0e&smart=true&quality=75&width=1280&height=720";
        private static final String TOURS_ARQUEOLOGICOS_3 = "https://portalenlace.com.co/wp-content/uploads/2024/04/nabusimake.jpeg";
        private static final String RITUALES_1 = "https://blumont.org/wp-content/uploads/2020/02/Apagada-del-fuego_17_VPeretti-1024x683.jpg";
        private static final String RITUALES_2 = "https://www.cric-colombia.org/portal/wp-content/uploads/2024/06/IMG-20240621-WA0120-scaled.jpg";
        private static final String RITUALES_3 = "https://www.cric-colombia.org/portal/wp-content/uploads/2018/09/02.-Once-a%C3%B1os-practicando-y-vivenciando-el-ritual-mayor-del-pueblo-nasa-el-sakhelu-territorio-de-Jambal%C3%B3.jpg";
        private static final String HOSPEDAJE_BOUTIQUE_1 = "https://www.estelarsantamar.com/media/uploads/cms_apps/imagenes/_URV1496_M_OK_2_1_1.jpg?q=pr:sharp/rs:fill/w:1920/h:800/f:jpg";
        private static final String HOSPEDAJE_BOUTIQUE_2 = "https://www.planessantamarta.com.co/wp-content/uploads/2023/11/habitacion-doble-con-vista-al-mar-hotel-be-la-sierra2.jpg";
        private static final String HOSPEDAJE_BOUTIQUE_3 = "https://be-la-sierra-santa-marta.santamarta-choice-hotels.com/data/Images/OriginalPhoto/12137/1213775/1213775257/image-santa-marta-magdalena-hotel-be-la-sierra-46.JPEG";
        private static final String ECOTURISMO_1 = "https://elsolazsuites.com/wp-content/uploads/2022/06/ecoturismo-en-villa-de-leyva.jpg";
        private static final String ECOTURISMO_2 = "https://tutourencartagena.com/wp-content/uploads/2017/01/buceo-en-cartagena-cartagena-colombia-tutourencartagena.jpg";
        private static final String ECOTURISMO_3 = "https://radionacional-v3.s3.amazonaws.com/s3fs-public/styles/portadas_relaciona_4_3/public/node/article/field_image/San%20Andr%C3%A9s%20Colprensa.jpg?h=96a96008&itok=31WwVuLy";
        private static final String CULTURA_1 = "https://www.infobae.com/resizer/v2/H4BSBL5F7JEH7ELIPDGLKO5OBQ.jpg?auth=da6890b5ced46d170fe76fcc186b721e5495c108b33bec0fff4cfd53e527e538&smart=true&width=1200&height=900&quality=85";
        private static final String CULTURA_2 = "https://live.staticflickr.com/4136/4925539026_db69e6ec6e_b.jpg";
        private static final String CULTURA_3 = "https://visitvalle.travel/wp-content/uploads/2024/08/festival-de-la-bandola-sevilla.webp";
        private static final String CACAO_1 = "https://wakana.es/wp-content/uploads/2019/01/M-OF-W-YogaDSCF0152w.jpg";
        private static final String CACAO_2 = "https://thehouseofaia.com/wp-content/uploads/2024/02/240111-cacao-img.webp";
        private static final String CACAO_3 = "https://bodaespiritual.com/wp-content/uploads/2023/09/ceremonia-del-cacao-1200x646.png";
        private static final String AVES_1 = "https://cdn.prod.website-files.com/64df6dd37ac6a0dbb9d03cb3/659bfb376102d36e421df403_6-resultado.jpeg";
        private static final String AVES_2 = "https://blogs.eluniversal.com.co/sites/default/files/styles/interna/public/2022-09/colibri-portada-shutterstock_1176281404.jpg?itok=m9cp2BgQ";
        private static final String AVES_3 = "https://www.rcnradio.com/_next/image?url=https%3A%2F%2Ffiles.rcnradio.com%2Fpublic%2Fstyles%2F16_9%2Fpublic%2F2024-05%2Fimg_0718_0.jpg%3FVersionId%3DkGlGqZsZOwJW_Cu84R1PGspi.rxCp6h6%26itok%3DBnhqtmHX&w=3840&q=75";
        private static final String SENDERISMO_1 = "https://www.esariri.com/wp-content/uploads/2022/09/296122789_3527452994148567_1098327290177545856_n.jpg";
        private static final String SENDERISMO_2 = "https://bogota.gov.co/sites/default/files/2022-08/la-aguadora.jpg";
        private static final String SENDERISMO_3 = "https://colombiavisible.com/wp-content/uploads/2023/04/Senderismo-Bogota-1-1024x576.jpg";
        private static final String SUITE_PRESIDENCIAL_1 = "https://www.sofitelbarucalablanca.com/wp-content/uploads/sites/19/2023/04/DUF_7068-v-ok-1170x780.jpg";
        private static final String SUITE_PRESIDENCIAL_2 = "https://s3.amazonaws.com/static-webstudio-accorhotels-usa-1.wp-ha.fastbooking.com/wp-content/uploads/sites/19/2022/03/11175445/DUF_7063-v-ok-1170x780.jpg";
        private static final String SUITE_PRESIDENCIAL_3 = "https://www.sofitelbarucalablanca.com/wp-content/uploads/sites/19/2023/04/DUF_7066-v-ok-1170x780.jpg";
        private static final String CABANAS_1 = "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTgxMTg3OTI=/original/318d3435-c2ea-4b59-94e9-fba4f10b99cd.jpeg";
        private static final String CABANAS_2 = "https://a0.muscache.com/im/pictures/miso/Hosting-25479833/original/80ae5655-034b-4573-8b87-9492772cc2c3.jpeg";
        private static final String CABANAS_3 = "https://a0.muscache.com/im/pictures/hosting/Hosting-12347806/original/afebb259-a5ce-4057-a93c-b98e200e0678.jpeg";
        private static final String CAFE_1 = "https://educafes.com/wp-content/uploads/2018/06/whatsapp-image-2018-06-25-at-4-59-55-pm3.jpeg";
        private static final String CAFE_2 = "https://educafes.com/wp-content/uploads/2015/12/img_20151130_111827469.jpg";
        private static final String CAFE_3 = "https://cafedecolombia.us/wp-content/uploads/2024/10/WhatsApp-Image-2024-10-14-at-6.19.32-PM-scaled.jpeg";
        private static final String CHEF_1 = "https://revistamomentos.co/wp-content/uploads/2019/11/Plato-sostenible-1900x1266_c.jpeg";
        private static final String CHEF_2 = "https://radionacional-v3.s3.amazonaws.com/s3fs-public/styles/portadas_relaciona_4_3/public/node/article/field_image/COLP_EXT_127797.jpg?h=f639aea9&itok=FrRSntMG";
        private static final String CHEF_3 = "https://www.metropolitan-touring.com/wp-content/uploads/2024/04/Cande.webp";
        private static final String DESAYUNO_1 = "https://i.ytimg.com/vi/r4FgfmO3zLg/maxresdefault.jpg";
        private static final String DESAYUNO_2 = "https://saboresdecolombianj.com/wp-content/uploads/2025/04/HUEVOS-Y-AREPA-CON-QUESO.jpg";
        private static final String DESAYUNO_3 = "https://live.staticflickr.com/6209/6147056621_15c60d28cf_b.jpg";
        private static final String PISCINA = "https://www.patiodepilar.com/img/cms/Piscina%20Infinity/piscina-infinita-que-es.jpg";
        private static final String SPA = "https://cf.bstatic.com/xdata/images/hotel/max1024x768/483180906.jpg?k=cb923aa311360020d113175cd13556cafbe65103f2c2ab90a5e7553fab302c03&o=&hp=1";
        private static final String RESTAURANTE = "https://lirp.cdn-website.com/ba701a07/dms3rep/multi/opt/Hotel-Las-Americas-Cartagena-de-Indias-Colombia---Las-Americas-Hotels-Group---Gastronom-C3-ADa---Erre-de-Ram-C3-B3n-Freixa-6-640w.png";
        private static final String BAR = "https://www.palladiohotelbuenosaires.com/wp-content/uploads/sites/7/2021/11/palladio_hotel_mgallery_restaurant_negresco_bar_slide_01-2200x1200.jpg";
        private static final String ARTESANIAS = "https://media-cdn.tripadvisor.com/media/photo-s/10/c7/82/f1/getlstd-property-photo.jpg";
        private static final String BIBLIOTECA = "https://media.admagazine.com/photos/6585f094b83aa25ed6cd5397/master/w_1600%2Cc_limit/Library%2520Hotel.jpg";
        private static final String GIMNASIO = "https://image-tc.galaxy.tf/wijpeg-blu54hydt85v0io6vu4lmnjrr/gimnasio_standard.jpg?crop=112%2C0%2C1777%2C1333";
        private static final String JARDIN = "https://z.cdrst.com/foto/hotel-sf/123119a8/granderesp/foto-hotel-12310efe.jpg";
        private static final String SALON = "https://www.hotelestequendama.com.co/assets/cache/uploads/tequendama-hoteles/Hotel%20Tequendama%20Bogot%C3%A1/salas/salon-crystal-view/1920x1080/interior-sala-crystal-view-mesas-boda-tequendama-hoteles-santa-fe-bogota-colombia-1691572149.jpg";
        private static final String TERRAZA = "https://media-cdn.tripadvisor.com/media/photo-s/06/74/87/fc/best-western-plus-93.jpg";
        private static final String NEGOSCIOS = "https://img.pikbest.com/wp/202346/wood-room-modern-style-business-meeting-in-3d-rendering_9730531.jpg!w700wp";
        private static final String CONCIERGE = "https://www.ncakey.org/wp-content/uploads/2017/10/bell-2.jpg";
        private static final String BANDEJA = "https://i.blogs.es/bb0cca/bandeja_paisa/1200_900.jpg";
        private static final String SANCOCHO = "https://www.cheekyfoods.com.au/cdn/shop/articles/Untitled_design_87.jpg?v=1698649815";
        private static final String AJIACO = "https://www.semana.com/resizer/v2/GBBYJH5YMZC6PEINHE3HZZH4TY.jpg?auth=f21d7fbf15c15316b80dd213fb2c635e4445db8e08133172d69a4956d7f417db&smart=true&quality=75&width=1920&height=1080&fitfill=false";
        private static final String PESCADO = "https://us.123rf.com/450wm/echeverriurrealuis/echeverriurrealuis2311/echeverriurrealuis231100466/218354595-fried-horse-mackerel-fish-with-coconut-rice-patacon-and-vegetable-salad.jpg";
        private static final String LECHONA = "https://media.istockphoto.com/id/1442283646/photo/lechona-with-rice-arepa-and-potato-on-a-white-plate-and-a-background-with-plants.jpg?s=612x612&w=0&k=20&c=3GsgmLQfsWEJcPjOld1n2Fhhb2kICye50IU557P7m4I=";
        private static final String MONDONGO = "https://media.istockphoto.com/id/1205769953/photo/mondongo-typical-dish-of-the-center-of-colombia.jpg?s=612x612&w=0&k=20&c=BJL_ngH3nOc_LRkxFAdl8j2OCaAcpNGQ9w765AEmkZM=";
        private static final String CAZUELA = "https://media.istockphoto.com/id/607991782/es/foto/paella-tradicional-espa%C3%B1ola-con-marisco-y-pollo.jpg?s=612x612&w=0&k=20&c=2q56wjPHIcSqje4SbsJdvA7Zy0I2Xy67XSdE6pQrmlo=";
        private static final String TRUCHA = "https://thumbs.dreamstime.com/b/prendedero-de-la-trucha-cocinada-109983171.jpg";
        private static final String TRELECHES = "https://easyways.cl/storage/20211229090337postre-tres-leches.jpg";
        private static final String AREQUIPE = "https://easyways.cl/storage/20211229090337postre-tres-leches.jpg";
        private static final String COCADAS = "https://www.shutterstock.com/image-photo/peruvian-cocadas-traditional-coconut-dessert-600nw-380640118.jpg";
        private static final String CUAJADA = "https://static.bainet.es/clip/315db07b-3610-42cc-9c94-8abe9baef742_source-aspect-ratio_1600w_0.jpg";
        private static final String TORTA = "https://api.photon.aremedia.net.au/wp-content/uploads/sites/4/2021/07/23/12909/HL1121E15-scaled.jpg?fit=2560%2C2134";
        private static final String MANJAR = "https://elrinconcolombiano.com/wp-content/uploads/2023/04/Manjar-blanco-receta-colombiana.jpg";
        private static final String NISPERO = "https://cloudfront-us-east-1.images.arcpublishing.com/infobae/ETKI3DOT3NFMBEKOML6FNT346M.jpg";
        private static final String PAPAYUELA = "https://yucatan.travel/wp-content/uploads/2022/09/365-Sabores-en-Yucata%CC%81n-Dulce-de-papaya-con-queso-de-bola-3.jpg";
        private static final String BEBIDACAFE = "https://st2.depositphotos.com/1773130/7605/i/450/depositphotos_76054953-stock-photo-iced-coffee-in-a-tall.jpg";
        private static final String AGUAPANELA = "https://media.istockphoto.com/id/1181234339/es/foto/aguapanela-casera-fresca-agua-de-panela-o-aguadulce-una-popular-bebida-dulce-latinoamericana.jpg?s=612x612&w=0&k=20&c=wv78sAHw4zohimed6F0xdQrE7VIGtL6whjbpagllnek=";
        private static final String COROZO = "https://imagenes.eltiempo.com/files/image_1200_535/uploads/2024/02/20/65d4e89c2c395.jpeg";
        private static final String CHICHA = "https://cdn.colombia.com/gastronomia/2011/08/03/chicha-1604.gif";
        private static final String LULADA = "https://www.elespectador.com/resizer/VQS-41ig6YKYg4qcH5zr5B1XXBw=/arc-anglerfish-arc2-prod-elespectador/public/GTELHVJGBZARLL3GLVUEGRCMJY.JPG";
        private static final String CHOCOLATE = "https://sabor.eluniverso.com/wp-content/uploads/2023/12/shutterstock_1665115558-1024x683.jpg";
        private static final String COCO = "https://jappi.com.co/wp-content/uploads/2023/03/Jappi-Final.webp";
        private static final String AGUARDIENTE = "https://desquite.com/en/wp-content/uploads/2025/03/Desquite-Tradicion-Artisanal-Authentic-Colombian-Aguardiente-m.webp";
        private static final String AMURALLADA = "https://viajerofacil.com/wp-content/uploads/2019/07/Webp.net-resizeimage-11-min.jpg";
        private static final String ISLAS = "https://www.cartagenaexplorer.com/wp-content/uploads/2020/07/Depositphotos_156273740_xl-2015-scaled.jpg";
        private static final String PALENQUE = "https://turismo.encolombia.com/wp-content/uploads/2019/09/Cartagena-de-Indias.jpg";
        private static final String FINCA = "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/07/19/08/27/finca-el-ocaso-salento.jpg?w=900&h=-1&s=1";
        private static final String COCORA = "https://content-viajes.nationalgeographic.com.es/medio/2020/04/03/y-por-fin-el-valle_a092a848_1257x835.jpg";
        private static final String PUEBLO = "https://www.infobae.com/new-resizer/GTDQWXVcyONBZkezz8NbuyrMMa4=/arc-anglerfish-arc2-prod-infobae/public/3WMFVPC5OFBF3LI652Z6V4LS2Q.jpg";
        private static final String CUEVA = "https://www.regiocantabrorum.es/img/publicaciones/441/cueva_los_tornillos_index.jpg";
        private static final String RAIZAL = "https://regionesnaturalescolombia.com/wp-content/uploads/2023/03/Traje-tipico-de-la-region-insular.png";
        private static final String ACUARIO = "https://www.arserver.info/img/excursions/40/acuario-rio-de-janeiro-aquario-16.jpg";
        private static final String TAYRONA = "https://ciudadperdidacolombia.com/wp-content/uploads/2023/12/todo-sobre-los-tairona.jpg";
        private static final String TEYUNA = "https://content-viajes.nationalgeographic.com.es/medio/2019/09/16/istock-501625632_0eac7a9a_1200x630.jpg";
        private static final String AVES = "https://media.istockphoto.com/id/153187546/es/foto/p%C3%A1jaro-watcher-silueta.jpg?s=612x612&w=0&k=20&c=Z7bdiVI9amwRG9NA8OEiNaM93F2CmTFQLzBkwfxUCFM=";
        private static final String FOSILES = "https://humanidades.com/wp-content/uploads/2018/09/fosiles-e1579375905679.jpg";
        private static final String OBSERVATORIO = "https://pbs.twimg.com/media/DUa0PLFUQAAlYJl.jpg";
        private static final String VINO = "https://raizdeguzman.com/wp-content/uploads/2019/05/vinedos-raiz.png";
    }
}
