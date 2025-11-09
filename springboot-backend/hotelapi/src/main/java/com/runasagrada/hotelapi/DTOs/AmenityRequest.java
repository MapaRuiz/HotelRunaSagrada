package com.runasagrada.hotelapi.DTOs;

import com.runasagrada.hotelapi.model.AmenityType;

import lombok.Data;

@Data
public class AmenityRequest {
    private String name;
    private String image;
    private AmenityType type;
}