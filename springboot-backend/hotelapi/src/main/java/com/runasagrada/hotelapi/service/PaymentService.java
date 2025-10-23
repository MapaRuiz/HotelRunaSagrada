package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Payment;

import java.util.List;

public interface PaymentService {
	List<Payment> list();

	Payment getById(Integer id);

	List<Payment> getByReservationId(Integer reservationId);

	List<Payment> getByPaymentMethodId(Integer paymentMethodId);

	List<Payment> getByStatus(String status);

	Payment create(Payment payment);

	Payment update(Integer id, Payment partial);

	void delete(Integer id);

	double[] calculateIncome();

	double[] calculateIncome(Long hotelId);

	void deleteByReservationId(Integer reservationId);
}
