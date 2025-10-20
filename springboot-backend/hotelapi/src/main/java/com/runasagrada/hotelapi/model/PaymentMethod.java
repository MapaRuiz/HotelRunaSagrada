package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentMethod {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer paymentMethodId;

	@ManyToOne
	@JoinColumn(name = "user_id", nullable = false)
	@JsonIgnore
	private User userId;

	private String type;

	private Integer lastfour;

	private String holderName;

	private String billingAddress;

}
