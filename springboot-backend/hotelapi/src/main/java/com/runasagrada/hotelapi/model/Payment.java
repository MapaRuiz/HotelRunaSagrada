package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer paymentId;

	@OneToOne
	@JoinColumn(name = "reservation_id", nullable = false)
	private Reservation reservation;

	@OneToOne
	@JoinColumn(name = "payment_method_id", nullable = false)
	private PaymentMethod paymentMethod;

	private double amount;

	private String Status;

}
