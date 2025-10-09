package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "task_id")
	private Long taskId;

	@Column(name = "staff_id", nullable = false)
	private Long staffId;

	@Column(name = "room_id")
	private Integer roomId;

	@Column(name = "res_service_id")
	private Long resServiceId;

	@Enumerated(EnumType.STRING)
	@Column(name = "type", nullable = false)
	private TaskType type;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false)
	private TaskStatus status = TaskStatus.PENDING;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt = LocalDateTime.now();

	// Relaciones
	@JsonIgnore
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "staff_id", insertable = false, updatable = false)
	private StaffMember staff;

	@JsonIgnore
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "room_id", insertable = false, updatable = false)
	private Room room;

	// Enums
	public enum TaskType {
		DELIVERY, GUIDING, TO_DO
	}

	public enum TaskStatus {
		PENDING, IN_PROGRESS, DONE, CANCELED
	}
}
