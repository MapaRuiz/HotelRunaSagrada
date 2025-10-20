package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.PaymentMethod;
import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.repository.PaymentMethodRepository;
import com.runasagrada.hotelapi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class PaymentMethodServiceImpl implements PaymentMethodService {

	@Autowired
	private PaymentMethodRepository paymentMethods;

	@Autowired
	private UserRepository users;

	@Autowired
	private ServiceHelper helper;

	@Override
	@Transactional(readOnly = true)
	public List<PaymentMethod> list() {
		return paymentMethods.findAll(Sort.by(Sort.Direction.ASC, "methodId"));
	}

	@Override
	@Transactional(readOnly = true)
	public PaymentMethod getById(Integer id) {
		return paymentMethods.findById(id)
				.orElseThrow(() -> new NoSuchElementException("Payment method not found"));
	}

	@Override
	@Transactional(readOnly = true)
	public List<PaymentMethod> getByUserId(Integer userId) {
		return paymentMethods.findByUserId(userId);
	}

	@Override
	public PaymentMethod create(PaymentMethod pm) {
		if (pm.getUserId() == null || pm.getUserId().getUserId() == null)
			throw new IllegalArgumentException("User is required");
		if (pm.getType() == null || pm.getType().isBlank())
			throw new IllegalArgumentException("Payment method type is required");
		if (pm.getHolderName() == null || pm.getHolderName().isBlank())
			throw new IllegalArgumentException("Holder name is required");

		// Verificar que el usuario existe
		User user = users.findById(pm.getUserId().getUserId())
				.orElseThrow(() -> new NoSuchElementException("User not found"));
		pm.setUserId(user);

		helper.resyncIdentity("payment_method", "method_id");
		return paymentMethods.save(pm);
	}

	@Override
	public PaymentMethod update(Integer id, PaymentMethod partial) {
		PaymentMethod db = paymentMethods.findById(id)
				.orElseThrow(() -> new NoSuchElementException("Payment method not found"));

		if (partial.getType() != null && !partial.getType().isBlank())
			db.setType(partial.getType());
		if (partial.getLastfour() != null)
			db.setLastfour(partial.getLastfour());
		if (partial.getHolderName() != null && !partial.getHolderName().isBlank())
			db.setHolderName(partial.getHolderName());
		if (partial.getBillingAddress() != null)
			db.setBillingAddress(partial.getBillingAddress());

		return paymentMethods.save(db);
	}

	@Override
	public void delete(Integer id) {
		PaymentMethod pm = paymentMethods.findById(id)
				.orElseThrow(() -> new NoSuchElementException("Payment method not found"));
		paymentMethods.delete(pm);
		helper.resyncIdentity("payment_method", "method_id");
	}
}
