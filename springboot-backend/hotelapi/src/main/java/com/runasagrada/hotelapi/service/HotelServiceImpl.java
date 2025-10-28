package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Amenity;
import com.runasagrada.hotelapi.model.Hotel;
import com.runasagrada.hotelapi.repository.AmenityRepository;
import com.runasagrada.hotelapi.repository.HotelRepository;
import com.runasagrada.hotelapi.repository.DepartmentRepository;
import com.runasagrada.hotelapi.repository.StaffMemberRepository;
import com.runasagrada.hotelapi.repository.ServiceOfferingRepository;
import com.runasagrada.hotelapi.repository.RoomRepository;
import com.runasagrada.hotelapi.repository.ReservationRepository;
import com.runasagrada.hotelapi.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class HotelServiceImpl implements HotelService {

    @Autowired
    private HotelRepository hotels;

    @Autowired
    private AmenityRepository amenities;
    @Autowired
    private ServiceHelper helper;
    @Autowired
    private DepartmentRepository departmentRepo;
    @Autowired
    private StaffMemberRepository staffMemberRepo;
    @Autowired
    private ServiceOfferingRepository serviceOfferingRepo;
    @Autowired
    private RoomRepository roomRepo;
    @Autowired
    private ReservationRepository reservationRepo;
    @Autowired
    private ReservationService reservationService;
    @Autowired
    private TaskRepository taskRepo;

    @Override
    @Transactional(readOnly = true)
    public List<Hotel> list() {
        return hotels.findAll(Sort.by(Sort.Direction.ASC, "hotelId"));
    }

    @Override
    @Transactional(readOnly = true)
    public Hotel get(Long id) {
        return hotels.findById(id).orElseThrow(() -> new NoSuchElementException("Hotel not found"));
    }

    @Override
    public Hotel create(Hotel h, List<Integer> amenityIds) {
        validate(h);
        if (h.getHotelId() != null)
            h.setHotelId(null);
        if (amenityIds != null)
            h.setAmenities(resolve(amenityIds));
        helper.resyncIdentity("hotels", "hotel_id");
        return hotels.save(h);
    }

    @Override
    public Hotel update(Long id, Hotel partial, List<Integer> amenityIds) {
        Hotel db = get(id);

        if (partial.getName() != null && !partial.getName().isBlank())
            db.setName(partial.getName());
        if (partial.getLatitude() != null)
            db.setLatitude(partial.getLatitude());
        if (partial.getLongitude() != null)
            db.setLongitude(partial.getLongitude());
        if (partial.getDescription() != null)
            db.setDescription(partial.getDescription());

        // NUEVOS
        if (partial.getCheckInAfter() != null)
            db.setCheckInAfter(partial.getCheckInAfter());
        if (partial.getCheckOutBefore() != null)
            db.setCheckOutBefore(partial.getCheckOutBefore());
        if (partial.getImage() != null)
            db.setImage(partial.getImage());

        // null = no tocar; [] = limpiar; valores = reemplazar
        if (amenityIds != null)
            db.setAmenities(resolve(amenityIds));

        validate(db);
        return hotels.save(db);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Hotel db = get(id);
        
        // 1. Eliminar reservaciones del hotel (esto elimina payments, services, room locks)
        var reservations = reservationRepo.findByHotelHotelId(id);
        for (var reservation : reservations) {
            reservationService.delete(reservation.getReservationId());
        }
        
        // 2. Eliminar tasks asociadas a staff members y rooms de este hotel
        var staffMembers = staffMemberRepo.findByHotelId(id);
        for (var staffMember : staffMembers) {
            taskRepo.deleteByStaffId(staffMember.getStaffId());
        }
        
        var rooms = roomRepo.findByHotelId(id);
        for (var room : rooms) {
            taskRepo.deleteByRoomId(room.getRoomId());
        }
        
        // 3. Eliminar staff members del hotel
        if (!staffMembers.isEmpty()) {
            staffMemberRepo.deleteAll(staffMembers);
        }
        
        // 4. Eliminar service offerings del hotel
        var serviceOfferings = serviceOfferingRepo.findByHotel_HotelId(id);
        if (!serviceOfferings.isEmpty()) {
            serviceOfferingRepo.deleteAll(serviceOfferings);
        }
        
        // 5. Eliminar rooms del hotel
        if (!rooms.isEmpty()) {
            roomRepo.deleteAll(rooms);
        }
        
        // 6. Eliminar departments del hotel
        var departments = departmentRepo.findByHotelId(id);
        if (!departments.isEmpty()) {
            departmentRepo.deleteAll(departments);
        }
        
        // 7. Limpiar amenities (relación many-to-many)
        db.getAmenities().clear();
        
        // 8. Finalmente eliminar el hotel
        hotels.delete(db);
        helper.resyncIdentity("hotels", "hotel_id");
    }

    private void validate(Hotel h) {
        if (h.getName() == null || h.getName().isBlank())
            throw new IllegalArgumentException("Hotel name is required");
        // Opcional: validar formato HH:mm
        if (h.getCheckInAfter() != null && !h.getCheckInAfter().matches("^\\d{1,2}:\\d{2}$"))
            throw new IllegalArgumentException("checkInAfter must be HH:mm");
        if (h.getCheckOutBefore() != null && !h.getCheckOutBefore().matches("^\\d{1,2}:\\d{2}$"))
            throw new IllegalArgumentException("checkOutBefore must be HH:mm");
    }

    private Set<Amenity> resolve(List<Integer> ids) {
        if (ids.isEmpty())
            return new HashSet<>();
        List<Amenity> found = amenities.findAllById(ids);
        Set<Integer> foundIds = found.stream().map(Amenity::getAmenityId).collect(Collectors.toSet());
        List<Integer> missing = ids.stream().filter(i -> !foundIds.contains(i)).toList();
        if (!missing.isEmpty())
            throw new NoSuchElementException("Amenities not found: " + missing);
        return new HashSet<>(found);
    }

    @Override
    public Map<Long, String> getHotelsIdName() {
        List<Hotel> hotels = this.list();
        return hotels.stream().map(h -> Map.entry(h.getHotelId(), h.getName()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    @Override
    public Map<String, Long> amenitiesCountByHotel() {
        List<Object[]> rows = hotels.countAmenitiesByHotel();

        Map<String, Long> out = new LinkedHashMap<>();
        for (Object[] r : rows) {
            String hotelName = (String) r[0];
            Long count = (r[1] instanceof Number n) ? n.longValue() : 0L;
            out.put(hotelName, count);
        }
        return out;
    }
}
