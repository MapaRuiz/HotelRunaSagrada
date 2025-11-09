package com.runasagrada.hotelapi.DTOs;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class ServiceOfferingRequest {
    private String name;
    private String category;
    private String subcategory;
    private String description;
    private double basePrice;
    private int durationMinutes;
    private List<String> imageUrls;
    private int maxParticipants;
    private double latitude;
    private double longitude;
    @JsonProperty("hotel_id")
    private Long hotelId;
}