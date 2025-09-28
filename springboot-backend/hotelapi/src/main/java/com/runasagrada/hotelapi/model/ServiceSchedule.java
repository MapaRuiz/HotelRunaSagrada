package com.runasagrada.hotelapi.model;

import java.time.LocalTime;
import java.util.EnumSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_schedule_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private ServiceOffering service;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "service_schedule_days", joinColumns = @JoinColumn(name = "service_schedule_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 16)
    @Schema(name = "day_of_week")
    private Set<DayWeek> daysOfWeek = EnumSet.noneOf(DayWeek.class);

    public enum DayWeek {
        MONDAY,
        TUESDAY,
        WEDNESDAY,
        THURSDAY,
        FRIDAY,
        SATURDAY,
        SUNDAY,
        DAILY
    }

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    @Column(name = "start_time", nullable = false)
    @Schema(name = "start_time")
    private LocalTime startTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    @Column(name = "end_time", nullable = false)
    @Schema(name = "end_time")
    private LocalTime endTime;

    @Column(name = "is_active", nullable = false)
    @Schema(name = "is_active")
    private boolean isActive;
}
