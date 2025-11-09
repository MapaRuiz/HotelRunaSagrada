package com.runasagrada.hotelapi.DTOs;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DepartmentRequest {
    private Long hotelId;
    private String name;
}