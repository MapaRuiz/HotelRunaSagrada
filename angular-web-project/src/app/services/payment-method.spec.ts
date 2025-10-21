import { TestBed } from '@angular/core/testing';

import { PaymentMethod } from './payment-method';

describe('PaymentMethod', () => {
  let service: PaymentMethod;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentMethod);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
