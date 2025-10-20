package com.runasagrada.hotelapi.controller;

import com.runasagrada.hotelapi.model.Payment;
import com.runasagrada.hotelapi.model.PaymentMethod;
import com.runasagrada.hotelapi.model.Reservation;
import com.runasagrada.hotelapi.service.PaymentService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class PaymentController {

	@Autowired
	private PaymentService service;

	@GetMapping("/payments")
	public List<Payment> list() {
		return service.list();
	}

	@GetMapping("/payments/{id}")
	public ResponseEntity<Payment> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(service.getById(id));
	}

	@GetMapping("/payments/reservation/{reservationId}")
	public List<Payment> getByReservationId(@PathVariable Integer reservationId) {
		return service.getByReservationId(reservationId);
	}

	@GetMapping("/payments/payment-method/{paymentMethodId}")
	public List<Payment> getByPaymentMethodId(@PathVariable Integer paymentMethodId) {
		return service.getByPaymentMethodId(paymentMethodId);
	}

	@GetMapping("/payments/status/{status}")
	public List<Payment> getByStatus(@PathVariable String status) {
		return service.getByStatus(status);
	}

	@PostMapping("/payments")
	public ResponseEntity<Payment> create(@RequestBody PaymentRequest body) {
		Payment payment = new Payment();

		Reservation reservation = new Reservation();
		reservation.setReservationId(body.getReservationId());
		payment.setReservation(reservation);

		PaymentMethod paymentMethod = new PaymentMethod();
		paymentMethod.setMethodId(body.getPaymentMethodId());
		payment.setPaymentMethod(paymentMethod);

		payment.setAmount(body.getAmount());
		payment.setStatus(body.getStatus());

		return ResponseEntity.ok(service.create(payment));
	}

	@PutMapping("/payments/{id}")
	public ResponseEntity<Payment> update(@PathVariable Integer id, @RequestBody PaymentRequest body) {
		Payment partial = new Payment();

		if (body.getPaymentMethodId() != null) {
			PaymentMethod paymentMethod = new PaymentMethod();
			paymentMethod.setMethodId(body.getPaymentMethodId());
			partial.setPaymentMethod(paymentMethod);
		}

		partial.setAmount(body.getAmount());
		partial.setStatus(body.getStatus());

		return ResponseEntity.ok(service.update(id, partial));
	}

	@DeleteMapping("/payments/{id}")
	public ResponseEntity<Void> delete(@PathVariable Integer id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

	@Data
	public static class PaymentRequest {
		private Integer reservationId;
		private Integer paymentMethodId;
		private double amount;
		private String status;
	}
}
