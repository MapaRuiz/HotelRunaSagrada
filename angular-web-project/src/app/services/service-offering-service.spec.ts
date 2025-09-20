import { TestBed } from '@angular/core/testing';

import { ServiceOfferingService } from './service-offering-service';

describe('ServiceOfferingService', () => {
  let service: ServiceOfferingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceOfferingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
