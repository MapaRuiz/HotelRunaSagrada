package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Payment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
	List<Payment> findByReservationId(Integer reservationId);

	List<Payment> findByPaymentMethodId(Integer paymentMethodId);

	List<Payment> findByStatus(String status);
}
