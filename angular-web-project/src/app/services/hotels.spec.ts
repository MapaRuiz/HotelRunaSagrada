import { TestBed } from '@angular/core/testing';

import { Hotels } from './hotels';

describe('Hotels', () => {
  let service: Hotels;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Hotels);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
