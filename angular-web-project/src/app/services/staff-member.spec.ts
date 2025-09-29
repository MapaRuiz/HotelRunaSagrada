import { TestBed } from '@angular/core/testing';

import { StaffMember } from './staff-member';

describe('StaffMember', () => {
  let service: StaffMember;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaffMember);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
