package com.runasagrada.hotelapi.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.runasagrada.hotelapi.model.PaymentMethod;
import com.runasagrada.hotelapi.model.User;
import com.runasagrada.hotelapi.service.PaymentMethodService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class PaymentMethodController {

	@Autowired
	private PaymentMethodService service;

	@GetMapping("/payment-methods")
	public List<PaymentMethod> list() {
		return service.list();
	}

	@GetMapping("/payment-methods/{id}")
	public ResponseEntity<PaymentMethod> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(service.getById(id));
	}

	@GetMapping("/payment-methods/user/{userId}")
	public List<PaymentMethod> getByUserId(@PathVariable Integer userId) {
		return service.getByUserId(userId);
	}

	@PostMapping("/payment-methods")
	public ResponseEntity<PaymentMethod> create(@RequestBody PaymentMethodRequest body) {
		PaymentMethod pm = new PaymentMethod();
		User user = new User();
		user.setUserId(body.getUserId());
		pm.setUserId(user);
		pm.setType(body.getType());
		pm.setLastfour(body.getLastfour());
		pm.setHolderName(body.getHolderName());
		pm.setBillingAddress(body.getBillingAddress());
		return ResponseEntity.ok(service.create(pm));
	}

	@PutMapping("/payment-methods/{id}")
	public ResponseEntity<PaymentMethod> update(@PathVariable Integer id, @RequestBody PaymentMethodRequest body) {
		PaymentMethod partial = new PaymentMethod();
		partial.setType(body.getType());
		partial.setLastfour(body.getLastfour());
		partial.setHolderName(body.getHolderName());
		partial.setBillingAddress(body.getBillingAddress());
		return ResponseEntity.ok(service.update(id, partial));
	}

	@DeleteMapping("/payment-methods/{id}")
	public ResponseEntity<Void> delete(@PathVariable Integer id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

@Data
public static class PaymentMethodRequest {
    private Integer userId;
    private String type;

    @JsonProperty("last4")
    private String lastfour;

    @JsonProperty("holder_name")
    private String holderName;

    @JsonProperty("billing_address")
    private String billingAddress;
}

}
