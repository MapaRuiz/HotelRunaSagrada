import { TestBed } from '@angular/core/testing';

import { Department } from './department';

describe('Department', () => {
  let service: Department;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Department);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
