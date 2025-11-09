package com.runasagrada.hotelapi.DTOs;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class PaymentRequest {
    private Integer reservationId;
    private Integer paymentMethodId;
    private double amount;
    private String status;
    @JsonProperty("tx_reference")
    private String txReference;
}
