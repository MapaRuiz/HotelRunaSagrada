package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Payment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
	List<Payment> findByReservationId_ReservationId(Integer reservationId);

	List<Payment> findByPaymentMethodId_PaymentMethodId(Integer paymentMethodId);

	List<Payment> findByStatus(String status);
}
