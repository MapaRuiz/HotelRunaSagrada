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



	@GetMapping("/payments/reservation/{reservationId}/all-paid")
	public ResponseEntity<PaymentStatusSummary> allPaidForReservation(@PathVariable Integer reservationId) {
		List<Payment> list = service.getByReservationId(reservationId);
		int paidCount = (int) list.stream()
				.filter(p -> p.getStatus() != null && p.getStatus().equalsIgnoreCase("PAID"))
				.count();
		boolean allPaid = list.isEmpty() || paidCount == list.size();
		PaymentStatusSummary dto = new PaymentStatusSummary(
				reservationId,
				list.size(),
				paidCount,
				allPaid);
		return ResponseEntity.ok(dto);
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
		payment.setReservationId(reservation);

		PaymentMethod paymentMethod = new PaymentMethod();
		paymentMethod.setPaymentMethodId(body.getPaymentMethodId());
		payment.setPaymentMethodId(paymentMethod);

		payment.setAmount(body.getAmount());
		payment.setStatus(body.getStatus());

		return ResponseEntity.ok(service.create(payment));
	}

	@PutMapping("/payments/{id}")
	public ResponseEntity<Payment> update(@PathVariable Integer id, @RequestBody PaymentRequest body) {
		Payment partial = new Payment();

		if (body.getPaymentMethodId() != null) {
			PaymentMethod paymentMethod = new PaymentMethod();
			paymentMethod.setPaymentMethodId(body.getPaymentMethodId());
			partial.setPaymentMethodId(paymentMethod);
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

	@GetMapping("/payments/income")
	public double[] getIncome() {
		return service.calculateIncome();
	}

	@Data
	public static class PaymentRequest {
		private Integer reservationId;
		private Integer paymentMethodId;
		private double amount;
		private String status;
	}

	@Data
	public static class PaymentStatusSummary {
		private final Integer reservationId;
		private final int total;
		private final int paid;
		private final boolean allPaid;
	}
}
