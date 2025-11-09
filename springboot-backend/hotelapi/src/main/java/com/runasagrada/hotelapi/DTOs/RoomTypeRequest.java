package com.runasagrada.hotelapi.DTOs;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class RoomTypeRequest {
    private String name;
    private Integer capacity;
    private BigDecimal basePrice;
    private String description;
    private String image;
}
