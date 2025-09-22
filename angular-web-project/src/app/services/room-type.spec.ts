import { TestBed } from '@angular/core/testing';

import { RoomType } from './room-type';

describe('RoomType', () => {
  let service: RoomType;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoomType);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
