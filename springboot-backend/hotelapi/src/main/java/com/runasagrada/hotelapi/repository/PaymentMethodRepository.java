package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Integer> {
	List<PaymentMethod> findByUserId_UserId(Integer userId);


	 @Query("SELECT p FROM PaymentMethod p WHERE p.userId.userId = :userId AND p.active = true")
    List<PaymentMethod> findActiveByUserId(@Param("userId") Integer userId);

    
    @Transactional
    @Modifying
    @Query("UPDATE PaymentMethod p SET p.active = false WHERE p.paymentMethodId = :id")
    void deactivateById(@Param("id") Integer id);
}
