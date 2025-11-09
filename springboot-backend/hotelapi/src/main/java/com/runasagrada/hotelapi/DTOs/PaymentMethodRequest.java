package com.runasagrada.hotelapi.DTOs;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class PaymentMethodRequest {
    private Integer userId;
    private String type;

    @JsonProperty("last4")
    private String lastfour;

    @JsonProperty("holder_name")
    private String holderName;

    @JsonProperty("billing_address")
    private String billingAddress;
}
