package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Payment;
import com.runasagrada.hotelapi.model.PaymentMethod;
import com.runasagrada.hotelapi.model.Reservation;
import com.runasagrada.hotelapi.repository.PaymentMethodRepository;
import com.runasagrada.hotelapi.repository.PaymentRepository;
import com.runasagrada.hotelapi.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

	@Autowired
	private PaymentRepository payments;

	@Autowired
	private ReservationRepository reservations;

	@Autowired
	private PaymentMethodRepository paymentMethods;

	@Autowired
	private ServiceHelper helper;

	@Override
	@Transactional(readOnly = true)
	public List<Payment> list() {
		return payments.findAll(Sort.by(Sort.Direction.ASC, "paymentId"));
	}

	@Override
	@Transactional(readOnly = true)
	public Payment getById(Integer id) {
		return payments.findById(id)
				.orElseThrow(() -> new NoSuchElementException("Payment not found"));
	}

	@Override
	@Transactional(readOnly = true)
	public List<Payment> getByReservationId(Integer reservationId) {
		return payments.findByReservationId(reservationId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Payment> getByPaymentMethodId(Integer paymentMethodId) {
		return payments.findByPaymentMethodId(paymentMethodId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Payment> getByStatus(String status) {
		return payments.findByStatus(status);
	}

	@Override
	public Payment create(Payment payment) {
		if (payment.getReservation() == null || payment.getReservation().getReservationId() == null)
			throw new IllegalArgumentException("Reservation is required");
		if (payment.getPaymentMethod() == null || payment.getPaymentMethod().getMethodId() == null)
			throw new IllegalArgumentException("Payment method is required");
		if (payment.getAmount() <= 0)
			throw new IllegalArgumentException("Amount must be greater than 0");
		if (payment.getStatus() == null || payment.getStatus().isBlank())
			throw new IllegalArgumentException("Status is required");

		// Verificar que la reservación existe
		Reservation reservation = reservations.findById(payment.getReservation().getReservationId())
				.orElseThrow(() -> new NoSuchElementException("Reservation not found"));
		payment.setReservation(reservation);

		// Verificar que el método de pago existe
		PaymentMethod paymentMethod = paymentMethods.findById(payment.getPaymentMethod().getMethodId())
				.orElseThrow(() -> new NoSuchElementException("Payment method not found"));
		payment.setPaymentMethod(paymentMethod);

		helper.resyncIdentity("payment", "payment_id");
		return payments.save(payment);
	}

	@Override
	public Payment update(Integer id, Payment partial) {
		Payment db = payments.findById(id)
				.orElseThrow(() -> new NoSuchElementException("Payment not found"));

		if (partial.getAmount() > 0)
			db.setAmount(partial.getAmount());
		if (partial.getStatus() != null && !partial.getStatus().isBlank())
			db.setStatus(partial.getStatus());

		// Permitir actualizar método de pago
		if (partial.getPaymentMethod() != null && partial.getPaymentMethod().getMethodId() != null) {
			PaymentMethod paymentMethod = paymentMethods.findById(partial.getPaymentMethod().getMethodId())
					.orElseThrow(() -> new NoSuchElementException("Payment method not found"));
			db.setPaymentMethod(paymentMethod);
		}

		return payments.save(db);
	}

	@Override
	public void delete(Integer id) {
		Payment payment = payments.findById(id)
				.orElseThrow(() -> new NoSuchElementException("Payment not found"));
		payments.delete(payment);
		helper.resyncIdentity("payment", "payment_id");
	}
}
