package com.runasagrada.hotelapi.DTOs;

import java.util.List;

import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    private String email;
    private String password;
    private String fullName;
    private String phone;
    private String nationalId;
    private String selectedPet;
    private Boolean enabled;
    private List<String> roles; // ['ADMIN','OPERATOR','CLIENT']
}