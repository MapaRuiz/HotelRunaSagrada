package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Amenity;
import com.runasagrada.hotelapi.model.Hotel;
import com.runasagrada.hotelapi.repository.AmenityRepository;
import com.runasagrada.hotelapi.repository.HotelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private JdbcTemplate jdbc;

    private void resyncIdentity(String table, String idCol) {
        try {
            Integer max = jdbc.queryForObject(
                    "SELECT COALESCE(MAX(" + idCol + "),0) FROM " + table, Integer.class);
            int next = (max == null ? 0 : max) + 1;
            jdbc.execute("ALTER TABLE " + table + " ALTER COLUMN " + idCol + " RESTART WITH " + next);
        } catch (Exception ignored) {
            // Si no es H2 u otra BD no soporta el ALTER, se ignora silenciosamente.
        }
    }

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
        resyncIdentity("hotels", "hotel_id");
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
    public void delete(Long id) {
        Hotel db = get(id);
        db.getAmenities().clear();
        hotels.delete(db);
        resyncIdentity("hotels", "hotel_id");
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
}
