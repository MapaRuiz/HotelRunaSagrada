package com.runasagrada.hotelapi.model;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "service_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceSchedule {
    @Id
    @GeneratedValue
    @Column(name = "service_schedule_id")
    private Long id;

    @ManyToOne
    private ServiceOffering service;

    @Column(name = "date", nullable = false)
    private String daysOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;
}
