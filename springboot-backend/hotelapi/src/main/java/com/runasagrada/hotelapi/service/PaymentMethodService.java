package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.PaymentMethod;

import java.util.List;

public interface PaymentMethodService {
    List<PaymentMethod> list();
    
    PaymentMethod getById(Integer id);
    
    List<PaymentMethod> getByUserId(Integer userId);

    PaymentMethod create(PaymentMethod paymentMethod);

    PaymentMethod update(Integer id, PaymentMethod partial);

    void delete(Integer id);
}
