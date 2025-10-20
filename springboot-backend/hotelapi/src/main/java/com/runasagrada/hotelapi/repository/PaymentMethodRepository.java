package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Integer> {
	List<PaymentMethod> findByUserId(Integer userId);
}
