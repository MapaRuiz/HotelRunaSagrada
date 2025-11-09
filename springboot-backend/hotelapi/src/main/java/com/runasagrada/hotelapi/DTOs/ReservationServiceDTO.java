package com.runasagrada.hotelapi.DTOs;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.runasagrada.hotelapi.model.ReservationServiceEntity;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class ReservationServiceDTO {
    // Explicit identifier for row mapping on the frontend
    private Long resServiceId;
    @Schema(name = "reservation_id")
    private Long reservationId;
    @Schema(name = "service_id")
    private Long serviceId;
    @Schema(name = "schedule_id")
    private Long scheduleId;
    private Integer qty;
    @Schema(name = "unit_price")
    private Double unitPrice;
    private ReservationServiceEntity.Status status;

    public static ReservationServiceDTO from(ReservationServiceEntity rService) {
        return new ReservationServiceDTO(
                rService.getId(),
                rService.getReservation().getReservationId().longValue(),
                rService.getService().getId(),
                rService.getSchedule() != null ? rService.getSchedule().getId() : null,
                rService.getQty(),
                rService.getUnitPrice(),
                rService.getStatus());
    }

    public boolean hasRequiredIdentifiers() {
        return hasReservationId() && hasServiceId();
    }

    public boolean hasReservationId() {
        return reservationId != null;
    }

    public boolean hasServiceId() {
        return serviceId != null;
    }

    public boolean hasScheduleId() {
        return scheduleId != null;
    }
}
