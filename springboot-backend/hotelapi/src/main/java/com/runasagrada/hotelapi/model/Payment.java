package com.runasagrada.hotelapi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

	@ManyToOne
	@JoinColumn(name = "reservation_id", nullable = false)
	@JsonIgnore
	private Reservation reservationId;

	@ManyToOne
	@JoinColumn(name = "payment_method_id", nullable = false)
	@JsonIgnore
	private PaymentMethod paymentMethodId;

	private double amount;

	private String status;

}
