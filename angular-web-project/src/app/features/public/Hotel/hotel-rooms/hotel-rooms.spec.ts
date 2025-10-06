import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelRooms } from './hotel-rooms';

describe('HotelRooms', () => {
  let component: HotelRooms;
  let fixture: ComponentFixture<HotelRooms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelRooms]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelRooms);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
