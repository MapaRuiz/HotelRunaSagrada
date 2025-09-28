package com.runasagrada.hotelapi.model;

import java.io.Serializable;
import java.time.LocalDate;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomLockId implements Serializable {
    private Integer roomId;
    private LocalDate lockDate;
}
