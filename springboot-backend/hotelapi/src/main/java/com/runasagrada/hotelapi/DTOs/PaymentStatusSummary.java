package com.runasagrada.hotelapi.DTOs;

import lombok.Data;

@Data
public class PaymentStatusSummary {
    private final Integer reservationId;
    private final int total;
    private final int paid;
    private final boolean allPaid;
}
