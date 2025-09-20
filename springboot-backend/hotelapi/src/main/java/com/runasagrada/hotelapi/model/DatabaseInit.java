package com.runasagrada.hotelapi.model;

import com.runasagrada.hotelapi.repository.AmenityRepository;
import com.runasagrada.hotelapi.repository.HotelRepository;
import com.runasagrada.hotelapi.repository.RoleRepository;
import com.runasagrada.hotelapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
@RequiredArgsConstructor
public class DatabaseInit implements CommandLineRunner {

    private final RoleRepository roleRepo;
    private final UserRepository userRepo;
    private final HotelRepository hotels;
    private final AmenityRepository amenities;

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
}
