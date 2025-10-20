package com.runasagrada.hotelapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentMethod {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer methodId;

	@OneToOne
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	private String type;

	private Integer lastfour;

	private String holderName;

	private String billingAddress;

}
