package com.runasagrada.hotelapi.DTOs;

import lombok.Data;

@Data
public class LoginRequest {
    String email;
    String password;
}
