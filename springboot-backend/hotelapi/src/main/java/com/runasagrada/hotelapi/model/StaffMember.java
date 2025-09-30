package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "staff_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffMember {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "staff_id")
	private Long staffId;

	@Column(name = "user_id", nullable = false)
	private Integer userId;

	@Column(name = "hotel_id", nullable = false)
	private Long hotelId;

	@Column(name = "department_id", nullable = false)
	private Long departmentId;

	// Relaciones
	@JsonIgnore
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", insertable = false, updatable = false)
	private User user;

	@JsonIgnore
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "hotel_id", insertable = false, updatable = false)
	private Hotel hotel;

	@JsonIgnore
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "department_id", insertable = false, updatable = false)
	private Department department;

	@JsonIgnore
	@OneToMany(mappedBy = "staff", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Task> tasks = new ArrayList<>();
}