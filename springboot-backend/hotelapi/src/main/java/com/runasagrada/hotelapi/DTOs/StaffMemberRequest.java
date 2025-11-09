package com.runasagrada.hotelapi.DTOs;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StaffMemberRequest {
    private Integer userId;
    private Long hotelId;
    private Long departmentId;
    private String name;
}
