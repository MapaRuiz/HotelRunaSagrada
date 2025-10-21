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

import java.time.LocalDateTime;
import java.time.YearMonth;
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
		return payments.findByReservationId_ReservationId(reservationId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Payment> getByPaymentMethodId(Integer paymentMethodId) {
		return payments.findByPaymentMethodId_PaymentMethodId(paymentMethodId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Payment> getByStatus(String status) {
		return payments.findByStatus(status);
	}

	@Override
	public Payment create(Payment payment) {
		if (payment.getReservationId() == null || payment.getReservationId().getReservationId() == null)
			throw new IllegalArgumentException("Reservation is required");
		if (payment.getPaymentMethodId() == null || payment.getPaymentMethodId().getPaymentMethodId() == null)
			throw new IllegalArgumentException("Payment method is required");
		if (payment.getAmount() <= 0)
			throw new IllegalArgumentException("Amount must be greater than 0");
		if (payment.getStatus() == null || payment.getStatus().isBlank())
			throw new IllegalArgumentException("Status is required");

		// Verificar que la reservación existe
		Reservation reservation = reservations.findById(payment.getReservationId().getReservationId())
				.orElseThrow(() -> new NoSuchElementException("Reservation not found"));
		payment.setReservationId(reservation);

		// Verificar que el método de pago existe
		PaymentMethod paymentMethod = paymentMethods.findById(payment.getPaymentMethodId().getPaymentMethodId())
				.orElseThrow(() -> new NoSuchElementException("Payment method not found"));
		payment.setPaymentMethodId(paymentMethod);

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
		if (partial.getPaymentMethodId() != null && partial.getPaymentMethodId().getPaymentMethodId() != null) {
			PaymentMethod paymentMethod = paymentMethods.findById(partial.getPaymentMethodId().getPaymentMethodId())
					.orElseThrow(() -> new NoSuchElementException("Payment method not found"));
			db.setPaymentMethodId(paymentMethod);
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

	@Override
	public double[] calculateIncome() {
		List<Payment> payments = this.payments.findAll();

		LocalDateTime now = LocalDateTime.now();
		YearMonth currentMonth = YearMonth.from(now);
		YearMonth previousMonth = currentMonth.minusMonths(1);

		double currentIncome = 0.0;
		double previousIncome = 0.0;

		for (Payment p : payments) {
			if (p == null || p.getStatus() == null || p.getCreatedAt() == null)
				continue;
			String status = p.getStatus().trim().toLowerCase();

			if (!status.equals("paid"))
				continue;

			LocalDateTime created = p.getCreatedAt().toLocalDateTime();
			YearMonth paymentMonth = YearMonth.from(created);

			if (paymentMonth.equals(currentMonth)) {
				currentIncome += p.getAmount();
			} else if (paymentMonth.equals(previousMonth)) {
				previousIncome += p.getAmount();
			}
		}

		double delta = 0.0;
		if (previousIncome > 0) {
			delta = ((currentIncome - previousIncome) / previousIncome) * 100.0;
		} else if (currentIncome > 0) {
			delta = 100.0;
		}

		delta = Math.round(delta * 10.0) / 10.0;

		return new double[] { currentIncome, delta };
	}

}
