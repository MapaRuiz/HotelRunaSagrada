import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomRv } from './room-rv';

describe('RoomRv', () => {
  let component: RoomRv;
  let fixture: ComponentFixture<RoomRv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomRv]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomRv);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
