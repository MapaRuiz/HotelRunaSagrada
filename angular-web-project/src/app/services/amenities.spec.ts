import { TestBed } from '@angular/core/testing';

import { Amenities } from './amenities';

describe('Amenities', () => {
  let service: Amenities;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Amenities);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
