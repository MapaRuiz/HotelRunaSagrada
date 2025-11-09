package com.runasagrada.hotelapi.DTOs;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HotelRequest {
    private String name;
    private String latitude;
    private String longitude;
    private String description;

    // NUEVOS
    private String checkInAfter; // "15:00"
    private String checkOutBefore; // "12:00"
    private String image; // ruta/URL

    // null = no tocar; [] = limpiar; valores = reemplazar
    private List<Integer> amenityIds;
}
